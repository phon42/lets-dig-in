import type { ClientMessage, RoomView } from "@burrower/shared";
import { clock } from "../../lib/format";

const STEP_LABEL = {
  START: "🚪 started at",
  DIG_QUIET: "🤫 dug quietly into",
  DIG_LOUD: "📢 dug loudly into",
  LOOT: "💰 looted",
  CAUGHT: "🔨 caught on",
  KNOCKED_BACK: "🔑 knocked back to",
} as const;

export default function GameOverScreen({ view, send }: { view: RoomView; send: (m: ClientMessage) => void }) {
  const game = view.game!;
  const outcome = game.outcome!;
  const moleName = view.players.find((p) => p.id === game.moleId)?.name ?? "The mole";
  const youWon =
    (view.role === "MOLE" && outcome.winner === "MOLE") || (view.role === "DEFENDER" && outcome.winner === "DEFENDERS");

  return (
    <div className="flex flex-col gap-5 p-4">
      <div
        className={`rounded-2xl p-5 text-center ${outcome.winner === "MOLE" ? "bg-amber-900/60" : "bg-sky-900/60"}`}
      >
        <p className="text-sm font-bold uppercase tracking-widest text-slate-300">
          {view.role ? (youWon ? "You win" : "You lose") : "Round over"}
        </p>
        <h2 className="text-3xl font-bold">{outcome.winner === "MOLE" ? `${moleName} got away` : "Mole contained"}</h2>
        <p className="mt-1 text-slate-300">{outcome.reason}</p>
      </div>

      {game.replay && (
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">The mole's route</h3>
          <ol className="flex flex-col gap-1 font-mono text-sm">
            {[...game.replay.path.map((p) => ({ ...p, w: null as boolean | null })), ...game.replay.whacks.map((w) => ({ at: w.at, machine: w.machine, kind: null, w: w.hit }))]
              .sort((a, b) => a.at - b.at)
              .map((s, i) => (
                <li key={i} className={s.kind ? "text-slate-200" : s.w ? "text-green-400" : "text-red-400"}>
                  <span className="text-slate-500">{clock(s.at)}</span>{" "}
                  {s.kind ? `${STEP_LABEL[s.kind]} ${s.machine}` : `defenders whacked ${s.machine} ${s.w ? "✓" : "✗"}`}
                </li>
              ))}
          </ol>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => send({ type: "RETURN_TO_LOBBY" })} className="rounded-xl bg-slate-700 py-4 font-bold">
          Lobby
        </button>
        <button onClick={() => send({ type: "START_GAME" })} className="rounded-xl bg-amber-500 py-4 font-bold text-slate-950">
          Next round
        </button>
      </div>
    </div>
  );
}
