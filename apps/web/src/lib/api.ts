const API_BASE = "/api/v1";

export async function createRoom(): Promise<string> {
  const res = await fetch(`${API_BASE}/rooms`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create room");
  const body = (await res.json()) as { roomCode: string };
  return body.roomCode;
}

export async function roomExists(code: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/rooms/${code}`);
  return res.ok;
}

export function getWebSocketUrl(roomCode: string, params: Record<string, string>): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const query = new URLSearchParams(params).toString();
  return `${protocol}//${window.location.host}${API_BASE}/rooms/${roomCode}/ws?${query}`;
}
