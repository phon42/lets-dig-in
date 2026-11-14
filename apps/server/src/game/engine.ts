import {
  GAME,
  INTERNET,
  LOG_SOURCES,
  NOISE_RATES,
  TOOL_FOR_SOURCE,
  USERS,
  type Announcement,
  type AnnouncementKind,
  type DefenderTool,
  type DefenderView,
  type LogEntry,
  type LogSource,
  type MoleActionKind,
  type MoleView,
  type NetworkMap,
  type Outcome,
  type PublicGameView,
  type Replay,
  type Settings,
  type SpikeView,
} from "@burrower/shared";
import { SCAN_PORTS, fileFor, legitFileAction, portFor } from "./content";
import { generateNetwork, neighborsOf } from "./network";
import { pick, poisson, randInt, shuffle, type Rng } from "./rng";

export type GamePhase = "BRIEFING" | "PLAYING" | "GAME_OVER";

export interface GamePlayer {
  id: string;
  name: string;
}

export interface GameOptions {
  players: GamePlayer[];
  moleId: string;
  settings: Settings;
  round: number;
  rng?: Rng;
  map?: NetworkMap;
}

type TraceFields = Omit<LogEntry, "id" | "at">;

interface PendingTrace {
  deliverAt: number;
  /** Mole action id, so cancelling an action also cancels its future traces */
  tag?: number;
  fields: TraceFields;
}

interface MoleAction {
  id: number;
  kind: MoleActionKind;
  target: string;
  startedAt: number;
  duration: number;
}

interface ActiveWhack {
  machine: string;
  hit: boolean;
  startedAt: number;
  announced: boolean;
}

/** Result of a player action: null on success, otherwise a message for that player */
export type ActionResult = string | null;

/**
 * The whole game, server-side and authoritative. It is pure (no sockets, no
 * timers): the room calls tick() on an interval and reads views back out.
 */
export class Game {
  phase: GamePhase = "BRIEFING";
  outcome: Outcome | null = null;

  readonly map: NetworkMap;
  readonly moleId: string;
  readonly round: number;
  readonly settings: Settings;
  readonly players: GamePlayer[];
  readonly defenderIds: string[];
  readonly sources: Record<string, LogSource[]>;

  private readonly rng: Rng;
  private readonly users: string[];
  private readonly entry: string;
  private readonly roundMs: number;

  private briefingLeft: number = GAME.briefingMs;
  private ready = new Set<string>();
  private elapsed = 0;

  private log: LogEntry[] = [];
  private pending: PendingTrace[] = [];
  private nextLogId = 1;
  private announcements: Announcement[] = [];
  private nextAnnouncementId = 1;

  private offlineUntil = new Map<string, number>();
  private firewallUntil = new Map<string, number>();
  private looted = new Set<string>();

  // Defenders
  private whackVotes = new Map<string, string>();
  private whacksLeft: number = GAME.startingWhacks;
  private catches = 0;
  private whack: ActiveWhack | null = null;
  private pendingOutcome: Outcome | null = null;
  private toolReadyAt = new Map<string, number>();
  private digIn = new Map<string, { machine: string; until: number }>();
  private digInReadyAt = new Map<string, number>();
  private baits: string[] = [];
  private revealed: { machine: string; until: number } | null = null;

  // Mole
  private position: string;
  private trail: string[];
  private action: MoleAction | null = null;
  private nextActionId = 1;
  private decoyReadyAt = 0;
  private moleNotice: { text: string; until: number } | null = null;

  // Traffic spikes
  private spikeAt: number;
  private spikeWarned = false;
  private spikeStarted = false;

  private replay: Replay = { path: [], whacks: [] };

  constructor(opts: GameOptions) {
    this.rng = opts.rng ?? Math.random;
    this.players = opts.players;
    this.moleId = opts.moleId;
    this.round = opts.round;
    this.settings = opts.settings;
    this.roundMs = opts.settings.roundSeconds * 1000;
    this.map = opts.map ?? generateNetwork(this.rng);
    this.entry = this.map.machines.find((m) => m.entry)!.id;
    this.position = this.entry;
    this.trail = [this.entry];
    this.users = shuffle(this.rng, USERS.map((u) => u.name)).slice(0, 8);
    this.spikeAt = randInt(this.rng, GAME.firstSpikeMinMs, GAME.firstSpikeMaxMs);
    this.replay.path.push({ at: 0, machine: this.entry, kind: "START" });

    this.defenderIds = opts.players.map((p) => p.id).filter((id) => id !== opts.moleId);
    this.sources = assignSources(this.defenderIds, shuffle(this.rng, LOG_SOURCES));
  }

  // ---------------------------------------------------------------- clock

  tick(dt: number): void {
    if (this.phase === "GAME_OVER") return;

    if (this.phase === "BRIEFING") {
      this.briefingLeft -= dt;
      const everyoneReady = this.players.every((p) => this.ready.has(p.id));
      if (this.briefingLeft <= 0 || everyoneReady) this.begin();
      return;
    }

    this.elapsed += dt;
    this.updateSpike();
    const lambda = this.noiseRate() * (dt / 1000);
    for (let i = poisson(this.rng, lambda); i > 0; i--) this.spawnSession();
    this.progressMole();
    this.resolveWhackVotes();
    this.updateWhack();
    this.deliverTraces();
    this.checkEnd();
  }

  markReady(playerId: string): void {
    if (this.phase === "BRIEFING") this.ready.add(playerId);
  }

  private begin(): void {
    this.phase = "PLAYING";
    // Warm the feeds so nobody stares at an empty screen
    for (let i = 0; i < 4; i++) this.spawnSession(-randInt(this.rng, 1000, 6000));
    this.deliverTraces();
  }

  private end(outcome: Outcome): void {
    this.phase = "GAME_OVER";
    this.outcome = outcome;
    this.action = null;
    this.pending = [];
  }

  private checkEnd(): void {
    if (this.phase !== "PLAYING") return;
    if (this.looted.size >= GAME.lootsToWin) {
      this.end({ winner: "MOLE", reason: `The mole looted ${GAME.lootsToWin} crown jewels.` });
    } else if (this.elapsed >= this.roundMs && !this.whack) {
      this.end({ winner: "DEFENDERS", reason: "Time's up. The network held." });
    }
  }

  // ---------------------------------------------------------------- traffic

  private noiseRate(): number {
    const base = NOISE_RATES[this.settings.noise];
    return this.spikeView()?.stage === "ACTIVE" ? base * GAME.spikeMultiplier : base;
  }

  private isUp(machine: string): boolean {
    return !this.isOffline(machine) && !this.isFirewalled(machine);
  }

  private isOffline(machine: string): boolean {
    return (this.offlineUntil.get(machine) ?? 0) > this.elapsed;
  }

  private isFirewalled(machine: string): boolean {
    return (this.firewallUntil.get(machine) ?? 0) > this.elapsed;
  }

  private schedule(delay: number, fields: TraceFields, tag?: number, base = this.elapsed): void {
    this.pending.push({ deliverAt: base + delay, fields, tag });
  }

  /**
   * One legitimate user session. It ALWAYS produces the full triple:
   * a connection (NETWORK), a login from that source (LOGIN), and a file
   * touched by that user (FILE), all on the same machine.
   */
  private spawnSession(base = this.elapsed): void {
    let from: string;
    let to: string;
    if (this.rng() < 0.15) {
      const edge = this.map.machines.filter((m) => m.layer === 0 && this.isUp(m.id));
      if (!edge.length) return;
      from = INTERNET;
      to = pick(this.rng, edge).id;
    } else {
      const usable = this.map.links.filter((l) => this.isUp(l.a) && this.isUp(l.b));
      if (!usable.length) return;
      const link = pick(this.rng, usable);
      [from, to] = this.rng() < 0.5 ? [link.a, link.b] : [link.b, link.a];
    }
    const user = pick(this.rng, this.users);
    const t0 = randInt(this.rng, 0, 400);
    this.schedule(t0, { source: "NETWORK", machine: to, from, port: portFor(to) }, undefined, base);
    this.schedule(t0 + randInt(this.rng, 300, 1200), { source: "LOGIN", machine: to, from, user }, undefined, base);
    this.schedule(
      t0 + randInt(this.rng, 1000, 2600),
      { source: "FILE", machine: to, user, action: legitFileAction(this.rng), file: fileFor(this.rng, to) },
      undefined,
      base,
    );
  }

  private deliverTraces(): void {
    const due: PendingTrace[] = [];
    this.pending = this.pending.filter((p) => {
      if (p.deliverAt <= this.elapsed) {
        due.push(p);
        return false;
      }
      return true;
    });
    due.sort((a, b) => a.deliverAt - b.deliverAt);
    for (const p of due) {
      // Offline machines produce no logs at all: a blind spot
      if (this.isOffline(p.fields.machine)) continue;
      this.log.push({ ...p.fields, id: this.nextLogId++, at: p.deliverAt });
    }
    if (this.log.length > 600) this.log = this.log.slice(-400);
  }

  // ---------------------------------------------------------------- spikes

  private spikeView(): SpikeView | null {
    const start = this.spikeAt;
    const end = start + GAME.spikeMs;
    if (this.elapsed >= start && this.elapsed < end) {
      return { stage: "ACTIVE", msLeft: end - this.elapsed };
    }
    if (this.elapsed >= start - GAME.spikeWarnMs && this.elapsed < start) {
      return { stage: "INCOMING", msLeft: start - this.elapsed };
    }
    return null;
  }

  private updateSpike(): void {
    const spike = this.spikeView();
    if (spike?.stage === "INCOMING" && !this.spikeWarned) {
      this.spikeWarned = true;
      this.announce("SPIKE_WARN", "Traffic spike incoming in 10s");
    }
    if (spike?.stage === "ACTIVE" && !this.spikeStarted) {
      this.spikeStarted = true;
      this.announce("SPIKE_START", "Traffic spike! Logs are flooding");
    }
    if (this.elapsed >= this.spikeAt + GAME.spikeMs) {
      this.spikeAt = this.elapsed + randInt(this.rng, GAME.spikeGapMinMs, GAME.spikeGapMaxMs);
      this.spikeWarned = false;
      this.spikeStarted = false;
    }
  }

  // ---------------------------------------------------------------- mole

  private requireMole(playerId: string): ActionResult {
    if (this.phase !== "PLAYING") return "The round isn't running";
    if (playerId !== this.moleId) return "Only the mole can do that";
    return null;
  }

  moleDig(playerId: string, target: string, mode: "QUIET" | "LOUD"): ActionResult {
    const err = this.requireMole(playerId);
    if (err) return err;
    if (this.action) return "Finish or cancel your current action first";
    if (!neighborsOf(this.map, this.position).includes(target)) return "You can only dig to an adjacent machine";
    if (this.isOffline(target)) return `${target} is offline`;
    if (this.isFirewalled(target)) return `${target} is firewalled`;
    if (this.isFirewalled(this.position)) return `${this.position} is firewalled, you can't dig out`;

    const kind: MoleActionKind = mode === "QUIET" ? "DIG_QUIET" : "DIG_LOUD";
    const duration = mode === "QUIET" ? GAME.quietDigMs : GAME.loudDigMs;
    const action = this.startAction(kind, target, duration);

    if (mode === "QUIET") {
      // One faint trace: a login with stolen creds, but no matching connection
      const at = Math.round(duration * (0.35 + this.rng() * 0.3));
      this.schedule(at, { source: "LOGIN", machine: target, from: this.position, user: pick(this.rng, this.users) }, action.id);
    } else {
      // A scan: connections from here to every neighbour on odd ports
      const scanned = neighborsOf(this.map, this.position).filter((n) => !this.isOffline(n));
      for (const n of shuffle(this.rng, scanned)) {
        this.schedule(
          randInt(this.rng, 0, 1500),
          { source: "NETWORK", machine: n, from: this.position, port: pick(this.rng, SCAN_PORTS) },
          action.id,
        );
      }
      this.schedule(
        randInt(this.rng, 1500, 2500),
        { source: "NETWORK", machine: target, from: this.position, port: portFor(target) },
        action.id,
      );
    }
    return null;
  }

  moleLoot(playerId: string): ActionResult {
    const err = this.requireMole(playerId);
    if (err) return err;
    if (this.action) return "Finish or cancel your current action first";
    const here = this.map.machines.find((m) => m.id === this.position)!;
    if (!here.jewel) return "Nothing worth stealing here";
    if (this.looted.has(here.id)) return "Already looted";

    const action = this.startAction("LOOT", here.id, GAME.lootMs);
    // File copies by a user who never logged in here
    const user = pick(this.rng, this.users);
    for (const frac of [0.15, 0.45, 0.75]) {
      this.schedule(
        Math.round(GAME.lootMs * frac),
        { source: "FILE", machine: here.id, user, action: "copy", file: fileFor(this.rng, here.id) },
        action.id,
      );
    }

    const baitIndex = this.baits.indexOf(here.id);
    if (baitIndex >= 0) {
      this.baits.splice(baitIndex, 1);
      this.revealed = { machine: here.id, until: this.elapsed + GAME.baitRevealMs };
      this.announce("BAIT", `Bait tripped! The mole is looting ${here.id}`, here.id);
    }
    return null;
  }

  moleDecoy(playerId: string, target: string): ActionResult {
    const err = this.requireMole(playerId);
    if (err) return err;
    if (!this.machineExists(target)) return "Unknown machine";
    if (this.isOffline(target)) return `${target} is offline`;
    if (this.decoyReadyAt > this.elapsed) return "Decoy is recharging";
    this.decoyReadyAt = this.elapsed + GAME.decoyCooldownMs;

    // A fake partial trace, so it looks like mole activity somewhere else
    const delay = randInt(this.rng, 800, 2500);
    const user = pick(this.rng, this.users);
    const neighbors = neighborsOf(this.map, target);
    const kind = this.rng();
    if (kind < 0.4) {
      this.schedule(delay, { source: "LOGIN", machine: target, from: pick(this.rng, neighbors), user });
    } else if (kind < 0.7) {
      this.schedule(delay, { source: "FILE", machine: target, user, action: "copy", file: fileFor(this.rng, target) });
    } else {
      for (const n of neighbors.slice(0, 3)) {
        this.schedule(delay + randInt(this.rng, 0, 1200), {
          source: "NETWORK",
          machine: n,
          from: target,
          port: pick(this.rng, SCAN_PORTS),
        });
      }
    }
    return null;
  }

  moleCancel(playerId: string): ActionResult {
    const err = this.requireMole(playerId);
    if (err) return err;
    this.cancelAction();
    return null;
  }

  private startAction(kind: MoleActionKind, target: string, duration: number): MoleAction {
    this.action = { id: this.nextActionId++, kind, target, startedAt: this.elapsed, duration };
    return this.action;
  }

  private cancelAction(): void {
    if (!this.action) return;
    const id = this.action.id;
    this.pending = this.pending.filter((p) => p.tag !== id);
    this.action = null;
  }

  private notifyMole(text: string): void {
    this.moleNotice = { text, until: this.elapsed + 4000 };
  }

  private progressMole(): void {
    const a = this.action;
    if (!a || this.elapsed < a.startedAt + a.duration) return;
    this.action = null;

    if (a.kind === "LOOT") {
      this.looted.add(a.target);
      this.replay.path.push({ at: this.elapsed, machine: a.target, kind: "LOOT" });
      this.announce("LOOT", `${a.target} was looted!`, a.target);
      return;
    }

    if (!this.isUp(a.target) || this.isFirewalled(this.position)) {
      this.notifyMole(`Dig into ${a.target} was blocked`);
      return;
    }
    this.position = a.target;
    this.trail.push(a.target);
    this.replay.path.push({ at: this.elapsed, machine: a.target, kind: a.kind });
  }

  // ---------------------------------------------------------------- defenders

  private requireDefender(playerId: string): ActionResult {
    if (this.phase !== "PLAYING") return "The round isn't running";
    if (!this.defenderIds.includes(playerId)) return "Only defenders can do that";
    return null;
  }

  private machineExists(id: string): boolean {
    return this.map.machines.some((m) => m.id === id);
  }

  private get whackVotesNeeded(): number {
    return Math.min(2, this.defenderIds.length);
  }

  voteWhack(playerId: string, target: string | null): ActionResult {
    const err = this.requireDefender(playerId);
    if (err) return err;
    if (target === null) {
      this.whackVotes.delete(playerId);
      return null;
    }
    if (!this.machineExists(target)) return "Unknown machine";
    if (this.whacksLeft <= 0) return "No whacks left";
    if (this.isOffline(target)) return `${target} is already offline`;
    this.whackVotes.set(playerId, target);
    return null;
  }

  private resolveWhackVotes(): void {
    if (this.whack || this.whacksLeft <= 0) return;
    const counts = new Map<string, number>();
    for (const m of this.whackVotes.values()) counts.set(m, (counts.get(m) ?? 0) + 1);
    for (const [machine, count] of counts) {
      if (count >= this.whackVotesNeeded) {
        for (const [pid, m] of this.whackVotes) if (m === machine) this.whackVotes.delete(pid);
        this.executeWhack(machine);
        return;
      }
    }
  }

  private executeWhack(machine: string): void {
    this.whacksLeft--;
    const hit = this.position === machine;
    this.whack = { machine, hit, startedAt: this.elapsed, announced: false };
    this.replay.whacks.push({ at: this.elapsed, machine, hit });

    if (hit) {
      this.catches++;
      this.cancelAction();
      this.replay.path.push({ at: this.elapsed, machine, kind: "CAUGHT" });
      this.position = this.entry;
      this.trail = [this.entry];
      this.replay.path.push({ at: this.elapsed, machine: this.entry, kind: "START" });
      this.notifyMole(`WHACKED on ${machine}! Back to ${this.entry}.`);
      if (this.catches >= GAME.catchesToWin) {
        this.pendingOutcome = { winner: "DEFENDERS", reason: `The mole was caught ${this.catches} times.` };
      }
    } else {
      this.offlineUntil.set(machine, this.elapsed + GAME.missOfflineMs);
    }
  }

  private updateWhack(): void {
    const w = this.whack;
    if (!w) return;
    const t = this.elapsed - w.startedAt;
    if (t >= GAME.whackSuspenseMs && !w.announced) {
      w.announced = true;
      if (w.hit) this.announce("WHACK_HIT", `MOLE! Caught on ${w.machine}`, w.machine);
      else this.announce("WHACK_MISS", `Clean. ${w.machine} is offline for 30s`, w.machine);
    }
    if (t >= GAME.whackSuspenseMs + GAME.whackResultMs) {
      this.whack = null;
      if (this.pendingOutcome) this.end(this.pendingOutcome);
    }
  }

  useTool(playerId: string, tool: DefenderTool, target: string): ActionResult {
    const err = this.requireDefender(playerId);
    if (err) return err;
    if (!this.machineExists(target)) return "Unknown machine";
    if (!this.toolsFor(playerId).includes(tool)) return "That isn't your tool";
    const key = `${playerId}:${tool}`;
    if ((this.toolReadyAt.get(key) ?? 0) > this.elapsed) return "Still recharging";
    const name = this.nameOf(playerId);

    if (tool === "RESET") {
      this.toolReadyAt.set(key, this.elapsed + GAME.resetCooldownMs);
      this.announce("RESET", `${name} reset passwords on ${target}`, target);
      if (this.position === target && this.trail.length > 1) {
        this.cancelAction();
        this.trail.pop();
        this.position = this.trail[this.trail.length - 1];
        this.replay.path.push({ at: this.elapsed, machine: this.position, kind: "KNOCKED_BACK" });
        this.notifyMole(`Passwords reset on ${target}! Knocked back to ${this.position}.`);
      }
    } else if (tool === "FIREWALL") {
      this.toolReadyAt.set(key, this.elapsed + GAME.firewallCooldownMs);
      this.firewallUntil.set(target, this.elapsed + GAME.firewallMs);
      this.announce("FIREWALL", `${name} firewalled ${target} for ${GAME.firewallMs / 1000}s`, target);
    } else {
      this.toolReadyAt.set(key, this.elapsed + GAME.baitCooldownMs);
      this.baits = [...this.baits.filter((b) => b !== target), target].slice(-GAME.maxBaits);
    }
    return null;
  }

  startDigIn(playerId: string, target: string): ActionResult {
    const err = this.requireDefender(playerId);
    if (err) return err;
    if (!this.machineExists(target)) return "Unknown machine";
    if ((this.digInReadyAt.get(playerId) ?? 0) > this.elapsed) return "Dig in is recharging";
    this.digIn.set(playerId, { machine: target, until: this.elapsed + GAME.digInMs });
    this.digInReadyAt.set(playerId, this.elapsed + GAME.digInMs + GAME.digInCooldownMs);
    return null;
  }

  private toolsFor(playerId: string): DefenderTool[] {
    return (this.sources[playerId] ?? []).map((s) => TOOL_FOR_SOURCE[s]);
  }

  // ---------------------------------------------------------------- views

  private nameOf(playerId: string): string {
    return this.players.find((p) => p.id === playerId)?.name ?? "Someone";
  }

  private announce(kind: AnnouncementKind, text: string, machine?: string): void {
    this.announcements.push({ id: this.nextAnnouncementId++, at: this.elapsed, kind, text, machine });
    if (this.announcements.length > 8) this.announcements.shift();
  }

  publicView(): PublicGameView {
    const votes = new Map<string, number>();
    for (const m of this.whackVotes.values()) votes.set(m, (votes.get(m) ?? 0) + 1);
    const w = this.whack;
    const showResult = w && this.elapsed - w.startedAt >= GAME.whackSuspenseMs;

    return {
      round: this.round,
      moleId: this.moleId,
      map: this.map,
      machines: this.map.machines.map((m) => ({
        id: m.id,
        offlineMs: Math.max(0, (this.offlineUntil.get(m.id) ?? 0) - this.elapsed),
        firewallMs: Math.max(0, (this.firewallUntil.get(m.id) ?? 0) - this.elapsed),
        looted: this.looted.has(m.id),
        whackVotes: votes.get(m.id) ?? 0,
      })),
      roundMs: this.roundMs,
      elapsedMs: this.elapsed,
      timeLeftMs: Math.max(0, this.roundMs - this.elapsed),
      whacksLeft: this.whacksLeft,
      catches: this.catches,
      catchesToWin: GAME.catchesToWin,
      loots: this.looted.size,
      lootsToWin: GAME.lootsToWin,
      spike: this.phase === "PLAYING" ? this.spikeView() : null,
      whack: w ? { machine: w.machine, stage: showResult ? "RESULT" : "DROPPING", hit: showResult ? w.hit : undefined } : null,
      revealedMole:
        this.revealed && this.revealed.until > this.elapsed
          ? { machine: this.revealed.machine, msLeft: this.revealed.until - this.elapsed }
          : null,
      announcements: this.announcements,
      briefingMsLeft: Math.max(0, this.briefingLeft),
      readyIds: [...this.ready],
      defenderSources: this.sources,
      outcome: this.outcome,
      replay: this.phase === "GAME_OVER" ? this.replay : null,
    };
  }

  moleView(): MoleView {
    const a = this.action;
    const here = this.map.machines.find((m) => m.id === this.position)!;
    return {
      position: this.position,
      neighbors: neighborsOf(this.map, this.position),
      action: a
        ? {
            kind: a.kind,
            target: a.target,
            progress: Math.min(1, (this.elapsed - a.startedAt) / a.duration),
            msLeft: Math.max(0, a.startedAt + a.duration - this.elapsed),
          }
        : null,
      decoyCooldownMs: Math.max(0, this.decoyReadyAt - this.elapsed),
      canLoot: here.jewel && !this.looted.has(here.id),
      notice: this.moleNotice && this.moleNotice.until > this.elapsed ? this.moleNotice.text : null,
    };
  }

  defenderView(playerId: string): DefenderView {
    const sources = this.sources[playerId] ?? [];
    const dig = this.digIn.get(playerId);
    const digging = dig && dig.until > this.elapsed ? dig : null;

    // Digging in: every source, but only for one machine. Your own feed goes blind.
    const entries = digging
      ? this.log.filter((e) => e.machine === digging.machine || e.from === digging.machine)
      : this.log.filter((e) => sources.includes(e.source));

    return {
      sources,
      tools: this.toolsFor(playerId).map((tool) => ({
        tool,
        cooldownMs: Math.max(0, (this.toolReadyAt.get(`${playerId}:${tool}`) ?? 0) - this.elapsed),
      })),
      feed: entries.slice(-GAME.feedLength).reverse(),
      digIn: digging ? { machine: digging.machine, msLeft: digging.until - this.elapsed } : null,
      digInCooldownMs: Math.max(0, (this.digInReadyAt.get(playerId) ?? 0) - this.elapsed),
      whackVote: this.whackVotes.get(playerId) ?? null,
      whackVotesNeeded: this.whackVotesNeeded,
      baits: this.baits,
    };
  }
}

/**
 * Spread the three log sources over the defenders. With 3 defenders everyone
 * gets one; with fewer, some double up; with more, sources are shared.
 */
export function assignSources(defenderIds: string[], order: readonly LogSource[]): Record<string, LogSource[]> {
  const out: Record<string, LogSource[]> = Object.fromEntries(defenderIds.map((id) => [id, []]));
  if (!defenderIds.length) return out;
  const n = Math.max(defenderIds.length, order.length);
  for (let i = 0; i < n; i++) {
    const id = defenderIds[i % defenderIds.length];
    const source = order[i % order.length];
    if (!out[id].includes(source)) out[id].push(source);
  }
  return out;
}
