// ---------- Static game vocabulary ----------

export type LogSource = "LOGIN" | "NETWORK" | "FILE";
export const LOG_SOURCES: readonly LogSource[] = ["LOGIN", "NETWORK", "FILE"];

/** Each log source gives its watcher one signature tool */
export type DefenderTool = "RESET" | "FIREWALL" | "BAIT";
export const TOOL_FOR_SOURCE: Record<LogSource, DefenderTool> = {
  LOGIN: "RESET",
  NETWORK: "FIREWALL",
  FILE: "BAIT",
};

export type NoiseLevel = "low" | "normal" | "high";

export interface Settings {
  roundSeconds: number;
  noise: NoiseLevel;
}

export type Phase = "LOBBY" | "BRIEFING" | "PLAYING" | "GAME_OVER";
export type Role = "MOLE" | "DEFENDER";

// ---------- Network ----------

/** Pseudo-machine for traffic that originates outside the network */
export const INTERNET = "internet";

export interface Machine {
  id: string;
  name: string;
  /** 0 = internet-facing edge, higher = deeper in the network */
  layer: number;
  slot: number;
  slots: number;
  color: string;
  /** Crown jewel: the mole wins by looting enough of these */
  jewel: boolean;
  /** Where the mole starts (and returns to when caught) */
  entry: boolean;
}

export interface Link {
  a: string;
  b: string;
}

export interface NetworkMap {
  machines: Machine[];
  links: Link[];
  layers: number;
}

// ---------- Logs ----------

export type FileAction = "read" | "write" | "copy";

/**
 * One line in a defender feed. Legitimate activity always produces a matching
 * NETWORK + LOGIN + FILE triple; mole activity leaves a piece missing or wrong.
 */
export interface LogEntry {
  id: number;
  /** Round-clock time (ms) the entry appeared */
  at: number;
  source: LogSource;
  /** The machine the entry is about (destination for NETWORK/LOGIN) */
  machine: string;
  from?: string;
  user?: string;
  port?: number;
  action?: FileAction;
  file?: string;
}

// ---------- Public (everyone can see) ----------

export interface MachineStatus {
  id: string;
  offlineMs: number;
  firewallMs: number;
  looted: boolean;
  whackVotes: number;
}

export type AnnouncementKind =
  | "WHACK_HIT"
  | "WHACK_MISS"
  | "LOOT"
  | "SPIKE_WARN"
  | "SPIKE_START"
  | "RESET"
  | "FIREWALL"
  | "BAIT";

export interface Announcement {
  id: number;
  at: number;
  kind: AnnouncementKind;
  text: string;
  machine?: string;
}

export interface WhackView {
  machine: string;
  stage: "DROPPING" | "RESULT";
  /** Only revealed once stage is RESULT */
  hit?: boolean;
}

export interface SpikeView {
  stage: "INCOMING" | "ACTIVE";
  msLeft: number;
}

export type ReplayStepKind = "START" | "DIG_QUIET" | "DIG_LOUD" | "LOOT" | "CAUGHT" | "KNOCKED_BACK";

export interface ReplayStep {
  at: number;
  machine: string;
  kind: ReplayStepKind;
}

export interface Replay {
  path: ReplayStep[];
  whacks: { at: number; machine: string; hit: boolean }[];
}

export interface Outcome {
  winner: "MOLE" | "DEFENDERS";
  reason: string;
}

export interface PublicGameView {
  round: number;
  moleId: string;
  map: NetworkMap;
  machines: MachineStatus[];
  roundMs: number;
  elapsedMs: number;
  timeLeftMs: number;
  whacksLeft: number;
  catches: number;
  catchesToWin: number;
  loots: number;
  lootsToWin: number;
  spike: SpikeView | null;
  whack: WhackView | null;
  /** Bait was tripped: the mole was seen here */
  revealedMole: { machine: string; msLeft: number } | null;
  announcements: Announcement[];
  briefingMsLeft: number;
  readyIds: string[];
  defenderSources: Record<string, LogSource[]>;
  outcome: Outcome | null;
  /** Only sent once the round is over */
  replay: Replay | null;
}

// ---------- Private (per role) ----------

export type MoleActionKind = "DIG_QUIET" | "DIG_LOUD" | "LOOT";

export interface MoleView {
  position: string;
  neighbors: string[];
  action: { kind: MoleActionKind; target: string; progress: number; msLeft: number } | null;
  decoyCooldownMs: number;
  canLoot: boolean;
  notice: string | null;
}

export interface DefenderView {
  sources: LogSource[];
  tools: { tool: DefenderTool; cooldownMs: number }[];
  /** Newest first */
  feed: LogEntry[];
  digIn: { machine: string; msLeft: number } | null;
  digInCooldownMs: number;
  whackVote: string | null;
  whackVotesNeeded: number;
  /** Team-visible bait locations (hidden from the mole and the TV) */
  baits: string[];
}

export interface PublicPlayer {
  id: string;
  name: string;
  connected: boolean;
}

/** Everything a single socket needs to render. Sent every server tick. */
export interface RoomView {
  roomCode: string;
  phase: Phase;
  players: PublicPlayer[];
  settings: Settings;
  game: PublicGameView | null;
  /** null for the TV display */
  youId: string | null;
  /** null if spectating (display, or joined mid-round) */
  role: Role | null;
  mole: MoleView | null;
  defender: DefenderView | null;
}
