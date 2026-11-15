/**
 * localStorage-backed sessions so players and hosts can refresh or lose
 * signal and rejoin with the same identity.
 */
import type { GameLength } from "../machines/gameMachine";

export interface PlayerSession {
  name: string;
  playerId?: string;
  token?: string;
}

const playerKey = (code: string) => `phish_player_${code.toUpperCase()}`;
const hostKey = (code: string) => `phish_host_${code.toUpperCase()}`;
const hostLengthKey = (code: string) => `phish_host_length_${code.toUpperCase()}`;
const LAST_ROOM_KEY = "phish_last_room";
const draftKey = (code: string, round: number) => `phish_draft_${code.toUpperCase()}_${round}`;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode); sessions just won't survive a refresh
  }
}

export const getPlayerSession = (code: string) => read<PlayerSession>(playerKey(code));

export function setPlayerSession(code: string, session: PlayerSession) {
  write(playerKey(code), JSON.stringify(session));
  write(LAST_ROOM_KEY, code.toUpperCase());
}

export function updatePlayerSession(code: string, update: Partial<PlayerSession>) {
  const existing = getPlayerSession(code);
  if (existing) setPlayerSession(code, { ...existing, ...update });
}

export function clearPlayerSession(code: string) {
  write(playerKey(code), null);
  try {
    if (localStorage.getItem(LAST_ROOM_KEY) === code.toUpperCase()) write(LAST_ROOM_KEY, null);
  } catch {
    // ignore
  }
}

export function getLastRoom(): { roomCode: string; session: PlayerSession } | null {
  try {
    const roomCode = localStorage.getItem(LAST_ROOM_KEY);
    if (!roomCode) return null;
    const session = getPlayerSession(roomCode);
    return session ? { roomCode, session } : null;
  } catch {
    return null;
  }
}

export function getHostToken(code: string): string | null {
  try {
    return localStorage.getItem(hostKey(code));
  } catch {
    return null;
  }
}

export const setHostToken = (code: string, token: string) => write(hostKey(code), token);

export function getHostGameLength(code: string): GameLength | null {
  try {
    const value = localStorage.getItem(hostLengthKey(code));
    return value === "snack" || value === "feast" ? value : null;
  } catch {
    return null;
  }
}

export const setHostGameLength = (code: string, length: GameLength) => write(hostLengthKey(code), length);

export function getDraft(code: string, round: number): string {
  try {
    return localStorage.getItem(draftKey(code, round)) ?? "";
  } catch {
    return "";
  }
}

export const setDraft = (code: string, round: number, text: string) =>
  write(draftKey(code, round), text || null);
