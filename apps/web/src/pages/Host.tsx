import { useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { createActor, type Actor } from "xstate";
import { decryptState, encryptState, type NetworkMessage } from "@phish/shared";
import { gameMachine, currentRound } from "../machines/gameMachine";
import { useWebSocket } from "../hooks/useWebSocket";
import { useTimer } from "../hooks/useTimer";
import { useHostSounds } from "../hooks/useHostSounds";
import { getRoundProgress, toPlayerView, type GameSnapshot } from "../lib/view";
import { getHostGameLength, getHostToken } from "../lib/session";
import HostLayout from "../components/host/HostLayout";
import LobbyPhase from "../components/host/phases/LobbyPhase";
import TutorialPhase from "../components/host/phases/TutorialPhase";
import WritingPhase from "../components/host/phases/WritingPhase";
import VotingPhase from "../components/host/phases/VotingPhase";
import RevealPhase from "../components/host/phases/RevealPhase";
import LeaderboardPhase from "../components/host/phases/LeaderboardPhase";
import Logo from "../components/shared/Logo";

type GameActor = Actor<typeof gameMachine>;
type HostEvent = Parameters<GameActor["send"]>[0];
type Recovery = "pending" | "requesting" | "done";

/** Phase timers' full length, for the countdown ring */
function timerTotal(state: GameSnapshot): number | undefined {
  const { config } = state.context;
  if (state.matches("writing")) return config.writeSeconds;
  if (state.matches("voting")) return config.voteSeconds;
  if (state.matches("tutorial")) return 40;
  return undefined;
}

export default function Host() {
  const { code } = useParams<{ code: string }>();
  const roomCode = code!.toUpperCase();
  const [hostToken] = useState(() => getHostToken(roomCode));
  const [gameLength] = useState(() => getHostGameLength(roomCode) ?? undefined);

  const [recovery, setRecovery] = useState<Recovery>("pending");
  const recoveryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actorRef = useRef<GameActor | null>(null);
  const [state, setState] = useState<GameSnapshot | null>(null);

  // Scale rem units with the TV
  useEffect(() => {
    document.documentElement.classList.add("host-root");
    return () => document.documentElement.classList.remove("host-root");
  }, []);

  const initializeActor = useCallback(
    (snapshot?: GameSnapshot) => {
      actorRef.current?.stop();
      const actor = createActor(gameMachine, { snapshot, input: { gameLength, roomCode } });
      actor.subscribe(setState);
      actor.start();
      actorRef.current = actor;
      setState(actor.getSnapshot());
      setRecovery("done");
    },
    [gameLength, roomCode],
  );

  const send = useCallback((event: HostEvent) => actorRef.current?.send(event), []);

  const getConnectionParams = useCallback(() => (hostToken ? { token: hostToken } : null), [hostToken]);

  const handleMessage = (message: NetworkMessage) => {
    if (message.type === "HOST_CONNECTED") {
      if (recovery !== "pending") return;
      const players = (message.payload as { players: { id: string }[] }).players;
      if (players.length === 0) {
        initializeActor();
        return;
      }
      // Players exist, so the host page crashed or refreshed: ask a phone for the last state
      const donor = players[Math.floor(Math.random() * players.length)];
      setRecovery("requesting");
      recoveryTimeoutRef.current = setTimeout(() => initializeActor(), 5000);
      sendMessage({ type: "REQUEST_STATE_RECOVERY", target: donor.id, payload: {} });
      return;
    }

    if (message.type === "PROVIDE_STATE_RECOVERY") {
      if (recovery !== "requesting" || !hostToken) return;
      if (recoveryTimeoutRef.current) clearTimeout(recoveryTimeoutRef.current);
      const { encryptedHostState } = message.payload as { encryptedHostState: string };
      decryptState<GameSnapshot>(encryptedHostState, hostToken)
        .then((snapshot) => initializeActor(snapshot))
        .catch(() => initializeActor());
      return;
    }

    if (!actorRef.current) return;
    const payload = (message.payload as Record<string, unknown>) ?? {};
    send({ ...payload, type: message.type, senderId: message.senderId } as HostEvent);
  };

  const { isConnected, sendMessage } = useWebSocket({
    roomCode,
    getConnectionParams,
    onMessage: handleMessage,
  });

  useTimer(
    state?.context.timer ?? null,
    () => send({ type: "TIMER_TICK" }),
    () => send({ type: "TIMER_END" }),
  );
  useHostSounds(state);

  // Push each phone its own view, plus the encrypted full state for crash recovery
  useEffect(() => {
    if (!isConnected || !hostToken || !state || !actorRef.current || state.status === "stopped") return;
    const persisted = actorRef.current.getPersistedSnapshot();
    const broadcast = (encryptedHostState?: string) => {
      for (const target of Object.keys(state.context.players)) {
        sendMessage({
          type: "SYNC_STATE",
          target,
          payload: { ...toPlayerView(state, target), encryptedHostState },
        });
      }
    };
    encryptState(persisted, hostToken).then(broadcast, () => broadcast());
  }, [state, isConnected, sendMessage, hostToken]);

  if (!hostToken) {
    return (
      <div className="stage min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center">
        <Logo size="md" />
        <p className="text-2xl font-display">This isn't your kitchen.</p>
        <p className="text-paper/70">Host sessions live in the browser that created the room.</p>
        <a href="/" className="btn">Back to the shop</a>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="stage min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="animate-float">
          <Logo size="lg" />
        </div>
        <p className="font-display text-3xl text-paper/90">
          {recovery === "requesting" ? "Recovering your game from a phone…" : "Heating the fryer…"}
        </p>
      </div>
    );
  }

  const round = currentRound(state.context);
  const next = () => send({ type: "NEXT_PHASE" });

  return (
    <HostLayout
      roomCode={roomCode}
      isConnected={isConnected}
      timer={state.context.timer}
      timerTotal={timerTotal(state)}
      roundProgress={getRoundProgress(state)}
      phase={String(state.value)}
      onSkip={state.matches("lobby") || state.matches("leaderboard") ? undefined : next}
    >
      {state.matches("lobby") && (
        <LobbyPhase roomCode={roomCode} players={state.context.players} rounds={state.context.config.rounds} />
      )}
      {state.matches("tutorial") && <TutorialPhase />}
      {state.matches("writing") && round && <WritingPhase round={round} players={state.context.players} />}
      {state.matches("voting") && round && <VotingPhase round={round} players={state.context.players} />}
      {state.matches("reveal") && round && (
        <RevealPhase round={round} players={state.context.players} step={state.context.revealStep} />
      )}
      {state.matches("leaderboard") && (
        <LeaderboardPhase players={state.context.players} onPlayAgain={() => send({ type: "PLAY_AGAIN" })} />
      )}
    </HostLayout>
  );
}
