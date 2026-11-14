import { z } from "zod";
import type { RoomView } from "./types";

const machineId = z.string().min(1).max(32);

/**
 * Client -> server. The server is authoritative: every message is validated
 * here and then checked against game rules before anything changes.
 */
export const ClientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("START_GAME") }),
  z.object({ type: z.literal("RETURN_TO_LOBBY") }),
  z.object({
    type: z.literal("UPDATE_SETTINGS"),
    settings: z.object({
      roundSeconds: z.number().int().min(60).max(900).optional(),
      noise: z.enum(["low", "normal", "high"]).optional(),
    }),
  }),
  z.object({ type: z.literal("READY") }),

  // Mole
  z.object({ type: z.literal("MOLE_DIG"), target: machineId, mode: z.enum(["QUIET", "LOUD"]) }),
  z.object({ type: z.literal("MOLE_LOOT") }),
  z.object({ type: z.literal("MOLE_DECOY"), target: machineId }),
  z.object({ type: z.literal("MOLE_CANCEL") }),

  // Defenders
  z.object({ type: z.literal("WHACK_VOTE"), target: machineId.nullable() }),
  z.object({
    type: z.literal("USE_TOOL"),
    tool: z.enum(["RESET", "FIREWALL", "BAIT"]),
    target: machineId,
  }),
  z.object({ type: z.literal("DIG_IN"), target: machineId }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

/** Server -> client */
export type ServerMessage =
  | { type: "JOINED"; playerId: string; token: string }
  | { type: "STATE"; view: RoomView }
  | { type: "ERROR"; message: string };
