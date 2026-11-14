import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { GAME, type RoomView } from "@burrower/shared";
import { useRoom } from "../hooks/useRoom";
import { clock, secs } from "../lib/format";
import NetworkMap from "../components/NetworkMap";
import { announcementClass } from "../components/Status";
import Replay from "../components/tv/Replay";

/**
 * Read-only big screen. It renders exactly what the server sends; all game
 * logic lives on the backend, so the game also works without a TV.
 */
export default function Tv() {
  const roomCode = useParams<{ code: string }>().code!.toUpperCase();
  const getParams = useCallback(() => ({ display: "1" }), []);
  const { view, isConnected } = useRoom({ roomCode, getParams });

  return (
    <div className="flex h-full flex-col p-8">
      <header className="mb-6 flex items-center justify-between">
        <span className="font-mono text-3xl font-extrabold text-amber-400">BURROWER</span>
        <span className="flex items-center gap-4 text-xl text-slate-400">
          {window.location.host}
          <span className="rounded-lg bg-slate-800 px-4 py-1 font-mono text-3xl font-bold tracking-widest text-slate-100">
            {roomCode}
          </span>
          <span className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
        </span>
      </header>
      <main className="min-h-0 flex-1">{view ? <TvBody view={view} /> : <p className="text-2xl text-slate-500">Connecting…</p>}</main>
    </div>
  );
}

function TvBody({ view }: { view: RoomView }) {
  const game = view.game;
  const moleName = game ? view.players.find((p) => p.id === game.moleId)?.name ?? "The mole" : "";

  if (view.phase === "LOBBY" || !game) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
        <p className="text-3xl text-slate-300">
          Join at <span className="font-mono text-amber-300">{window.location.host}</span> with code
        </p>
        <p className="font-mono text-9xl font-extrabold tracking-[0.2em] text-slate-50">{view.roomCode}</p>
        <ul className="flex max-w-4xl flex-wrap justify-center gap-3">
          {view.players.map((p) => (
            <li key={p.id} className={`rounded-full bg-panel px-5 py-2 text-2xl ${p.connected ? "" : "opacity-40"}`}>
              {p.name}
            </li>
          ))}
        </ul>
        <p className="text-xl text-slate-500">
          {view.settings.roundSeconds / 60} min rounds · {view.settings.noise} noise · start from any phone
        </p>
      </div>
    );
  }

  if (view.phase === "BRIEFING") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-10 text-center">
        <h2 className="text-6xl font-bold">
          <span className="text-amber-400">{moleName}</span> is the mole
        </h2>
        <div className="grid max-w-6xl grid-cols-3 gap-6 text-left text-xl">
          <div className="rounded-2xl bg-panel p-6">
            <h3 className="mb-2 text-2xl font-bold text-amber-300">🕳 The mole</h3>
            Digs from <b>ENTRY</b> toward the 💎 crown jewels. Loots {GAME.lootsToWin} to win.
          </div>
          <div className="rounded-2xl bg-panel p-6">
            <h3 className="mb-2 text-2xl font-bold text-sky-300">🔍 The logs</h3>
            Real users show up on <b>every</b> feed: connection, login, file. The mole leaves a piece missing. Talk it out!
          </div>
          <div className="rounded-2xl bg-panel p-6">
            <h3 className="mb-2 text-2xl font-bold text-red-300">🔨 The whack</h3>
            Two defenders tap the same machine to quarantine it. Catch the mole {GAME.catchesToWin}× or survive the clock.
          </div>
        </div>
        <p className="text-2xl text-slate-400">
          Starting in {secs(game.briefingMsLeft)} · {game.readyIds.length}/{Object.keys(game.defenderSources).length + 1} ready
        </p>
      </div>
    );
  }

  if (view.phase === "GAME_OVER" && game.outcome) {
    return (
      <div className="flex h-full flex-col gap-6">
        <div className={`rounded-2xl p-6 text-center ${game.outcome.winner === "MOLE" ? "bg-amber-900/60" : "bg-sky-900/60"}`}>
          <h2 className="text-5xl font-bold">{game.outcome.winner === "MOLE" ? `🕳 ${moleName} got away!` : "🛡 Mole contained!"}</h2>
          <p className="mt-2 text-2xl text-slate-300">{game.outcome.reason}</p>
        </div>
        <div className="min-h-0 flex-1">{game.replay && <Replay map={game.map} replay={game.replay} moleName={moleName} />}</div>
      </div>
    );
  }

  // PLAYING
  const lowTime = game.timeLeftMs < 30_000;
  return (
    <div className="grid h-full min-h-0 grid-cols-[1fr_24rem] gap-8">
      <div className="relative min-h-0">
        <NetworkMap
          map={game.map}
          status={game.machines}
          orientation="landscape"
          whack={game.whack}
          revealed={game.revealedMole?.machine}
          className="h-full w-full"
        />
        {game.spike && (
          <div
            className={`absolute inset-x-0 top-0 mx-auto w-fit rounded-xl px-6 py-2 text-2xl font-bold ${
              game.spike.stage === "ACTIVE" ? "animate-pulse bg-fuchsia-600" : "bg-fuchsia-900"
            }`}
          >
            📈 {game.spike.stage === "ACTIVE" ? `TRAFFIC SPIKE ${secs(game.spike.msLeft)}` : `Traffic spike in ${secs(game.spike.msLeft)}`}
          </div>
        )}
        {game.whack?.stage === "RESULT" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className={`pop-in rounded-3xl px-12 py-6 text-8xl font-extrabold shadow-2xl ${
                game.whack.hit ? "bg-green-600" : "bg-red-700"
              }`}
            >
              {game.whack.hit ? "MOLE!" : "CLEAN"}
            </span>
          </div>
        )}
      </div>

      <aside className="flex min-h-0 flex-col gap-6">
        <div className={`font-mono text-7xl font-extrabold ${lowTime ? "text-red-400" : "text-slate-50"}`}>
          {clock(game.timeLeftMs)}
        </div>
        <Stat label="Jewels looted" value={`${"💰".repeat(game.loots)}${"💎".repeat(Math.max(0, game.lootsToWin - game.loots))}`} />
        <Stat label="Mole caught" value={`${game.catches} / ${game.catchesToWin}`} />
        <Stat label="Whacks left" value={game.whacksLeft ? "🔨".repeat(game.whacksLeft) : "none"} />
        <p className="text-lg text-slate-400">
          🕳 <span className="font-bold text-amber-300">{moleName}</span> is digging…
        </p>
        <ul className="flex min-h-0 flex-col gap-2 overflow-hidden">
          {[...game.announcements].reverse().map((a) => (
            <li key={a.id} className={`pop-in rounded-lg px-3 py-2 text-lg font-semibold ${announcementClass(a.kind)}`}>
              <span className="mr-2 font-mono text-sm opacity-70">{clock(a.at)}</span>
              {a.text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-4xl">{value}</p>
    </div>
  );
}
