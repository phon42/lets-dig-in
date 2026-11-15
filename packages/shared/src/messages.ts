import { z } from "zod";

// Every WebSocket message uses this envelope. The server only reads `target`.
export const NetworkMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  target: z.string().optional(), // "HOST", "ALL", or a playerId
  senderId: z.string().optional(), // Injected by the server
});

export type NetworkMessage = z.infer<typeof NetworkMessageSchema>;

export const MessageTypes = {
  // Server -> Client
  ROOM_JOINED: "ROOM_JOINED",
  ERROR: "ERROR",
  PLAYER_CONNECTED: "PLAYER_CONNECTED",
  HOST_CONNECTED: "HOST_CONNECTED",
  PLAYER_DISCONNECTED: "PLAYER_DISCONNECTED",

  // Player -> Host (relayed)
  START_GAME: "START_GAME",
  SUBMIT_FAKE: "SUBMIT_FAKE",
  SUBMIT_VOTE: "SUBMIT_VOTE",
  NEXT_PHASE: "NEXT_PHASE",
  PLAY_AGAIN: "PLAY_AGAIN",

  // Host -> Player (relayed)
  SYNC_STATE: "SYNC_STATE",

  // Host crash recovery
  REQUEST_STATE_RECOVERY: "REQUEST_STATE_RECOVERY",
  PROVIDE_STATE_RECOVERY: "PROVIDE_STATE_RECOVERY",
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

export interface SubmitFakePayload {
  text: string;
  lureId: string;
}

export interface SubmitVotePayload {
  entryId: string;
}
