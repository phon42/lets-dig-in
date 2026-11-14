import { GAME, TOOL_FOR_SOURCE, type ClientMessage, type RoomView } from "@burrower/shared";
import { SOURCE_META, TOOL_META, secs } from "../../lib/format";

export default function BriefingScreen({ view, send }: { view: RoomView; send: (m: ClientMessage) => void }) {
  const game = view.game!;
  const isReady = !!view.youId && game.readyIds.includes(view.youId);
  const moleName = view.players.find((p) => p.id === game.moleId)?.name ?? "Someone";
  const sources = view.youId ? game.defenderSources[view.youId] ?? [] : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      {view.role === "MOLE" ? (
        <div className="rounded-2xl border-2 border-amber-600 bg-amber-950/40 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Your role</p>
          <h2 className="mb-3 text-3xl font-bold text-amber-200">You are the Mole</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-slate-200">
            <li>
              Dig machine to machine and <b>loot {GAME.lootsToWin} 💎 crown jewels</b> before the clock runs out.
            </li>
            <li>
              <b>Quiet dig</b> ({secs(GAME.quietDigMs)}): leaves one login with no matching connection.
            </li>
            <li>
              <b>Loud dig</b> ({secs(GAME.loudDigMs)}): fast, but sprays network scans.
            </li>
            <li>
              <b>Decoy</b>: fake a suspicious trace somewhere else.
            </li>
            <li>Caught {GAME.catchesToWin}× and you lose. You hear every theory, so bluff.</li>
          </ul>
        </div>
      ) : view.role === "DEFENDER" ? (
        <div className="rounded-2xl border-2 border-sky-600 bg-sky-950/40 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Your role</p>
          <h2 className="mb-1 text-3xl font-bold text-sky-200">Security team</h2>
          <p className="mb-3 text-slate-300">
            <b>{moleName}</b> is the mole. Find them in the logs.
          </p>
          <p className="mb-2 font-semibold text-slate-100">
            You watch:{" "}
            {sources.map((s) => (
              <span key={s} className="mr-2 whitespace-nowrap rounded bg-sky-800 px-2 py-0.5">
                {SOURCE_META[s].icon} {SOURCE_META[s].label}
              </span>
            ))}
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-slate-200">
            <li>
              Real users leave all three: a <b>connection</b>, a <b>login</b> from that machine, and a <b>file</b> touch.
              The mole's traces have a piece missing. <b>Compare out loud.</b>
            </li>
            <li>
              🔨 <b>Whack</b> needs two of you on the same machine. Misses knock it offline.
            </li>
            {sources.map((s) => {
              const tool = TOOL_META[TOOL_FOR_SOURCE[s]];
              return (
                <li key={s}>
                  {tool.icon} <b>{tool.label}</b>: {tool.help}
                </li>
              );
            })}
            <li>
              🔍 <b>Dig in</b>: all feeds for one machine for 10s, but your own goes blind.
            </li>
          </ul>
        </div>
      ) : (
        <p className="text-center text-slate-400">A round is starting. You'll join the next one.</p>
      )}

      {view.role && (
        <button
          disabled={isReady}
          onClick={() => send({ type: "READY" })}
          className="rounded-xl bg-amber-500 py-4 text-xl font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-300"
        >
          {isReady ? `Waiting for others… ${secs(game.briefingMsLeft)}` : `Ready (${secs(game.briefingMsLeft)})`}
        </button>
      )}
    </div>
  );
}
