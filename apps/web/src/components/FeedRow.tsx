import type { LogEntry, Machine } from "@burrower/shared";
import { SOURCE_META } from "../lib/format";
import { MachineChip, UserTag } from "./Chips";

const FILE_ACTION_ICON = { read: "👁", write: "✏️", copy: "⧉" } as const;

/**
 * One glanceable log line. The machine the entry is about always comes first
 * so people can call out "anything on db-2?" and scan a single column.
 */
export default function FeedRow({
  entry,
  lookup,
  now,
  showSource,
}: {
  entry: LogEntry;
  lookup: Record<string, Machine>;
  now: number;
  showSource?: boolean;
}) {
  const age = Math.max(0, Math.floor((now - entry.at) / 1000));

  return (
    <li className="feed-in flex items-center gap-2 px-3 py-2 border-b border-line text-sm">
      <span className="w-7 shrink-0 text-right font-mono text-xs text-slate-500">{age}s</span>
      {showSource && <span className="shrink-0">{SOURCE_META[entry.source].icon}</span>}
      <MachineChip id={entry.machine} lookup={lookup} />
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {entry.source === "NETWORK" && (
          <>
            <span className="text-slate-400">←</span>
            <MachineChip id={entry.from!} lookup={lookup} small />
            <span className="font-mono text-slate-400">:{entry.port}</span>
          </>
        )}
        {entry.source === "LOGIN" && (
          <>
            <UserTag name={entry.user!} />
            <span className="text-slate-400">from</span>
            <MachineChip id={entry.from!} lookup={lookup} small />
          </>
        )}
        {entry.source === "FILE" && (
          <>
            <UserTag name={entry.user!} />
            <span className={entry.action === "copy" ? "text-amber-300" : "text-slate-400"}>
              {FILE_ACTION_ICON[entry.action!]} {entry.action}
            </span>
            <span className="truncate font-mono text-xs text-slate-300">{entry.file}</span>
          </>
        )}
      </span>
    </li>
  );
}
