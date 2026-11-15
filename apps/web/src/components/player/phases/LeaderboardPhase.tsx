import { MIN_PLAYERS, type PlayerViewState } from "@phish/shared";
import Avatar from "../../shared/Avatar";

interface LeaderboardPhaseProps {
  view: PlayerViewState;
  isVip: boolean;
  onPlayAgain: () => void;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function LeaderboardPhase({ view, isVip, onPlayAgain }: LeaderboardPhaseProps) {
  const ranked = Object.values(view.players).sort((a, b) => b.score - a.score);
  const rank = ranked.findIndex((p) => p.id === view.playerId) + 1;
  const me = view.players[view.playerId];
  const mine = (view.awards ?? []).filter((a) => a.playerId === view.playerId);
  const enough = ranked.filter((p) => p.isConnected).length >= MIN_PLAYERS;

  return (
    <div className="flex flex-col items-center text-center gap-3">
      {me && <Avatar avatarId={me.avatarId} size="size-24" className={rank === 1 ? "animate-wobble" : ""} />}
      <h2 className="font-display text-4xl">{rank === 1 ? "Head Chef! 👨‍🍳" : `${ordinal(rank)} place`}</h2>
      <p className="font-display text-2xl text-ink/80">{me?.score.toLocaleString()} pts</p>
      {mine.map((award) => (
        <div key={award.id} className="w-full rounded-xl bg-white border-2 border-ink px-3 py-2 flex items-center gap-3 text-left">
          <span className="text-3xl">{award.emoji}</span>
          <div>
            <p className="font-display text-lg">{award.title}</p>
            <p className="text-sm text-ink/70">{award.detail}</p>
          </div>
        </div>
      ))}
      {isVip ? (
        <button onClick={onPlayAgain} disabled={!enough} className="btn btn-ketchup w-full mt-2">
          Another round? 🔁
        </button>
      ) : (
        <p className="text-sm text-ink/60 mt-2">The chef can start another game.</p>
      )}
    </div>
  );
}
