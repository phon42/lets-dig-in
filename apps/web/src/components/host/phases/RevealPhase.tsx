import type { Entry, Player, Round } from "@phish/shared";
import { POINTS_FOR_SPOTTING, POINTS_PER_HOOK } from "@phish/shared";
import { getScenario } from "../../../data/scenarios";
import { publicScenario } from "../../../lib/view";
import MessageCard from "../../shared/MessageCard";
import Avatar from "../../shared/Avatar";
import SpiceBadge from "../../shared/SpiceBadge";
import Art from "../../shared/Art";

interface RevealPhaseProps {
  round: Round;
  players: Record<string, Player>;
  step: number;
}

function votersFor(round: Round, entryId: string): string[] {
  return Object.entries(round.votes)
    .filter(([, id]) => id === entryId)
    .map(([voter]) => voter);
}

function Progress({ round, step }: { round: Round; step: number }) {
  return (
    <div className="flex items-center gap-2">
      {round.revealOrder.map((id, i) => {
        const entry = round.entries.find((e) => e.id === id)!;
        const number = round.entries.indexOf(entry) + 1;
        const shown = i < step || (i === step && step < round.revealOrder.length);
        const color = !shown ? "bg-ink-2 text-paper/50 border-paper/30" : entry.kind === "real" ? "bg-pea text-white" : "bg-ketchup text-white";
        return (
          <span
            key={id}
            className={`size-10 rounded-full border-[3px] border-ink font-display text-xl flex items-center justify-center transition-all ${color} ${i === step ? "scale-125 ring-4 ring-mustard" : ""}`}
          >
            {number}
          </span>
        );
      })}
      <span
        className={`size-10 rounded-full border-[3px] border-ink flex items-center justify-center text-xl ${step >= round.revealOrder.length ? "bg-mustard scale-125 ring-4 ring-mustard/50" : "bg-ink-2"}`}
      >
        🏆
      </span>
    </div>
  );
}

function VoterList({ ids, players, emptyText }: { ids: string[]; players: Record<string, Player>; emptyText: string }) {
  if (ids.length === 0) return <p className="text-xl text-ink/60 italic">{emptyText}</p>;
  return (
    <div className="flex flex-wrap gap-3">
      {ids.map((id, i) => {
        const p = players[id];
        if (!p) return null;
        return (
          <div key={id} className="flex items-center gap-2 bg-white/70 rounded-full pr-4 border-2 border-ink animate-pop-in" style={{ animationDelay: `${300 + i * 120}ms` }}>
            <Avatar avatarId={p.avatarId} size="size-10" className="!border-2" />
            <span className="font-display text-lg">{p.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function EntrySlide({ round, entry, players }: { round: Round; entry: Entry; players: Record<string, Player> }) {
  const scenario = publicScenario(round.scenarioId)!;
  const full = getScenario(round.scenarioId)!;
  const voters = votersFor(round, entry.id);
  const number = round.entries.indexOf(entry) + 1;
  const isReal = entry.kind === "real";
  const author = entry.authorId ? players[entry.authorId] : undefined;
  const highlights = entry.tells.flatMap((t) => t.phrases);
  const textTells = entry.tells.filter((t) => t.kind !== "link");
  const perHook = entry.lure ? POINTS_PER_HOOK[entry.lure.spice] * round.multiplier : 0;

  return (
    <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-8 flex-1 min-h-0">
      {/* The message */}
      <div className="relative flex flex-col justify-center min-h-0">
        <div className="relative animate-slide-up">
          <span className="absolute -top-5 -left-5 z-10 size-14 rounded-full bg-mustard border-[3px] border-ink font-display text-3xl flex items-center justify-center">
            {number}
          </span>
          <MessageCard
            scenario={scenario}
            text={entry.text}
            url={entry.url}
            size="xl"
            highlights={highlights}
            linkStatus={isReal ? "real" : "fake"}
            className="shadow-[8px_8px_0_rgba(0,0,0,0.4)]"
          />
          <div
            className={`absolute -top-8 -right-4 z-20 animate-stamp [animation-delay:400ms] font-display text-5xl px-6 py-2 rounded-2xl border-[5px] bg-paper/95 ${
              isReal ? "text-pea-dark border-pea-dark" : "text-ketchup border-ketchup"
            }`}
          >
            {isReal ? "FRESH CATCH ✓" : "PHISHY! 🎣"}
          </div>
        </div>
      </div>

      {/* The verdict */}
      <aside className="newsprint sticker p-6 flex flex-col gap-5 min-h-0 overflow-hidden animate-slide-up [animation-delay:200ms]">
        <div className="flex items-center gap-4">
          {isReal ? (
            <>
              <Art name="fresh-catch" fallback="🐟" className="size-20 text-6xl" />
              <div>
                <p className="text-ink/60 text-lg">The real message from</p>
                <p className="font-display text-4xl">{scenario.brand}</p>
              </div>
            </>
          ) : author ? (
            <>
              <Avatar avatarId={author.avatarId} size="size-20" />
              <div className="min-w-0">
                <p className="text-ink/60 text-lg">Cooked up by</p>
                <p className="font-display text-4xl truncate">{author.name}</p>
                {entry.lure && <SpiceBadge spice={entry.lure.spice} className="mt-1 !text-sm" />}
              </div>
            </>
          ) : (
            <>
              <span className="size-20 rounded-full bg-paper-2 border-[3px] border-ink flex items-center justify-center text-5xl">🏠</span>
              <div>
                <p className="text-ink/60 text-lg">The kitchen's</p>
                <p className="font-display text-4xl">House special</p>
              </div>
            </>
          )}
        </div>

        <div>
          <h4 className="font-display text-2xl mb-2">
            {isReal ? "🦅 Spotted by" : "🎣 Hooked"}
            {voters.length > 0 && (
              <span className="ml-3 text-pea-dark">
                {isReal
                  ? `+${(POINTS_FOR_SPOTTING * round.multiplier).toLocaleString()} each`
                  : author
                    ? `+${(perHook * voters.length).toLocaleString()} to ${author.name}`
                    : ""}
              </span>
            )}
          </h4>
          <VoterList ids={voters} players={players} emptyText={isReal ? "Nobody trusted it. Ouch. 😬" : "Nobody bit. 🦗"} />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <h4 className="font-display text-2xl mb-2">{isReal ? "Why it's legit" : "The tells"}</h4>
          <ul className="flex flex-col gap-2.5">
            {isReal ? (
              <>
                <li className="flex gap-3 text-lg leading-snug">
                  <span className="text-2xl">🔗</span>
                  <span>
                    The link stays on <b className="font-mono">{scenario.domain}</b>, the brand's real website
                  </span>
                </li>
                {full.real.notes.map((note) => (
                  <li key={note} className="flex gap-3 text-lg leading-snug">
                    <span className="text-2xl">✅</span>
                    <span>{note}</span>
                  </li>
                ))}
              </>
            ) : (
              <>
                {entry.tells.map((tell, i) => (
                  <li key={tell.kind} className="flex gap-3 text-lg leading-snug animate-slide-up" style={{ animationDelay: `${500 + i * 150}ms` }}>
                    <span className="text-2xl">{tell.emoji}</span>
                    <span>
                      <b>{tell.label}.</b> {tell.detail}
                    </span>
                  </li>
                ))}
                {textTells.length === 0 && (
                  <li className="flex gap-3 text-lg leading-snug text-pea-dark">
                    <span className="text-2xl">🧑‍🍳</span>
                    <span>
                      <b>Squeaky clean.</b> No red-flag words at all. Only the link gave it away.
                    </span>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ScoresSlide({ round, players }: { round: Round; players: Record<string, Player> }) {
  const ranked = Object.values(players).sort((a, b) => b.score - a.score);
  const top = Math.max(1, ...ranked.map((p) => p.score));
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center pb-10">
      <h2 className="display-outline text-7xl text-mustard mb-8">The scoreboard</h2>
      <div className="w-full max-w-6xl flex flex-col gap-4">
        {ranked.map((p, i) => {
          const delta = round.points[p.id] ?? 0;
          return (
            <div key={p.id} className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="font-display text-3xl w-10 text-right text-paper/70">{i + 1}</span>
              <Avatar avatarId={p.avatarId} size="size-16" />
              <span className="font-display text-3xl text-paper w-48 truncate">{p.name}</span>
              <div className="flex-1 relative h-12 rounded-2xl bg-ink-2 border-[3px] border-ink overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[repeating-linear-gradient(135deg,var(--color-mustard)_0_18px,var(--color-batter)_18px_36px)] transition-[width] duration-1000"
                  style={{ width: `${Math.max(4, (p.score / top) * 100)}%` }}
                />
              </div>
              <span className="font-display text-3xl w-32 text-right text-paper">{p.score.toLocaleString()}</span>
              <span className={`font-display text-2xl w-28 ${delta ? "text-pea animate-pop-in" : "text-paper/30"}`}>
                {delta ? `+${delta.toLocaleString()}` : "+0"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RevealPhase({ round, players, step }: RevealPhaseProps) {
  const entryId = round.revealOrder[step];
  const entry = round.entries.find((e) => e.id === entryId);
  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-center">
        <Progress round={round} step={step} />
      </div>
      {entry ? (
        <EntrySlide key={entry.id} round={round} entry={entry} players={players} />
      ) : (
        <ScoresSlide round={round} players={players} />
      )}
    </div>
  );
}
