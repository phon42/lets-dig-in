import { useState } from "react";
import type { PlayerViewState } from "@phish/shared";
import MessageCard from "../../shared/MessageCard";

interface VotingPhaseProps {
  view: PlayerViewState;
  onVote: (entryId: string) => void;
}

export default function VotingPhase({ view, onVote }: VotingPhaseProps) {
  const scenario = view.scenario!;
  const options = view.options ?? [];
  const [selected, setSelected] = useState<string | null>(view.myVoteId ?? null);
  const [changing, setChanging] = useState(false);
  const locked = view.myVoteId && !changing;

  if (locked) {
    const choice = options.find((o) => o.id === view.myVoteId);
    return (
      <div className="flex flex-col gap-4 text-center">
        <span className="text-5xl animate-pop-in">🔒</span>
        <h2 className="font-display text-3xl">Locked in: #{choice?.number}</h2>
        <p className="text-ink/70">Fingers crossed it's the fresh catch. Watch the TV!</p>
        {choice && <MessageCard scenario={scenario} text={choice.text} url={choice.url} size="sm" className="text-left" />}
        <button onClick={() => setChanging(true)} className="btn btn-paper w-full !text-base">
          Change my mind
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-3xl leading-tight">Which one is real?</h2>
        <p className="text-sm text-ink/70">
          Real site: <span className="font-mono font-bold text-pea-dark">{scenario.domain}</span>
          {view.myEntryNumber && <> · Yours is #{view.myEntryNumber}, so it's not on your list</>}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((o) => {
          const isSelected = selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              aria-pressed={isSelected}
              className={`relative text-left rounded-2xl p-1.5 transition-all cursor-pointer ${
                isSelected ? "bg-mustard ring-[3px] ring-ink -translate-y-0.5 shadow-[3px_3px_0_var(--color-ink)]" : "bg-transparent"
              }`}
            >
              <span
                className={`absolute -top-2 -left-2 z-10 size-8 rounded-full border-2 border-ink font-display text-lg flex items-center justify-center ${
                  isSelected ? "bg-ketchup text-white" : "bg-mustard"
                }`}
              >
                {o.number}
              </span>
              <MessageCard scenario={scenario} text={o.text} url={o.url} size="xs" />
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-3">
        <button
          onClick={() => {
            if (!selected) return;
            onVote(selected);
            setChanging(false);
          }}
          disabled={!selected}
          className="btn btn-pea w-full"
        >
          {selected ? `Lock in #${options.find((o) => o.id === selected)?.number} 🐟` : "Tap the real one"}
        </button>
      </div>
    </div>
  );
}
