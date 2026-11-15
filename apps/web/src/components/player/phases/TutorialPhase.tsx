export default function TutorialPhase({ isVip, onContinue }: { isVip: boolean; onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-3xl text-center">How it works</h2>
      <ol className="flex flex-col gap-3 text-[15px] leading-snug">
        <li className="flex gap-3">
          <span className="text-2xl">🧾</span>
          <span>You'll get a scenario and the brand's real website.</span>
        </li>
        <li className="flex gap-3">
          <span className="text-2xl">🎣</span>
          <span>
            Write a fake message that includes the <b>🔗 link</b>. Sneaky links are safer, blatant ones pay more if
            they still hook someone.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-2xl">🐟</span>
          <span>
            Vote for the <b>real</b> message. You score for spotting it and for every player your fake fools.
          </span>
        </li>
      </ol>
      {isVip ? (
        <button onClick={onContinue} className="btn w-full">
          Let's cook ▶
        </button>
      ) : (
        <p className="text-center text-ink/60 text-sm">Read along on the TV…</p>
      )}
    </div>
  );
}
