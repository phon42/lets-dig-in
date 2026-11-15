import type { Player, Round } from "@phish/shared";
import { publicScenario } from "../../../lib/view";
import MessageCard, { type CardSize } from "../../shared/MessageCard";
import Avatar from "../../shared/Avatar";

interface VotingPhaseProps {
  round: Round;
  players: Record<string, Player>;
}

export function gridFor(count: number): { cols: string; size: CardSize } {
  if (count <= 4) return { cols: "grid-cols-2", size: "lg" };
  if (count <= 6) return { cols: "grid-cols-3", size: "md" };
  if (count <= 8) return { cols: "grid-cols-4", size: "md" };
  return { cols: "grid-cols-4", size: "sm" };
}

export default function VotingPhase({ round, players }: VotingPhaseProps) {
  const scenario = publicScenario(round.scenarioId)!;
  const { cols, size } = gridFor(round.entries.length);
  const voters = Object.values(players).filter((p) => p.isConnected);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-paper/70 text-xl">
            {scenario.emoji} {scenario.prompt} · real site <span className="font-mono font-bold text-pea">{scenario.domain}</span>
          </p>
          <h2 className="display-outline text-5xl text-mustard">Which one is the real deal?</h2>
        </div>
        <p className="font-display text-2xl text-paper/90 pb-1">Vote on your phone 📱</p>
      </div>

      <div className={`grid ${cols} gap-x-7 gap-y-8 flex-1 min-h-0 content-center p-4`}>
        {round.entries.map((entry, i) => (
          <div key={entry.id} className="relative animate-pop-in" style={{ animationDelay: `${i * 90}ms` }}>
            <span className="absolute -top-3 -left-3 z-10 size-11 rounded-full bg-mustard border-[3px] border-ink font-display text-2xl flex items-center justify-center shadow-[2px_2px_0_var(--color-ink)]">
              {i + 1}
            </span>
            <MessageCard scenario={scenario} text={entry.text} url={entry.url} size={size} className="shadow-[5px_5px_0_rgba(0,0,0,0.35)]" />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {voters.map((p) => {
          const voted = !!round.votes[p.id];
          return (
            <div key={p.id} className={`relative transition-transform ${voted ? "scale-100" : "scale-90 opacity-60"}`}>
              <Avatar avatarId={p.avatarId} size="size-12" />
              {voted && (
                <span className="absolute -bottom-1 -right-1 size-6 rounded-full bg-pea border-2 border-ink text-white text-xs flex items-center justify-center animate-pop-in">
                  ✓
                </span>
              )}
            </div>
          );
        })}
        <span className="text-paper/70 text-lg ml-2">
          {Object.keys(round.votes).length}/{voters.length} locked in
        </span>
      </div>
    </div>
  );
}
