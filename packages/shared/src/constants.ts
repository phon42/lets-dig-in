import type { Spice } from "./types";

export const ROOM_CODE_LENGTH = 6;
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;

// Scoring
/** Voting for the real message */
export const POINTS_FOR_SPOTTING = 1000;
/** Per player who votes for your fake, by how sneaky your link is (sneakier pays less) */
export const POINTS_PER_HOOK: Record<Spice, number> = {
  mild: 250,
  medium: 500,
  hot: 750,
};
/** Score multiplier for the last round */
export const FINAL_ROUND_MULTIPLIER = 2;

/** Players type this token where their (fake) link goes; the real message uses it too */
export const LINK_TOKEN = "{{link}}";
export const MIN_FAKE_LENGTH = 20;
export const MAX_FAKE_LENGTH = 320;
