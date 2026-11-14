import type { ServerWebSocket } from "bun";
import { nanoid } from "nanoid";
import {
  ClientMessageSchema,
  DEFAULT_SETTINGS,
  MIN_PLAYERS,
  TICK_MS,
  type ClientMessage,
  type Phase,
  type RoomView,
  type ServerMessage,
  type Settings,
} from "@burrower/shared";
import { Game, type ActionResult } from "./game/engine";

export interface SocketData {
  roomCode: string;
  kind: "player" | "display";
  playerId?: string;
}

export type Socket = ServerWebSocket<SocketData>;

interface PlayerConn {
  id: string;
  name: string;
  token: string;
  socket: Socket | null;
  disconnectedAt: number | null;
}

/** Lobby players who vanished this long ago are dropped when a round starts */
const STALE_PLAYER_MS = 60_000;

function send(ws: Socket, msg: ServerMessage): void {
  ws.send(JSON.stringify(msg));
}

/**
 * A room owns its players' connections and (while a round is on) a Game.
 * Unlike a host-authoritative design, the server runs the rules and the tick
 * loop, and every client (phones and the optional TV) is a thin view.
 */
export class Room {
  readonly code: string;
  readonly players = new Map<string, PlayerConn>();
  readonly displays = new Set<Socket>();
  settings: Settings = { ...DEFAULT_SETTINGS };
  game: Game | null = null;
  lastActive = Date.now();

  private rounds = 0;
  private loop: ReturnType<typeof setInterval> | null = null;

  constructor(code: string) {
    this.code = code;
  }

  get phase(): Phase {
    return this.game?.phase ?? "LOBBY";
  }

  get isEmpty(): boolean {
    return this.displays.size === 0 && ![...this.players.values()].some((p) => p.socket);
  }

  // ---------------------------------------------------------------- membership

  addPlayer(rawName: string): PlayerConn {
    const base = rawName.trim().slice(0, 16) || "Player";
    const taken = new Set([...this.players.values()].map((p) => p.name.toLowerCase()));
    let name = base;
    for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${base} ${i}`;

    const player: PlayerConn = { id: nanoid(10), name, token: nanoid(24), socket: null, disconnectedAt: null };
    this.players.set(player.id, player);
    return player;
  }

  checkReconnect(playerId: string, token: string): boolean {
    return this.players.get(playerId)?.token === token;
  }

  connect(ws: Socket): void {
    this.lastActive = Date.now();
    if (ws.data.kind === "display") {
      this.displays.add(ws);
    } else {
      const player = this.players.get(ws.data.playerId!);
      if (!player) {
        ws.close(4004, "Unknown player");
        return;
      }
      // Newest connection wins (phones love to leave half-dead sockets around)
      player.socket = ws;
      player.disconnectedAt = null;
      send(ws, { type: "JOINED", playerId: player.id, token: player.token });
    }
    this.broadcast();
  }

  disconnect(ws: Socket): void {
    this.lastActive = Date.now();
    if (ws.data.kind === "display") {
      this.displays.delete(ws);
      return;
    }
    const player = this.players.get(ws.data.playerId!);
    if (player && player.socket === ws) {
      player.socket = null;
      player.disconnectedAt = Date.now();
      this.broadcast();
    }
  }

  // ---------------------------------------------------------------- messages

  handleRaw(ws: Socket, raw: string | Buffer): void {
    this.lastActive = Date.now();
    if (ws.data.kind !== "player") return; // the TV is read-only

    let json: unknown;
    try {
      json = JSON.parse(typeof raw === "string" ? raw : raw.toString());
    } catch {
      return send(ws, { type: "ERROR", message: "Bad message" });
    }
    const parsed = ClientMessageSchema.safeParse(json);
    if (!parsed.success) return send(ws, { type: "ERROR", message: "Bad message" });

    const error = this.handle(ws.data.playerId!, parsed.data);
    if (error) send(ws, { type: "ERROR", message: error });
    this.broadcast();
  }

  private handle(playerId: string, msg: ClientMessage): ActionResult {
    const game = this.game;
    switch (msg.type) {
      case "START_GAME":
        return this.start();
      case "RETURN_TO_LOBBY":
        this.stopLoop();
        this.game = null;
        return null;
      case "UPDATE_SETTINGS":
        if (this.phase !== "LOBBY") return "Settings are locked during a round";
        this.settings = { ...this.settings, ...msg.settings };
        return null;
      case "READY":
        game?.markReady(playerId);
        return null;
    }

    if (!game) return "No round in progress";
    switch (msg.type) {
      case "MOLE_DIG":
        return game.moleDig(playerId, msg.target, msg.mode);
      case "MOLE_LOOT":
        return game.moleLoot(playerId);
      case "MOLE_DECOY":
        return game.moleDecoy(playerId, msg.target);
      case "MOLE_CANCEL":
        return game.moleCancel(playerId);
      case "WHACK_VOTE":
        return game.voteWhack(playerId, msg.target);
      case "USE_TOOL":
        return game.useTool(playerId, msg.tool, msg.target);
      case "DIG_IN":
        return game.startDigIn(playerId, msg.target);
    }
  }

  // ---------------------------------------------------------------- rounds

  private start(): ActionResult {
    if (this.phase === "BRIEFING" || this.phase === "PLAYING") return "A round is already running";

    const now = Date.now();
    for (const [id, p] of this.players) {
      if (!p.socket && p.disconnectedAt && now - p.disconnectedAt > STALE_PLAYER_MS) this.players.delete(id);
    }
    const participants = [...this.players.values()].filter((p) => p.socket);
    if (participants.length < MIN_PLAYERS) return `Need at least ${MIN_PLAYERS} connected players`;

    // Rotate the mole so everyone gets a turn
    const mole = participants[this.rounds % participants.length];
    this.rounds++;
    this.game = new Game({
      players: participants.map((p) => ({ id: p.id, name: p.name })),
      moleId: mole.id,
      settings: this.settings,
      round: this.rounds,
    });
    this.startLoop();
    return null;
  }

  private startLoop(): void {
    this.stopLoop();
    this.loop = setInterval(() => this.tick(), TICK_MS);
  }

  private stopLoop(): void {
    if (this.loop) clearInterval(this.loop);
    this.loop = null;
  }

  private tick(): void {
    if (!this.game) return this.stopLoop();
    this.game.tick(TICK_MS);
    if (this.game.phase === "GAME_OVER") this.stopLoop();
    this.broadcast();
  }

  destroy(): void {
    this.stopLoop();
  }

  // ---------------------------------------------------------------- views

  viewFor(playerId: string | null): RoomView {
    const game = this.game;
    const inRound = !!(game && playerId && game.players.some((p) => p.id === playerId));
    const isMole = inRound && game!.moleId === playerId;
    const isDefender = inRound && !isMole;
    const playing = game?.phase === "PLAYING" || game?.phase === "BRIEFING";

    return {
      roomCode: this.code,
      phase: this.phase,
      players: [...this.players.values()].map((p) => ({ id: p.id, name: p.name, connected: !!p.socket })),
      settings: this.settings,
      game: game?.publicView() ?? null,
      youId: playerId,
      role: inRound ? (isMole ? "MOLE" : "DEFENDER") : null,
      mole: isMole && playing ? game!.moleView() : null,
      defender: isDefender && playing ? game!.defenderView(playerId!) : null,
    };
  }

  broadcast(): void {
    for (const p of this.players.values()) {
      if (p.socket) send(p.socket, { type: "STATE", view: this.viewFor(p.id) });
    }
    if (this.displays.size) {
      const msg: ServerMessage = { type: "STATE", view: this.viewFor(null) };
      for (const ws of this.displays) send(ws, msg);
    }
  }
}
