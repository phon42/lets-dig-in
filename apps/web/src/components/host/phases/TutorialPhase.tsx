import { POINTS_FOR_SPOTTING, POINTS_PER_HOOK } from "@phish/shared";
import SpiceBadge from "../../shared/SpiceBadge";

const STEPS = [
  {
    n: 1,
    title: "Take the order",
    emoji: "🧾",
    body: (
      <>
        Everyone gets the same scenario, like <b>"Your bank flags a suspicious charge"</b>, plus the brand's{" "}
        <b>real website</b>.
      </>
    ),
  },
  {
    n: 2,
    title: "Cook a phish",
    emoji: "🎣",
    body: (
      <>
        On your phone, write the fake a scammer would send. It <b>must include a 🔗 link</b>, and you pick how dodgy the
        link looks:
        <span className="flex flex-wrap gap-1.5 mt-3">
          <SpiceBadge spice="mild" showPoints />
          <SpiceBadge spice="medium" showPoints />
          <SpiceBadge spice="hot" showPoints />
        </span>
      </>
    ),
  },
  {
    n: 3,
    title: "Spot the fresh catch",
    emoji: "🐟",
    body: (
      <>
        Your fakes get shuffled in with <b>one real message</b>. Vote for the one you think is legit. Check the links,
        the tone, the details…
      </>
    ),
  },
];

export default function TutorialPhase() {
  return (
    <div className="h-full flex flex-col gap-6">
      <h2 className="display-outline text-6xl text-mustard text-center">Tonight's menu</h2>
      <div className="grid grid-cols-3 gap-7 flex-1 min-h-0">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className="newsprint sticker p-7 flex flex-col gap-3 animate-slide-up"
            style={{ animationDelay: `${i * 150}ms`, rotate: `${(i - 1) * 1.2}deg` }}
          >
            <div className="flex items-center gap-3">
              <span className="size-12 rounded-full bg-ketchup text-white font-display text-3xl flex items-center justify-center border-[3px] border-ink">
                {step.n}
              </span>
              <h3 className="font-display text-3xl">{step.title}</h3>
            </div>
            <div className="text-7xl my-2 animate-wobble self-center">{step.emoji}</div>
            <p className="text-xl leading-snug">{step.body}</p>
          </div>
        ))}
      </div>
      <div className="sticker bg-ink-2 border-paper/40 text-paper px-8 py-5 flex items-center justify-around text-xl">
        <span>
          🐟 Spot the real one <b className="text-mustard font-display text-2xl">+{POINTS_FOR_SPOTTING}</b>
        </span>
        <span>
          🎣 Each player you hook{" "}
          <b className="text-mustard font-display text-2xl">
            +{POINTS_PER_HOOK.mild}–{POINTS_PER_HOOK.hot}
          </b>
        </span>
        <span>
          🔥 Final round <b className="text-ketchup font-display text-2xl">×2</b>
        </span>
      </div>
    </div>
  );
}
