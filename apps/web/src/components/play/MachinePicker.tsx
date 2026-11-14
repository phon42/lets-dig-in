import type { MachineStatus, NetworkMap } from "@burrower/shared";
import { secs } from "../../lib/format";

interface Props {
  title: string;
  subtitle?: string;
  map: NetworkMap;
  status: MachineStatus[];
  baits: string[];
  /** Machine highlighted as the current choice (e.g. your whack vote) */
  current?: string | null;
  disabled?: (id: string, s: MachineStatus) => boolean;
  onPick: (id: string) => void;
  onClose: () => void;
  footer?: React.ReactNode;
}

/** Bottom sheet listing machines laid out like the map: one row per layer */
export default function MachinePicker({ title, subtitle, map, status, baits, current, disabled, onPick, onClose, footer }: Props) {
  const statusById = Object.fromEntries(status.map((s) => [s.id, s]));
  const rows = Array.from({ length: map.layers }, (_, layer) =>
    map.machines.filter((m) => m.layer === layer).sort((a, b) => a.slot - b.slot),
  );

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div
        className="rounded-t-2xl border-t border-line bg-panel p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="px-2 text-2xl leading-none text-slate-400">
            ×
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              {row.map((m) => {
                const s = statusById[m.id];
                const off = disabled?.(m.id, s) ?? false;
                return (
                  <button
                    key={m.id}
                    disabled={off}
                    onClick={() => onPick(m.id)}
                    className={`relative rounded-lg border-2 px-1 py-3 font-mono text-sm font-bold text-slate-950 disabled:opacity-30 ${
                      current === m.id ? "border-white ring-2 ring-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name}
                    <span className="absolute -top-2 right-0 flex gap-0.5 text-xs">
                      {m.jewel && <span>{s?.looted ? "💰" : "💎"}</span>}
                      {baits.includes(m.id) && <span>🪤</span>}
                      {s?.whackVotes ? <span className="rounded bg-red-600 px-1 text-white">🔨{s.whackVotes}</span> : null}
                    </span>
                    {(s?.offlineMs || s?.firewallMs) ? (
                      <span className="absolute inset-x-0 -bottom-2 mx-auto w-fit rounded bg-slate-950 px-1 text-[10px] text-amber-300">
                        {s.offlineMs ? `⚡${secs(s.offlineMs)}` : `🧱${secs(s.firewallMs)}`}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </div>
  );
}
