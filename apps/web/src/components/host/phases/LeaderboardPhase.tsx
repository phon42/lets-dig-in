import type { Player } from "@phish/shared";
import { computeAwards } from "../../../lib/awards";
import Avatar from "../../shared/Avatar";
import Confetti from "../../shared/Confetti";

interface LeaderboardPhaseProps {
  players: Record<string, Player>;
  onPlayAgain: () => void;
}

const PODIUM = [
  { place: 2, height: "h-40", color: "bg-paper-2", medal: "🥈" },
  { place: 1, height: "h-56", color: "bg-mustard", medal: "🥇" },
  { place: 3, height: "h-28", color: "bg-batter", medal: "🥉" },
];

export default function LeaderboardPhase({ players, onPlayAgain }: LeaderboardPhaseProps) {
  const ranked = Object.values(players).sort((a, b) => b.score - a.score);
  const awards = computeAwards(players);
  const rest = ranked.slice(3);

  return (
    <div className="h-full flex flex-col items-center gap-6">
      <Confetti />
      <h2 className="display-outline text-7xl text-mustard animate-pop-in">Closing time!</h2>

      <div className="flex items-end gap-6">
        {PODIUM.map(({ place, height, color, medal }) => {
          const p = ranked[place - 1];
          if (!p) return <div key={place} className="w-56" />;
          return (
            <div key={p.id} className="w-56 flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: `${(3 - place) * 300}ms` }}>
              <span className="text-5xl">{medal}</span>
              <Avatar avatarId={p.avatarId} size={place === 1 ? "size-32" : "size-24"} className={place === 1 ? "animate-wobble" : ""} />
              <span className="font-display text-3xl text-paper truncate max-w-full">{p.name}</span>
              <div className={`${height} ${color} w-full sticker flex flex-col items-center justify-start pt-4`}>
                <span className="font-display text-5xl text-ink">{place}</span>
                <span className="font-display text-2xl text-ink/80">{p.score.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-8 items-start w-full max-w-6xl justify-center">
        {awards.length > 0 && (
          <div className="grid grid-cols-2 gap-4 flex-1 max-w-3xl">
            {awards.map((award, i) => {
              const p = players[award.playerId];
              return (
                <div key={award.id} className="newsprint sticker-sm p-4 flex items-center gap-4 animate-pop-in" style={{ animationDelay: `${1200 + i * 200}ms` }}>
                  <span className="text-5xl">{award.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-display text-2xl">{award.title}</p>
                    <p className="text-lg truncate">
                      <b>{p?.name}</b> · {award.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {rest.length > 0 && (
          <ol className="flex flex-col gap-2 min-w-72" start={4}>
            {rest.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 text-paper text-xl">
                <span className="font-display w-6 text-paper/60">{i + 4}</span>
                <Avatar avatarId={p.avatarId} size="size-9" className="!border-2" />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="font-display">{p.score.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-auto flex items-center gap-4 text-paper/80 text-xl">
        The chef can serve another round from their phone, or
        <button onClick={onPlayAgain} className="btn">Play again 🔁</button>
      </div>
    </div>
  );
}
