import type { NoiseLevel, Settings } from "./types";

export const ROOM_CODE_LENGTH = 4;
export const MIN_PLAYERS = 2;
export const TICK_MS = 200;

export const DEFAULT_SETTINGS: Settings = {
  roundSeconds: 420,
  noise: "normal",
};

export const ROUND_LENGTH_OPTIONS = [300, 420, 600] as const;

/** Legit sessions per second. Each session yields one line on each of the three feeds. */
export const NOISE_RATES: Record<NoiseLevel, number> = {
  low: 0.3,
  normal: 0.5,
  high: 0.8,
};

/** All tunables in one place so playtests can tweak them quickly */
export const GAME = {
  briefingMs: 25_000,

  // Mole
  quietDigMs: 9_000,
  loudDigMs: 3_000,
  lootMs: 10_000,
  decoyCooldownMs: 25_000,
  lootsToWin: 3,

  // Defenders
  catchesToWin: 2,
  startingWhacks: 5,
  whackSuspenseMs: 2_000,
  whackResultMs: 3_000,
  missOfflineMs: 30_000,
  resetCooldownMs: 40_000,
  firewallMs: 25_000,
  firewallCooldownMs: 40_000,
  baitCooldownMs: 30_000,
  maxBaits: 2,
  baitRevealMs: 8_000,
  digInMs: 10_000,
  digInCooldownMs: 30_000,

  // Traffic spikes
  spikeWarnMs: 10_000,
  spikeMs: 12_000,
  spikeMultiplier: 3,
  firstSpikeMinMs: 45_000,
  firstSpikeMaxMs: 75_000,
  spikeGapMinMs: 50_000,
  spikeGapMaxMs: 80_000,

  feedLength: 30,
} as const;

/** Employees whose credentials show up in the logs */
export const USERS: readonly { name: string; emoji: string }[] = [
  { name: "alice", emoji: "🦊" },
  { name: "bob", emoji: "🐻" },
  { name: "carol", emoji: "🐱" },
  { name: "dave", emoji: "🐶" },
  { name: "erin", emoji: "🐸" },
  { name: "frank", emoji: "🐼" },
  { name: "grace", emoji: "🐯" },
  { name: "heidi", emoji: "🐨" },
  { name: "ivan", emoji: "🐵" },
  { name: "judy", emoji: "🐰" },
];

export const USER_EMOJI: Record<string, string> = Object.fromEntries(
  USERS.map((u) => [u.name, u.emoji]),
);
