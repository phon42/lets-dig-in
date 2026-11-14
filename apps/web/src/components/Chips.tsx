import { INTERNET, USER_EMOJI, type Machine } from "@burrower/shared";

export function MachineChip({ id, lookup, small }: { id: string; lookup: Record<string, Machine>; small?: boolean }) {
  const size = small ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-0.5";
  if (id === INTERNET) {
    return <span className={`inline-block rounded font-mono font-semibold bg-slate-700 text-slate-200 ${size}`}>🌐 inet</span>;
  }
  const m = lookup[id];
  return (
    <span
      className={`inline-block rounded font-mono font-bold text-slate-950 whitespace-nowrap ${size}`}
      style={{ backgroundColor: m?.color ?? "#94a3b8" }}
    >
      {m?.name ?? id}
    </span>
  );
}

export function UserTag({ name }: { name: string }) {
  return (
    <span className="whitespace-nowrap font-semibold text-slate-100">
      {USER_EMOJI[name] ?? "👤"} {name}
    </span>
  );
}
