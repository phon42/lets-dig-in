import { useEffect, useMemo, useState } from "react";
import type { NetworkMap as Net, Replay as ReplayData } from "@burrower/shared";
import { clock } from "../../lib/format";
import NetworkMap from "../NetworkMap";

type Event =
  | { at: number; type: "move"; machine: string; kind: ReplayData["path"][number]["kind"] }
  | { at: number; type: "whack"; machine: string; hit: boolean };

const MOVE_LABEL = {
  START: "🚪 starts at",
  DIG_QUIET: "🤫 digs quietly into",
  DIG_LOUD: "📢 digs loudly into",
  LOOT: "💰 loots",
  CAUGHT: "🔨 is caught on",
  KNOCKED_BACK: "🔑 is knocked back to",
} as const;

const STEP_MS = 1100;

/** Plays the mole's route back step by step against the defenders' whacks */
export default function Replay({ map, replay, moleName }: { map: Net; replay: ReplayData; moleName: string }) {
  const events = useMemo<Event[]>(() => {
    const moves: Event[] = replay.path.map((p) => ({ at: p.at, type: "move", machine: p.machine, kind: p.kind }));
    const whacks: Event[] = replay.whacks.map((w) => ({ at: w.at, type: "whack", machine: w.machine, hit: w.hit }));
    // Whacks sort before the CAUGHT step they caused
    return [...moves, ...whacks].sort((a, b) => a.at - b.at || (a.type === "whack" ? -1 : 1));
  }, [replay]);

  const [step, setStep] = useState(1);
  useEffect(() => {
    if (step >= events.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, events.length]);

  const shown = events.slice(0, step);
  const path: { machine: string; teleport: boolean }[] = [];
  let teleportNext = false;
  for (const e of shown) {
    if (e.type !== "move") continue;
    if (e.kind === "LOOT") continue;
    path.push({ machine: e.machine, teleport: teleportNext || e.kind === "KNOCKED_BACK" });
    teleportNext = e.kind === "CAUGHT";
  }
  const moleAt = path.at(-1)?.machine ?? null;
  const marks = shown.flatMap((e) => (e.type === "whack" ? [{ machine: e.machine, hit: e.hit }] : []));

  return (
    <div className="grid h-full min-h-0 grid-cols-[1fr_22rem] gap-6">
      <NetworkMap map={map} orientation="landscape" path={path} moleAt={moleAt} marks={marks} className="h-full w-full" />
      <div className="flex min-h-0 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Replay</h3>
          <button onClick={() => setStep(1)} className="rounded bg-slate-800 px-3 py-1 text-sm">
            ↺ Again
          </button>
        </div>
        <ol className="flex min-h-0 flex-col gap-1 overflow-y-auto font-mono text-base">
          {shown.map((e, i) => (
            <li
              key={i}
              className={`pop-in ${e.type === "whack" ? (e.hit ? "text-green-400" : "text-red-400") : "text-slate-200"}`}
            >
              <span className="text-slate-500">{clock(e.at)}</span>{" "}
              {e.type === "move"
                ? `${moleName} ${MOVE_LABEL[e.kind]} ${e.machine}`
                : `🔨 Whack on ${e.machine}: ${e.hit ? "HIT" : "miss"}`}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
