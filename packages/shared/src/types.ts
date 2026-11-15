export type GamePhase =
  | "LOBBY"
  | "TUTORIAL"
  | "WRITING"
  | "VOTING"
  | "REVEAL"
  | "LEADERBOARD";

/** How the message arrives; changes how it's drawn */
export type Channel = "sms" | "email" | "push" | "dm";

/** How blatant a fake link is. Hotter = more obvious = more points if it still hooks someone. */
export type Spice = "mild" | "medium" | "hot";

export interface PlayerStats {
  hooks: number; // Votes your fakes received
  spots: number; // Times you voted for the real message
  gotHooked: number; // Times you voted for a fake
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isVip: boolean;
  isConnected: boolean;
  avatarId: number;
  stats: PlayerStats;
}

/** A dodgy link a player can bake into their fake */
export interface Lure {
  id: string;
  spice: Spice;
  url: string;
  trick: string; // Short name, e.g. "Letter costume"
  explanation: string; // Shown at the reveal
}

/** What everyone sees about a scenario (never includes the real message) */
export interface PublicScenario {
  id: string;
  emoji: string;
  channel: Channel;
  brand: string;
  domain: string; // The brand's real domain, shown to everyone
  sender: string; // Display name / number / address shown on every message
  subject?: string; // Email subject line
  prompt: string; // "Your bank flags a suspicious charge"
}

/** A truth-bank entry */
export interface Scenario extends PublicScenario {
  paths: string[]; // URL path words that fit the scenario, for generated lures
  real: {
    text: string; // Contains {{link}}
    url: string; // On the real domain
    notes: string[]; // Why it's legit, shown at the reveal
  };
  house: string; // A kitchen-made fake for small games, contains {{link}}
}

export type TellKind =
  | "link"
  | "urgency"
  | "threat"
  | "secrets"
  | "verify"
  | "money"
  | "prize"
  | "generic"
  | "secrecy"
  | "contact"
  | "shouting";

/** A red flag found in a fake, explained at the reveal */
export interface Tell {
  kind: TellKind;
  emoji: string;
  label: string;
  detail: string;
  phrases: string[]; // Exact substrings to highlight
}

export type EntryKind = "real" | "player" | "house";

/** One message in the voting lineup */
export interface Entry {
  id: string;
  kind: EntryKind;
  authorId?: string; // For player fakes
  text: string;
  url: string;
  lure?: Lure; // Fakes only
  tells: Tell[]; // Fakes only
}

export interface Fake {
  text: string;
  lureId: string;
}

export interface Round {
  scenarioId: string;
  multiplier: number;
  lureOptions: Record<string, Lure[]>; // playerId -> lures dealt this round
  tips: Record<string, string[]>; // playerId -> secret-ingredient suggestions
  fakes: Record<string, Fake>; // playerId -> submitted fake
  entries: Entry[]; // Shuffled lineup, built when writing ends
  votes: Record<string, string>; // voterId -> entryId
  points: Record<string, number>; // playerId -> points earned this round
  revealOrder: string[]; // entryIds, fakes first (least voted first), real last
}

export interface RoomConfig {
  rounds: number;
  writeSeconds: number;
  voteSeconds: number;
}

/** A voting option as a phone sees it: no author, no kind */
export interface VoteOption {
  id: string;
  number: number; // Position in the TV lineup (1-based)
  text: string;
  url: string;
}

export interface PlayerRoundResult {
  points: number;
  vote:
    | { kind: "real" }
    | { kind: "house" }
    | { kind: "player"; authorName: string }
    | null;
  hookedNames: string[]; // Who fell for your fake
  wrote: boolean;
}

export interface Award {
  id: string;
  emoji: string;
  title: string;
  playerId: string;
  detail: string;
}

/** The slice of host state a single phone gets */
export interface PlayerViewState {
  roomCode: string;
  phase: GamePhase;
  playerId: string;
  players: Record<string, Player>;
  timer: number | null;
  roundProgress?: { current: number; total: number; multiplier: number };
  scenario?: PublicScenario;

  // Writing
  lureOptions?: Lure[];
  tips?: string[];
  mySubmission?: Fake;
  submittedCount?: number;

  // Voting
  options?: VoteOption[];
  myVoteId?: string;
  myEntryNumber?: number; // Your own fake's position on the TV, if you wrote one

  // Reveal
  result?: PlayerRoundResult;
  revealDone?: boolean;

  // Leaderboard
  awards?: Award[];
}
