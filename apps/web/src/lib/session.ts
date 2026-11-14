/**
 * Per-tab player identity, so a phone that reloads or drops its socket
 * reclaims the same seat. sessionStorage (not localStorage) keeps tabs
 * independent, which makes it easy to playtest several players in one browser.
 */
export interface PlayerSession {
  name: string;
  playerId?: string;
  token?: string;
}

const key = (roomCode: string) => `burrower_player_${roomCode.toUpperCase()}`;

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getPlayerSession(roomCode: string): PlayerSession | null {
  try {
    const raw = storage()?.getItem(key(roomCode));
    return raw ? (JSON.parse(raw) as PlayerSession) : null;
  } catch {
    return null;
  }
}

export function setPlayerSession(roomCode: string, session: PlayerSession): void {
  try {
    storage()?.setItem(key(roomCode), JSON.stringify(session));
  } catch {
    // Private mode etc: the game still works, reconnects just won't
  }
}

export function clearPlayerSession(roomCode: string): void {
  try {
    storage()?.removeItem(key(roomCode));
  } catch {
    // ignore
  }
}
