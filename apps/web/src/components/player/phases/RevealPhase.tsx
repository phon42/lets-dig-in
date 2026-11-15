import type { PlayerViewState } from "@phish/shared";
import Art from "../../shared/Art";

interface RevealPhaseProps {
  view: PlayerViewState;
  isVip: boolean;
  onNext: () => void;
}

export default function RevealPhase({ view, isVip, onNext }: RevealPhaseProps) {
  const result = view.result;
  const vote = result?.vote;
  const lastRound = view.roundProgress && view.roundProgress.current >= view.roundProgress.total;

  const headline =
    !vote ? (
      { art: "hooked", emoji: "🦗", title: "You didn't vote!", body: "No catch, no chips." }
    ) : vote.kind === "real" ? (
      { art: "fresh-catch", emoji: "🐟", title: "Fresh catch!", body: "You spotted the real message." }
    ) : vote.kind === "house" ? (
      { art: "hooked", emoji: "🎣", title: "Hooked!", body: "You fell for the kitchen's house special." }
    ) : (
      { art: "hooked", emoji: "🎣", title: "Hooked!", body: `You fell for ${vote.authorName}'s fake.` }
    );

  return (
    <div className="flex flex-col items-center text-center gap-3">
      <Art name={headline.art} fallback={headline.emoji} className="size-28 text-7xl animate-pop-in" />
      <h2 className={`font-display text-4xl ${vote?.kind === "real" ? "text-pea-dark" : "text-ketchup"}`}>{headline.title}</h2>
      <p className="text-ink/80">{headline.body}</p>

      {result?.wrote && (
        <div className="w-full rounded-xl bg-white border-2 border-ink px-3 py-2 text-sm">
          {result.hookedNames.length > 0 ? (
            <>
              🎣 Your fake hooked <b>{result.hookedNames.join(", ")}</b>
            </>
          ) : (
            <>Your fake didn't hook anyone this time. 🦗</>
          )}
        </div>
      )}

      <div className="font-display text-5xl text-ink mt-1">
        +{(result?.points ?? 0).toLocaleString()}
        <span className="text-xl text-ink/60 ml-1">pts</span>
      </div>

      <p className="text-sm text-ink/60">The TV is breaking down every fake's tells 👀</p>

      {isVip && (
        <button onClick={onNext} className="btn w-full mt-1">
          {view.revealDone ? (lastRound ? "Final scores 🏆" : "Next round ▶") : "Next ▶"}
        </button>
      )}
    </div>
  );
}
