import { useCallback, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import { clearPlayerSession, getPlayerSession, setPlayerSession } from "../lib/session";
import BriefingScreen from "../components/play/BriefingScreen";
import DefenderScreen from "../components/play/DefenderScreen";
import GameOverScreen from "../components/play/GameOverScreen";
import LobbyScreen from "../components/play/LobbyScreen";
import MoleScreen from "../components/play/MoleScreen";
import { Banner, MiniHud } from "../components/Status";

export default function Play() {
  const roomCode = useParams<{ code: string }>().code!.toUpperCase();
  const navigate = useNavigate();
  const [hasSession] = useState(() => !!getPlayerSession(roomCode));

  const getParams = useCallback((): Record<string, string> | null => {
    const s = getPlayerSession(roomCode);
    if (!s) return null;
    return s.playerId && s.token ? { playerId: s.playerId, token: s.token } : { name: s.name };
  }, [roomCode]);

  const onJoined = useCallback(
    (playerId: string, token: string) => {
      const s = getPlayerSession(roomCode);
      if (s) setPlayerSession(roomCode, { ...s, playerId, token });
    },
    [roomCode],
  );

  const { view, isConnected, failedAttempts, error, send } = useRoom({ roomCode, getParams, onJoined });

  if (!hasSession) return <Navigate to={`/?code=${roomCode}`} replace />;

  const me = view?.players.find((p) => p.id === view.youId);
  const fullScreen = view?.phase === "PLAYING" && (view.role === "MOLE" || view.role === "DEFENDER");

  let body: React.ReactNode;
  if (!view) {
    body =
      failedAttempts >= 3 ? (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-slate-400">Can't reach this room. It may have closed.</p>
          <button
            onClick={() => {
              const s = getPlayerSession(roomCode);
              clearPlayerSession(roomCode);
              navigate(`/?code=${roomCode}${s ? `&name=${encodeURIComponent(s.name)}` : ""}`);
            }}
            className="rounded-lg bg-amber-500 px-6 py-3 font-bold text-slate-950"
          >
            Back to start
          </button>
        </div>
      ) : (
        <p className="p-8 text-center text-slate-400">{isConnected ? "Joining…" : "Connecting…"}</p>
      );
  } else if (view.phase === "LOBBY") {
    body = <LobbyScreen view={view} send={send} />;
  } else if (view.phase === "BRIEFING") {
    body = <BriefingScreen view={view} send={send} />;
  } else if (view.phase === "PLAYING" && view.role === "MOLE" && view.mole) {
    body = <MoleScreen view={view} send={send} />;
  } else if (view.phase === "PLAYING" && view.role === "DEFENDER" && view.defender) {
    body = <DefenderScreen view={view} send={send} />;
  } else if (view.phase === "PLAYING") {
    body = (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <MiniHud game={view.game!} />
        <Banner game={view.game!} />
        <p className="text-slate-400">Round in progress. You'll be dealt in next round.</p>
      </div>
    );
  } else {
    body = <GameOverScreen view={view} send={send} />;
  }

  return (
    <div className="flex h-full flex-col">
      {!fullScreen && (
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-mono text-lg font-extrabold text-amber-400">BURROWER</span>
          <span className="flex items-center gap-2 text-sm">
            {me && <span className="text-slate-300">{me.name}</span>}
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono font-bold tracking-widest">{roomCode}</span>
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          </span>
        </header>
      )}
      {fullScreen && !isConnected && (
        <div className="bg-red-700 px-3 py-1 text-center text-sm font-bold">Reconnecting…</div>
      )}
      <main className={`min-h-0 flex-1 ${fullScreen ? "" : "overflow-y-auto"}`}>{body}</main>
      {error && (
        <div className="pop-in fixed inset-x-4 top-4 z-30 rounded-lg bg-red-600 px-4 py-3 text-center font-bold shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
