import { MIN_PLAYERS, ROUND_LENGTH_OPTIONS, type ClientMessage, type NoiseLevel, type RoomView } from "@burrower/shared";

const NOISE_OPTIONS: { value: NoiseLevel; label: string }[] = [
  { value: "low", label: "Calm" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Noisy" },
];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg border-2 py-2 font-semibold ${
            o.value === value ? "border-amber-500 bg-amber-500/15 text-amber-200" : "border-line bg-panel text-slate-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function LobbyScreen({ view, send }: { view: RoomView; send: (m: ClientMessage) => void }) {
  const connected = view.players.filter((p) => p.connected);
  const canStart = connected.length >= MIN_PLAYERS;
  const tvUrl = `${window.location.host}/tv/${view.roomCode}`;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
          Players ({connected.length})
        </h2>
        <ul className="flex flex-wrap gap-2">
          {view.players.map((p) => (
            <li
              key={p.id}
              className={`rounded-full px-3 py-1 font-semibold ${
                p.id === view.youId ? "bg-amber-500 text-slate-950" : "bg-panel text-slate-200"
              } ${p.connected ? "" : "opacity-40"}`}
            >
              {p.name}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-slate-500">Best with 4+. The mole rotates every round.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Round length</h2>
        <Segmented
          options={ROUND_LENGTH_OPTIONS.map((s) => ({ value: s, label: `${s / 60} min` }))}
          value={view.settings.roundSeconds}
          onChange={(roundSeconds) => send({ type: "UPDATE_SETTINGS", settings: { roundSeconds } })}
        />
        <h2 className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-400">Log noise</h2>
        <Segmented
          options={NOISE_OPTIONS}
          value={view.settings.noise}
          onChange={(noise) => send({ type: "UPDATE_SETTINGS", settings: { noise } })}
        />
      </section>

      <button
        disabled={!canStart}
        onClick={() => send({ type: "START_GAME" })}
        className="rounded-xl bg-amber-500 py-4 text-xl font-bold text-slate-950 disabled:opacity-40"
      >
        {canStart ? "Start round" : `Waiting for ${MIN_PLAYERS - connected.length} more`}
      </button>

      <p className="text-center text-sm text-slate-500">
        Got a TV? Open <span className="font-mono text-slate-300">{tvUrl}</span>
      </p>
    </div>
  );
}
