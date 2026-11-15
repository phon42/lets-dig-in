import type { Player, Round } from "@phish/shared";
import { publicScenario } from "../../../lib/view";
import ScenarioTicket from "../../shared/ScenarioTicket";
import Avatar from "../../shared/Avatar";
import Art from "../../shared/Art";

interface WritingPhaseProps {
  round: Round;
  players: Record<string, Player>;
}

export default function WritingPhase({ round, players }: WritingPhaseProps) {
  const scenario = publicScenario(round.scenarioId)!;
  const cooks = Object.values(players).filter((p) => p.isConnected || round.fakes[p.id]);
  const plated = cooks.filter((p) => round.fakes[p.id]).length;

  return (
    <div className="h-full grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-8">
      <div className="flex flex-col gap-6 min-h-0">
        <ScenarioTicket scenario={scenario} className="-rotate-1 animate-slide-up" />
        <div className="sticker bg-ink-2 border-paper/30 text-paper p-6 flex items-center gap-5 animate-slide-up [animation-delay:150ms]">
          <span className="text-5xl">🔗</span>
          <p className="text-2xl leading-snug">
            Write the fake on your phone. It has to include a <b className="text-mustard">link</b>. Pick a sneaky one
            for safety, or a <span className="text-ketchup font-bold">hot</span> one for big points.
          </p>
        </div>
        <div className="mt-auto flex items-end gap-4">
          <Art name="mascot" fallback="🐟" className="size-36 animate-float text-7xl" />
          <div className="newsprint sticker-sm px-5 py-3 text-xl max-w-xl mb-6">
            Psst, the real message is already in the fryer. Make yours taste just as legit. 😏
          </div>
        </div>
      </div>

      <section className="flex flex-col min-h-0">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-4xl text-paper">The kitchen</h3>
          <span className="font-display text-3xl text-mustard">
            {plated}/{cooks.length} plated
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 content-start overflow-hidden">
          {cooks.map((p) => {
            const done = !!round.fakes[p.id];
            return (
              <div
                key={p.id}
                className={`sticker-sm flex items-center gap-4 px-4 py-4 transition-colors ${done ? "bg-pea text-white" : "bg-ink-2 text-paper border-paper/40"}`}
              >
                <div className="relative">
                  <Avatar avatarId={p.avatarId} size="size-20" dim={!p.isConnected} />
                  {!done && <span className="steam absolute inset-0" />}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-3xl truncate">{p.name}</div>
                  <div className="text-lg opacity-90">{done ? "✅ Plated up" : <span className="inline-block animate-sizzle">🔥 Frying…</span>}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
