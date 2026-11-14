import { useMemo, useState } from "react";
import type { ClientMessage, DefenderTool, RoomView } from "@burrower/shared";
import { SOURCE_META, TOOL_META, machineLookup, secs } from "../../lib/format";
import FeedRow from "../FeedRow";
import { Banner, MiniHud } from "../Status";
import MachinePicker from "./MachinePicker";

type Picking = { kind: "WHACK" } | { kind: "TOOL"; tool: DefenderTool } | { kind: "DIG_IN" } | null;

export default function DefenderScreen({ view, send }: { view: RoomView; send: (m: ClientMessage) => void }) {
  const game = view.game!;
  const me = view.defender!;
  const lookup = useMemo(() => machineLookup(game.map), [game.map]);
  const [picking, setPicking] = useState<Picking>(null);

  const myVoteCount = me.whackVote ? game.machines.find((m) => m.id === me.whackVote)?.whackVotes ?? 0 : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 bg-sky-950/60 px-3 py-2">
        <span className="flex gap-1 font-bold text-sky-200">
          {me.sources.map((s) => (
            <span key={s} className="whitespace-nowrap">
              {SOURCE_META[s].icon} {me.sources.length === 1 ? SOURCE_META[s].label : ""}
            </span>
          ))}
        </span>
        <MiniHud game={game} />
      </div>
      <Banner game={game} />
      {me.digIn && (
        <div className="bg-sky-700 px-3 py-2 text-center text-sm font-bold">
          🔍 Dug into {me.digIn.machine}: all feeds, {secs(me.digIn.msLeft)} left. Your own feed is blind.
        </div>
      )}

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {me.feed.map((e) => (
          <FeedRow key={e.id} entry={e} lookup={lookup} now={game.elapsedMs} showSource={!!me.digIn || me.sources.length > 1} />
        ))}
        {me.feed.length === 0 && <li className="p-6 text-center text-slate-500">Quiet… for now.</li>}
      </ul>

      <div
        className="grid gap-2 border-t border-line bg-panel p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ gridTemplateColumns: `repeat(${2 + me.tools.length}, minmax(0, 1fr))` }}
      >
        <button
          onClick={() => setPicking({ kind: "WHACK" })}
          disabled={game.whacksLeft <= 0}
          className="flex flex-col items-center rounded-lg bg-red-700 py-2 font-bold disabled:opacity-30"
        >
          <span className="text-2xl">🔨</span>
          <span className="text-xs">
            {me.whackVote ? `${me.whackVote} ${myVoteCount}/${me.whackVotesNeeded}` : `Whack (${game.whacksLeft})`}
          </span>
        </button>
        {me.tools.map(({ tool, cooldownMs }) => (
          <button
            key={tool}
            onClick={() => setPicking({ kind: "TOOL", tool })}
            disabled={cooldownMs > 0}
            className="flex flex-col items-center rounded-lg bg-slate-700 py-2 font-bold disabled:opacity-40"
          >
            <span className="text-2xl">{TOOL_META[tool].icon}</span>
            <span className="text-xs">{cooldownMs > 0 ? secs(cooldownMs) : TOOL_META[tool].short}</span>
          </button>
        ))}
        <button
          onClick={() => setPicking({ kind: "DIG_IN" })}
          disabled={me.digInCooldownMs > 0}
          className="flex flex-col items-center rounded-lg bg-sky-700 py-2 font-bold disabled:opacity-40"
        >
          <span className="text-2xl">🔍</span>
          <span className="text-xs">{me.digInCooldownMs > 0 ? secs(me.digInCooldownMs) : "Dig in"}</span>
        </button>
      </div>

      {picking?.kind === "WHACK" && (
        <MachinePicker
          title="🔨 Whack a machine"
          subtitle={`Needs ${me.whackVotesNeeded} of you on the same machine. ${game.whacksLeft} whacks left.`}
          map={game.map}
          status={game.machines}
          baits={me.baits}
          current={me.whackVote}
          disabled={(_, s) => s.offlineMs > 0}
          onPick={(id) => {
            send({ type: "WHACK_VOTE", target: id === me.whackVote ? null : id });
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
          footer={
            me.whackVote && (
              <button
                onClick={() => {
                  send({ type: "WHACK_VOTE", target: null });
                  setPicking(null);
                }}
                className="w-full rounded-lg bg-slate-700 py-3 font-bold"
              >
                Take back my vote on {me.whackVote}
              </button>
            )
          }
        />
      )}
      {picking?.kind === "TOOL" && (
        <MachinePicker
          title={`${TOOL_META[picking.tool].icon} ${TOOL_META[picking.tool].label}`}
          subtitle={TOOL_META[picking.tool].help}
          map={game.map}
          status={game.machines}
          baits={me.baits}
          onPick={(id) => {
            send({ type: "USE_TOOL", tool: picking.tool, target: id });
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
      {picking?.kind === "DIG_IN" && (
        <MachinePicker
          title="🔍 Dig in"
          subtitle="See every log source for one machine for 10s. Your own feed goes blind."
          map={game.map}
          status={game.machines}
          baits={me.baits}
          onPick={(id) => {
            send({ type: "DIG_IN", target: id });
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}
