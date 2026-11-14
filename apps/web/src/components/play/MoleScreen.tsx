import { useEffect, useMemo, useRef, useState } from "react";
import { GAME, type ClientMessage, type RoomView } from "@burrower/shared";
import { secs } from "../../lib/format";
import NetworkMap from "../NetworkMap";
import { Banner, MiniHud } from "../Status";

const ACTION_LABEL = { DIG_QUIET: "🤫 Quietly digging into", DIG_LOUD: "📢 Loudly digging into", LOOT: "💰 Looting" } as const;

export default function MoleScreen({ view, send }: { view: RoomView; send: (m: ClientMessage) => void }) {
  const game = view.game!;
  const mole = view.mole!;
  const [selected, setSelected] = useState<string | null>(null);

  const status = Object.fromEntries(game.machines.map((s) => [s.id, s]));
  const neighbors = useMemo(() => new Set(mole.neighbors), [mole.neighbors]);
  const all = useMemo(() => new Set(game.map.machines.map((m) => m.id)), [game.map]);
  const target = selected && selected !== mole.position ? selected : null;
  const targetUp = target && !status[target]?.offlineMs && !status[target]?.firewallMs;
  const hereFirewalled = !!status[mole.position]?.firewallMs;
  const canDig = !!target && neighbors.has(target) && !!targetUp && !hereFirewalled && !mole.action;

  // Buzz when something bad happens to you
  const lastNotice = useRef<string | null>(null);
  useEffect(() => {
    if (mole.notice && mole.notice !== lastNotice.current) navigator.vibrate?.([120, 60, 120]);
    lastNotice.current = mole.notice;
  }, [mole.notice]);

  // Drop the selection once you've arrived
  useEffect(() => {
    if (selected === mole.position) setSelected(null);
  }, [mole.position, selected]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between bg-amber-950/60 px-3 py-2">
        <span className="font-bold text-amber-300">🕳 Mole</span>
        <MiniHud game={game} />
      </div>
      <Banner game={game} />
      {mole.notice && <div className="bg-red-600 px-3 py-2 text-center font-bold text-white">{mole.notice}</div>}

      <div className="min-h-0 flex-1 px-1">
        <NetworkMap
          map={game.map}
          status={game.machines}
          orientation="portrait"
          moleAt={mole.position}
          selectable={all}
          highlight={mole.action ? undefined : neighbors}
          selected={selected}
          onSelect={(id) => setSelected(id === selected ? null : id)}
          whack={game.whack}
          revealed={game.revealedMole?.machine}
          className="h-full w-full"
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-line bg-panel p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {mole.action ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {ACTION_LABEL[mole.action.kind]} {mole.action.target}
              </span>
              <span className="font-mono">{secs(mole.action.msLeft)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-amber-500 transition-[width] duration-200" style={{ width: `${mole.action.progress * 100}%` }} />
            </div>
            <button onClick={() => send({ type: "MOLE_CANCEL" })} className="rounded-lg bg-slate-700 py-3 font-bold">
              Abort
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-slate-400">
              {target
                ? neighbors.has(target)
                  ? hereFirewalled
                    ? "You're firewalled in. Wait it out."
                    : targetUp
                      ? `Dig into ${target}?`
                      : `${target} is blocked right now`
                  : `${target} isn't adjacent. You can still plant a decoy.`
                : "Tap a highlighted machine to dig toward it."}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!canDig}
                onClick={() => target && send({ type: "MOLE_DIG", target, mode: "QUIET" })}
                className="rounded-lg bg-emerald-700 py-3 font-bold disabled:opacity-30"
              >
                🤫 Quiet dig <span className="font-normal opacity-80">{secs(GAME.quietDigMs)}</span>
              </button>
              <button
                disabled={!canDig}
                onClick={() => target && send({ type: "MOLE_DIG", target, mode: "LOUD" })}
                className="rounded-lg bg-red-700 py-3 font-bold disabled:opacity-30"
              >
                📢 Loud dig <span className="font-normal opacity-80">{secs(GAME.loudDigMs)}</span>
              </button>
              <button
                disabled={!mole.canLoot}
                onClick={() => send({ type: "MOLE_LOOT" })}
                className="rounded-lg bg-amber-500 py-3 font-bold text-slate-950 disabled:opacity-30"
              >
                💰 Loot here
              </button>
              <button
                disabled={!target || mole.decoyCooldownMs > 0}
                onClick={() => target && send({ type: "MOLE_DECOY", target })}
                className="rounded-lg bg-fuchsia-700 py-3 font-bold disabled:opacity-30"
              >
                🎭 Decoy{mole.decoyCooldownMs > 0 ? ` ${secs(mole.decoyCooldownMs)}` : ""}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
