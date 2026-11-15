import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useCallback, useRef, useState } from "react";
import type { PlayerViewState } from "@phish/shared";
import { useWebSocket } from "../hooks/useWebSocket";
import { usePlayerSounds } from "../hooks/usePlayerSounds";
import { playSound } from "../lib/sound";
import { clearPlayerSession, getPlayerSession, updatePlayerSession } from "../lib/session";
import PlayerLayout from "../components/player/PlayerLayout";
import LobbyPhase from "../components/player/phases/LobbyPhase";
import TutorialPhase from "../components/player/phases/TutorialPhase";
import WritingPhase from "../components/player/phases/WritingPhase";
import VotingPhase from "../components/player/phases/VotingPhase";
import RevealPhase from "../components/player/phases/RevealPhase";
import LeaderboardPhase from "../components/player/phases/LeaderboardPhase";

type SyncPayload = PlayerViewState & { encryptedHostState?: string };

export default function Player() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const roomCode = code!.toUpperCase();

  const [view, setView] = useState<PlayerViewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const encryptedHostStateRef = useRef<string | null>(null);
  const [hasSession] = useState(() => !!getPlayerSession(roomCode));

  // Read on every (re)connect, so after the first join we reclaim the same player
  const getConnectionParams = useCallback(() => {
    const session = getPlayerSession(roomCode);
    if (!session) return null;
    const params: Record<string, string> = { name: session.name };
    if (session.playerId && session.token) {
      params.playerId = session.playerId;
      params.token = session.token;
    }
    return params;
  }, [roomCode]);

  const { isConnected, failedAttempts, sendMessage } = useWebSocket({
    roomCode,
    getConnectionParams,
    onMessage: (message) => {
      const payload = message.payload as Record<string, unknown>;
      if (message.type === "ROOM_JOINED") {
        updatePlayerSession(roomCode, {
          playerId: payload.playerId as string,
          token: payload.reconnectToken as string,
        });
        setError(null);
      } else if (message.type === "SYNC_STATE") {
        const { encryptedHostState, ...state } = payload as unknown as SyncPayload;
        setView(state);
        if (encryptedHostState) encryptedHostStateRef.current = encryptedHostState;
      } else if (message.type === "REQUEST_STATE_RECOVERY") {
        if (encryptedHostStateRef.current) {
          sendMessage({
            type: "PROVIDE_STATE_RECOVERY",
            target: "HOST",
            payload: { encryptedHostState: encryptedHostStateRef.current },
          });
        }
      } else if (message.type === "ERROR") {
        setError(payload.message as string);
      }
    },
  });

  usePlayerSounds(view);

  const toHost = (type: string, payload: object = {}) => {
    playSound("tap");
    sendMessage({ type, target: "HOST", payload });
  };

  const backToLobby = () => {
    const session = getPlayerSession(roomCode);
    clearPlayerSession(roomCode);
    navigate(`/?code=${roomCode}${session ? `&name=${encodeURIComponent(session.name)}` : ""}`);
  };

  if (!hasSession) return <Navigate to={`/?code=${roomCode}`} replace />;

  const me = view?.players[view.playerId];
  const isVip = me?.isVip ?? false;

  return (
    <PlayerLayout roomCode={roomCode} isConnected={isConnected} me={me} view={view} error={error}>
      {!view ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-6xl animate-wobble">🍟</span>
          <p className="font-display text-2xl">
            {failedAttempts >= 3 ? "Can't find that shop." : isConnected ? "Waiting for the host…" : "Connecting…"}
          </p>
          {failedAttempts >= 3 && (
            <>
              <p className="text-ink/70">The game may have ended, or the code is wrong.</p>
              <button onClick={backToLobby} className="btn w-full">
                Back to the menu
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {view.phase === "LOBBY" && <LobbyPhase view={view} onStart={() => toHost("START_GAME")} />}
          {view.phase === "TUTORIAL" && <TutorialPhase isVip={isVip} onContinue={() => toHost("NEXT_PHASE")} />}
          {view.phase === "WRITING" && (
            <WritingPhase
              key={`${view.roundProgress?.current}-${view.scenario?.id}`}
              view={view}
              onSubmit={(text, lureId) => {
                playSound("submit", 4);
                sendMessage({ type: "SUBMIT_FAKE", target: "HOST", payload: { text, lureId } });
              }}
            />
          )}
          {view.phase === "VOTING" && (
            <VotingPhase
              key={view.roundProgress?.current}
              view={view}
              onVote={(entryId) => {
                playSound("submit", 4);
                sendMessage({ type: "SUBMIT_VOTE", target: "HOST", payload: { entryId } });
              }}
            />
          )}
          {view.phase === "REVEAL" && <RevealPhase view={view} isVip={isVip} onNext={() => toHost("NEXT_PHASE")} />}
          {view.phase === "LEADERBOARD" && <LeaderboardPhase view={view} isVip={isVip} onPlayAgain={() => toHost("PLAY_AGAIN")} />}
        </>
      )}
    </PlayerLayout>
  );
}
