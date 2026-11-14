import { ROOM_CODE_LENGTH } from "@burrower/shared";
import { createRoom, getRoom } from "./rooms";
import type { SocketData } from "./room";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
/** Path to the built frontend in production (e.g. /app/public) */
const STATIC_DIR = process.env.STATIC_DIR;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

const roomPath = new RegExp(`^/api/v1/rooms/([A-Z0-9]{${ROOM_CODE_LENGTH}})(/ws)?$`, "i");

const server = Bun.serve({
  hostname: "0.0.0.0",
  port: PORT,

  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (path === "/api/v1/rooms" && req.method === "POST") {
      const room = createRoom();
      return json({ roomCode: room.code });
    }

    const match = path.match(roomPath);
    if (match && req.method === "GET") {
      const room = getRoom(match[1]);
      if (!room) return json({ error: "Room not found" }, 404);

      // GET /api/v1/rooms/:code -> does it exist?
      if (!match[2]) return json({ roomCode: room.code, phase: room.phase });

      // GET /api/v1/rooms/:code/ws?display=1 | ?name= | ?playerId=&token=
      const params = url.searchParams;
      let data: SocketData;
      if (params.get("display")) {
        data = { roomCode: room.code, kind: "display" };
      } else if (params.get("playerId") && params.get("token")) {
        const playerId = params.get("playerId")!;
        if (!room.checkReconnect(playerId, params.get("token")!)) {
          return json({ error: "Invalid reconnection" }, 401);
        }
        data = { roomCode: room.code, kind: "player", playerId };
      } else if (params.get("name")) {
        const player = room.addPlayer(params.get("name")!);
        data = { roomCode: room.code, kind: "player", playerId: player.id };
      } else {
        return json({ error: "Invalid connection parameters" }, 400);
      }

      if (server.upgrade(req, { data })) return undefined;
      return json({ error: "WebSocket upgrade failed" }, 500);
    }

    if (path === "/health") return json({ status: "ok" });

    if (STATIC_DIR) {
      const file = Bun.file(STATIC_DIR + (path === "/" ? "/index.html" : path));
      if (await file.exists()) return new Response(file);
      if (!path.startsWith("/api/")) return new Response(Bun.file(STATIC_DIR + "/index.html"));
    }

    return json({ error: "Not found" }, 404);
  },

  websocket: {
    data: {} as SocketData,
    open(ws) {
      const room = getRoom(ws.data.roomCode);
      if (!room) return ws.close(4004, "Room not found");
      room.connect(ws);
    },
    message(ws, message) {
      getRoom(ws.data.roomCode)?.handleRaw(ws, message);
    },
    close(ws) {
      getRoom(ws.data.roomCode)?.disconnect(ws);
    },
  },
});

console.log(`Burrower server running on http://localhost:${server.port}`);
