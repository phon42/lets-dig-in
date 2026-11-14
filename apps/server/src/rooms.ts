import { ROOM_CODE_LENGTH } from "@burrower/shared";
import { Room } from "./room";

// No 0/O/1/I so codes are easy to read off a TV
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_EXPIRY_MS = 60 * 60 * 1000;

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export function createRoom(): Room {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();
  const room = new Room(code);
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.isEmpty && now - room.lastActive > ROOM_EXPIRY_MS) {
      room.destroy();
      rooms.delete(code);
    }
  }
}, 60_000);
