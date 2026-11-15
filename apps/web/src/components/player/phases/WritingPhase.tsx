import { useEffect, useRef, useState } from "react";
import { LINK_TOKEN, MAX_FAKE_LENGTH, MIN_FAKE_LENGTH, POINTS_PER_HOOK, type PlayerViewState } from "@phish/shared";
import { normalizeFake, visibleLength } from "../../../lib/text";
import { getDraft, setDraft } from "../../../lib/session";
import ScenarioTicket from "../../shared/ScenarioTicket";
import MessageCard from "../../shared/MessageCard";
import SpiceBadge, { SPICE_INFO } from "../../shared/SpiceBadge";

interface WritingPhaseProps {
  view: PlayerViewState;
  onSubmit: (text: string, lureId: string) => void;
}

export default function WritingPhase({ view, onSubmit }: WritingPhaseProps) {
  const scenario = view.scenario!;
  const lures = view.lureOptions ?? [];
  const round = view.roundProgress?.current ?? 0;
  const multiplier = view.roundProgress?.multiplier ?? 1;

  const [text, setText] = useState(() => view.mySubmission?.text ?? getDraft(view.roomCode, round));
  const [lureId, setLureId] = useState(() => view.mySubmission?.lureId ?? lures[1]?.id ?? lures[0]?.id);
  const [editing, setEditing] = useState(!view.mySubmission);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(view.roomCode, round, text), [text, view.roomCode, round]);
  useEffect(() => {
    if (!lureId && lures.length) setLureId(lures[1]?.id ?? lures[0].id);
  }, [lures, lureId]);

  const lure = lures.find((l) => l.id === lureId);
  const normalized = normalizeFake(text);
  const hasLink = normalized.includes(LINK_TOKEN);
  const length = visibleLength(text);
  const problem = !hasLink
    ? "Add the 🔗 link somewhere in your message"
    : length < MIN_FAKE_LENGTH
      ? "A little more flavour, please (20+ characters)"
      : length > MAX_FAKE_LENGTH
        ? `Too long: trim ${length - MAX_FAKE_LENGTH} characters`
        : !lure
          ? "Pick a link"
          : null;

  const insertLink = () => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const pad = before && !before.endsWith(" ") && !before.endsWith("\n") ? " " : "";
    const next = `${before}${pad}${LINK_TOKEN}${after.startsWith(" ") || !after ? "" : " "}${after}`;
    setText(next);
    requestAnimationFrame(() => {
      const pos = before.length + pad.length + LINK_TOKEN.length;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  };

  const submit = () => {
    if (problem || !lure) return;
    onSubmit(normalized, lure.id);
    setEditing(false);
  };

  if (!editing && view.mySubmission) {
    const submittedLure = lures.find((l) => l.id === view.mySubmission!.lureId);
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <span className="text-5xl inline-block animate-pop-in">🍽️</span>
          <h2 className="font-display text-3xl">Plated up!</h2>
          <p className="text-ink/70 text-sm">{view.submittedCount ?? 1} fakes in the fryer so far. Watch the TV.</p>
        </div>
        <MessageCard scenario={scenario} text={view.mySubmission.text} url={submittedLure?.url ?? ""} size="sm" />
        <button onClick={() => setEditing(true)} className="btn btn-paper w-full !text-base">
          ✏️ Tweak it
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ScenarioTicket scenario={scenario} size="sm" />

      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <label htmlFor="fake" className="font-display text-xl">
            Write the scam {scenario.channel === "email" ? "email" : "message"}
          </label>
          <span className={`text-xs font-mono ${length > MAX_FAKE_LENGTH ? "text-ketchup font-bold" : "text-ink/50"}`}>
            {length}/{MAX_FAKE_LENGTH}
          </span>
        </div>
        <textarea
          id="fake"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={`${scenario.brand}: something sounds off with your account… check it at ${LINK_TOKEN}`}
          className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2.5 text-[16px] leading-snug resize-none focus:outline-none focus:ring-4 focus:ring-mustard placeholder:text-ink/30"
        />
        <button
          type="button"
          onClick={insertLink}
          className={`self-start rounded-full border-2 border-ink px-3 py-1 text-sm font-bold cursor-pointer ${hasLink ? "bg-pea text-white" : "bg-mustard animate-wobble"}`}
        >
          {hasLink ? "✓ Link added" : "🔗 Insert link"}
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="font-display text-xl">Pick your bait</h3>
        {lures.map((l) => {
          const selected = l.id === lureId;
          const info = SPICE_INFO[l.spice];
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setLureId(l.id)}
              aria-pressed={selected}
              className={`text-left rounded-xl border-[3px] px-3 py-2 transition-all cursor-pointer ${
                selected ? "border-ink bg-white shadow-[3px_3px_0_var(--color-ink)] -translate-y-0.5" : "border-ink/25 bg-white/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <SpiceBadge spice={l.spice} />
                <span className="text-xs font-bold text-ink/70">
                  {info.blurb} · <span className="text-pea-dark">+{POINTS_PER_HOOK[l.spice] * multiplier}</span>/hook
                </span>
              </div>
              <div className="font-mono text-[13px] font-bold mt-1.5 break-all text-[#1a5fd0]">{l.url}</div>
            </button>
          );
        })}
      </section>

      {view.tips && view.tips.length > 0 && (
        <section className="rounded-xl bg-mustard/25 border-2 border-dashed border-ink/40 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/60">🧂 Secret ingredients</p>
          <ul className="text-sm mt-1 list-disc pl-5">
            {view.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      {normalized && (
        <section className="flex flex-col gap-2">
          <h3 className="font-display text-xl">How it'll look</h3>
          <MessageCard scenario={scenario} text={normalized} url={lure?.url ?? ""} size="sm" />
        </section>
      )}

      <div className="flex flex-col gap-2 sticky bottom-3">
        {problem && text && <p className="text-sm font-semibold text-ketchup text-center bg-paper/90 rounded">{problem}</p>}
        <button onClick={submit} disabled={!!problem} className="btn btn-ketchup w-full">
          Plate it up 🍽️
        </button>
      </div>
    </div>
  );
}
