import type { Lure, Scenario, Tell, TellKind } from "@phish/shared";
import { LINK_TOKEN } from "@phish/shared";

/**
 * Spots classic phishing red flags in a fake, for the reveal breakdown.
 * The link is always a tell; text tells are found with simple patterns.
 */

interface Rule {
  kind: TellKind;
  emoji: string;
  label: string;
  detail: string;
  re: RegExp;
}

const RULES: Rule[] = [
  {
    kind: "urgency",
    emoji: "⏰",
    label: "Fake deadline",
    detail: "Pressure to act fast so you don't stop and think.",
    re: /\b(urgent(ly)?|immediately|right away|asap|act now|within \d+\s?(h|hrs?|hours?|mins?|minutes?)|in \d+\s?(hrs?|hours?|mins?|minutes?)|before midnight|by midnight|today only|expires? (today|soon|tonight)|final (notice|warning|reminder)|last chance|time[- ]sensitive|don'?t delay|hurry|before it expires|expiring)\b/gi,
  },
  {
    kind: "threat",
    emoji: "😱",
    label: "Scare tactic",
    detail: "Threatens something bad (a lockout, deletion, a fine) to rattle you.",
    re: /\b(suspend(ed)?|locked|lock(ed)? out|terminat\w*|deactivat\w*|permanently|deleted|legal action|arrest\w*|warrant|penalt(y|ies)|fined?|frozen|freeze|restricted|blocked|disabled|compromised|hacked|police|court)\b/gi,
  },
  {
    kind: "secrets",
    emoji: "🔑",
    label: "Asks for secrets",
    detail: "Real companies never ask you to hand over passwords, PINs or codes.",
    re: /\b(password|passcode|pin( number)?|ssn|social security( number)?|national insurance|verification code|one[- ]time (code|password|passcode)|otp|security (code|question)|cvv|cvc|card (number|details)|bank details|routing number|account number|login details|credentials|sort code|maiden name)\b/gi,
  },
  {
    kind: "verify",
    emoji: "🪪",
    label: '"Verify your account"',
    detail: "Classic bait: 'confirm' details the company already has.",
    re: /\b(verify|confirm|validate|re-?confirm|re-?validate|update) (your |the |that )?(identity|account|details|information|info|payment|billing|ownership|card)\b/gi,
  },
  {
    kind: "money",
    emoji: "💸",
    label: "Weird payment",
    detail: "Gift cards, crypto, wire transfers and tiny 'fees' are scammer favorites.",
    re: /\b(gift ?cards?|itunes|steam card|bitcoin|crypto\w*|wire transfer|western union|processing fee|small fee|customs fee|unpaid fee|redelivery fee|release fee|pay now)\b|[£$€]\s?[0-3]\.\d\d\b/gi,
  },
  {
    kind: "prize",
    emoji: "🎁",
    label: "Too good to be true",
    detail: "Prizes, refunds and freebies you never asked for.",
    re: /\b(congratulations|congrats|you('ve| have)? won|winner|been selected|free|prize|reward|bonus|claim (your|now|it|here)|exclusive offer|eligible)\b/gi,
  },
  {
    kind: "generic",
    emoji: "👋",
    label: "Generic greeting",
    detail: "'Dear customer': the real company knows your name.",
    re: /\b(dear (valued )?(customer|user|member|client|account ?holder|sir|madam|student|sir\/madam)|hello (customer|user)|valued customer)\b/gi,
  },
  {
    kind: "secrecy",
    emoji: "🤫",
    label: "Keep it secret",
    detail: "Scammers try to isolate you so no one can warn you.",
    re: /\b(don'?t tell|do not tell|keep (this|it) (private|confidential|between us)|confidential)\b/gi,
  },
  {
    kind: "contact",
    emoji: "📞",
    label: "Off-channel contact",
    detail: "Pushes you to reply with info or call a number in the message.",
    re: /\b(reply with|text back|send (us|me) (your|the)|call (us|this number|now|immediately|our)|whatsapp)\b/gi,
  },
];

const SPICE_TELL: Record<Lure["spice"], string> = {
  mild: "Sneaky link",
  medium: "Costume link",
  hot: "Blatant link",
};

function uniqueMatches(text: string, re: RegExp): string[] {
  const found = new Map<string, string>();
  for (const match of text.matchAll(re)) {
    const phrase = match[0];
    if (!found.has(phrase.toLowerCase())) found.set(phrase.toLowerCase(), phrase);
  }
  return [...found.values()];
}

function shouting(text: string, scenario: Scenario): string[] {
  const allowed = new Set(
    [scenario.sender, scenario.brand, "STOP", "YES", "NO", "PIN", "SMS", "URGENT"]
      .flatMap((s) => s.split(/\W+/))
      .map((s) => s.toUpperCase()),
  );
  const caps = [...text.matchAll(/\b[A-Z]{4,}\b/g)]
    .map((m) => m[0])
    .filter((w) => !allowed.has(w));
  const bangs = [...text.matchAll(/!{2,}/g)].map((m) => m[0]);
  const phrases = [...new Set([...caps, ...bangs])];
  return caps.length >= 1 || bangs.length >= 1 ? phrases : [];
}

export function findTells(text: string, lure: Lure | undefined, scenario: Scenario): Tell[] {
  const clean = text.split(LINK_TOKEN).join(" ");
  const tells: Tell[] = [];

  if (lure) {
    tells.push({
      kind: "link",
      emoji: "🔗",
      label: `${SPICE_TELL[lure.spice]}: ${lure.trick}`,
      detail: lure.explanation,
      phrases: [],
    });
  }

  for (const rule of RULES) {
    const phrases = uniqueMatches(clean, rule.re);
    if (phrases.length) {
      tells.push({ kind: rule.kind, emoji: rule.emoji, label: rule.label, detail: rule.detail, phrases });
    }
  }

  const loud = shouting(clean, scenario);
  if (loud.length) {
    tells.push({
      kind: "shouting",
      emoji: "📢",
      label: "SHOUTING",
      detail: "Caps lock and stacks of exclamation marks. Real alerts stay calm.",
      phrases: loud,
    });
  }

  return tells;
}
