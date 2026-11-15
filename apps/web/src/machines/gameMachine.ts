import { setup, assign, and } from "xstate";
import {
  FINAL_ROUND_MULTIPLIER,
  LINK_TOKEN,
  MAX_FAKE_LENGTH,
  MIN_PLAYERS,
  POINTS_FOR_SPOTTING,
  POINTS_PER_HOOK,
  type Entry,
  type Player,
  type RoomConfig,
  type Round,
} from "@phish/shared";
import { SCENARIOS, TIPS, getScenario } from "../data/scenarios";
import { dealLures, dealTips, makeLure, randomId, shuffle } from "../lib/lures";
import { findTells } from "../lib/tells";
import { normalizeFake } from "../lib/text";

export type GameLength = "snack" | "feast";
export const DEFAULT_GAME_LENGTH: GameLength = "snack";
export const GAME_LENGTH_ROUNDS: Record<GameLength, number> = { snack: 3, feast: 5 };

const TUTORIAL_SECONDS = 40;
/** House fakes pad the lineup when fewer than this many players wrote one */
const MIN_PLAYER_FAKES = 3;

// Reveal pacing, in seconds
const REVEAL_UNVOTED_FAKE = 6;
const REVEAL_VOTED_FAKE = 9;
const REVEAL_REAL = 10;
const REVEAL_SCORES = 12;

export interface GameContext {
  roomCode: string;
  players: Record<string, Player>;
  config: RoomConfig;
  timer: number | null;
  scenarioQueue: string[];
  currentRoundIndex: number;
  rounds: Round[];
  /** Index into the current round's revealOrder; === revealOrder.length is the scores slide */
  revealStep: number;
}

type GameEvent =
  | { type: "START_GAME"; senderId?: string }
  | { type: "PLAYER_CONNECTED"; playerId: string; playerName: string }
  | { type: "PLAYER_DISCONNECTED"; playerId: string }
  | { type: "HOST_CONNECTED" }
  | { type: "SUBMIT_FAKE"; senderId: string; text: string; lureId: string }
  | { type: "SUBMIT_VOTE"; senderId: string; entryId: string }
  | { type: "TIMER_TICK" }
  | { type: "TIMER_END" }
  | { type: "NEXT_PHASE"; senderId?: string }
  | { type: "PLAY_AGAIN"; senderId?: string };

const connected = (players: Record<string, Player>) =>
  Object.values(players).filter((p) => p.isConnected);

export const currentRound = (context: GameContext): Round | undefined =>
  context.rounds[context.currentRoundIndex];

function updateCurrentRound(context: GameContext, update: (round: Round) => Round): Round[] {
  return context.rounds.map((r, i) => (i === context.currentRoundIndex ? update(r) : r));
}

/** How long the given reveal slide stays up */
export function revealSlideSeconds(round: Round, step: number): number {
  if (step >= round.revealOrder.length) return REVEAL_SCORES;
  const entry = round.entries.find((e) => e.id === round.revealOrder[step]);
  if (!entry || entry.kind === "real") return REVEAL_REAL;
  const votes = Object.values(round.votes).filter((id) => id === entry.id).length;
  return votes > 0 ? REVEAL_VOTED_FAKE : REVEAL_UNVOTED_FAKE;
}

function pickAvatar(players: Record<string, Player>): number {
  const taken = new Set(Object.values(players).map((p) => p.avatarId));
  const free = [...Array(10).keys()].filter((i) => !taken.has(i));
  const pool = free.length ? free : [...Array(10).keys()];
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildRound(context: GameContext, index: number): Round {
  const scenarioId = context.scenarioQueue[index % context.scenarioQueue.length];
  const scenario = getScenario(scenarioId)!;
  const ids = Object.keys(context.players);
  return {
    scenarioId,
    multiplier: index === context.config.rounds - 1 ? FINAL_ROUND_MULTIPLIER : 1,
    lureOptions: dealLures(scenario, ids),
    tips: dealTips(TIPS, ids),
    fakes: {},
    entries: [],
    votes: {},
    points: {},
    revealOrder: [],
  };
}

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
    input: {} as { gameLength?: GameLength; roomCode?: string },
  },
  actions: {
    addPlayer: assign({
      players: ({ context, event }) => {
        if (event.type !== "PLAYER_CONNECTED") return context.players;
        const existing = context.players[event.playerId];
        if (existing) {
          return { ...context.players, [event.playerId]: { ...existing, isConnected: true } };
        }
        const hasVip = connected(context.players).some((p) => p.isVip);
        const player: Player = {
          id: event.playerId,
          name: event.playerName,
          score: 0,
          isVip: !hasVip,
          isConnected: true,
          avatarId: pickAvatar(context.players),
          stats: { hooks: 0, spots: 0, gotHooked: 0 },
        };
        return { ...context.players, [event.playerId]: player };
      },
    }),

    disconnectPlayer: assign({
      players: ({ context, event }) => {
        if (event.type !== "PLAYER_DISCONNECTED") return context.players;
        const player = context.players[event.playerId];
        if (!player) return context.players;
        const players = { ...context.players, [event.playerId]: { ...player, isConnected: false } };
        // Hand the VIP chef's hat to someone still here
        if (player.isVip) {
          const heir = connected(players)[0];
          if (heir) {
            players[event.playerId] = { ...players[event.playerId], isVip: false };
            players[heir.id] = { ...heir, isVip: true };
          }
        }
        return players;
      },
    }),

    /** Late joiners mid-writing still get a hand of lures */
    dealLateJoiner: assign({
      rounds: ({ context, event }) => {
        if (event.type !== "PLAYER_CONNECTED") return context.rounds;
        return updateCurrentRound(context, (round) => {
          if (round.lureOptions[event.playerId]) return round;
          const scenario = getScenario(round.scenarioId)!;
          const used = new Set(Object.values(round.lureOptions).flat().map((l) => l.url));
          return {
            ...round,
            lureOptions: {
              ...round.lureOptions,
              [event.playerId]: (["mild", "medium", "hot"] as const).map((s) =>
                makeLure(scenario, s, used),
              ),
            },
            tips: { ...round.tips, ...dealTips(TIPS, [event.playerId]) },
          };
        });
      },
    }),

    prepareGame: assign({
      scenarioQueue: () => shuffle(SCENARIOS.map((s) => s.id)),
      rounds: () => [],
      currentRoundIndex: () => -1,
      revealStep: () => 0,
    }),

    resetScores: assign({
      players: ({ context }) =>
        Object.fromEntries(
          Object.entries(context.players).map(([id, p]) => [
            id,
            { ...p, score: 0, stats: { hooks: 0, spots: 0, gotHooked: 0 } },
          ]),
        ),
    }),

    startRound: assign(({ context }) => {
      const index = context.currentRoundIndex + 1;
      return {
        currentRoundIndex: index,
        rounds: [...context.rounds.slice(0, index), buildRound(context, index)],
        revealStep: 0,
        timer: context.config.writeSeconds,
      };
    }),

    submitFake: assign({
      rounds: ({ context, event }) => {
        if (event.type !== "SUBMIT_FAKE") return context.rounds;
        return updateCurrentRound(context, (round) => ({
          ...round,
          fakes: {
            ...round.fakes,
            [event.senderId]: { text: normalizeFake(event.text), lureId: event.lureId },
          },
        }));
      },
    }),

    buildEntries: assign({
      rounds: ({ context }) =>
        updateCurrentRound(context, (round) => {
          const scenario = getScenario(round.scenarioId)!;
          const entries: Entry[] = Object.entries(round.fakes).map(([authorId, fake]) => {
            const lure =
              round.lureOptions[authorId]?.find((l) => l.id === fake.lureId) ??
              round.lureOptions[authorId]?.[1];
            return {
              id: randomId(8),
              kind: "player",
              authorId,
              text: fake.text,
              url: lure?.url ?? "",
              lure,
              tells: findTells(fake.text, lure, scenario),
            };
          });

          if (entries.length < MIN_PLAYER_FAKES) {
            const used = new Set(entries.map((e) => e.url));
            const lure = makeLure(scenario, "medium", used);
            entries.push({
              id: randomId(8),
              kind: "house",
              text: scenario.house,
              url: lure.url,
              lure,
              tells: findTells(scenario.house, lure, scenario),
            });
          }

          entries.push({
            id: randomId(8),
            kind: "real",
            text: scenario.real.text,
            url: scenario.real.url,
            tells: [],
          });

          return { ...round, entries: shuffle(entries) };
        }),
      timer: ({ context }) => context.config.voteSeconds,
    }),

    submitVote: assign({
      rounds: ({ context, event }) => {
        if (event.type !== "SUBMIT_VOTE") return context.rounds;
        return updateCurrentRound(context, (round) => ({
          ...round,
          votes: { ...round.votes, [event.senderId]: event.entryId },
        }));
      },
    }),

    scoreRound: assign(({ context }) => {
      const round = currentRound(context);
      if (!round) return {};
      const players = structuredClone(context.players);
      const points: Record<string, number> = {};
      const award = (id: string, amount: number) => {
        if (!players[id]) return;
        players[id].score += amount;
        points[id] = (points[id] ?? 0) + amount;
      };

      for (const [voterId, entryId] of Object.entries(round.votes)) {
        const entry = round.entries.find((e) => e.id === entryId);
        const voter = players[voterId];
        if (!entry || !voter) continue;
        if (entry.kind === "real") {
          award(voterId, POINTS_FOR_SPOTTING * round.multiplier);
          voter.stats.spots++;
        } else {
          voter.stats.gotHooked++;
          if (entry.kind === "player" && entry.authorId && entry.lure) {
            award(entry.authorId, POINTS_PER_HOOK[entry.lure.spice] * round.multiplier);
            if (players[entry.authorId]) players[entry.authorId].stats.hooks++;
          }
        }
      }

      // Reveal fakes from least to most convincing, then the real one
      const voteCount = (id: string) => Object.values(round.votes).filter((v) => v === id).length;
      const fakes = round.entries
        .filter((e) => e.kind !== "real")
        .sort((a, b) => voteCount(a.id) - voteCount(b.id));
      const real = round.entries.find((e) => e.kind === "real")!;
      const revealOrder = [...fakes.map((e) => e.id), real.id];

      const scored = { ...round, points, revealOrder };
      return {
        players,
        rounds: context.rounds.map((r, i) => (i === context.currentRoundIndex ? scored : r)),
        revealStep: 0,
        timer: revealSlideSeconds(scored, 0),
      };
    }),

    nextRevealStep: assign(({ context }) => {
      const round = currentRound(context)!;
      const step = context.revealStep + 1;
      return { revealStep: step, timer: revealSlideSeconds(round, step) };
    }),

    setTutorialTimer: assign({ timer: () => TUTORIAL_SECONDS }),
    tickTimer: assign({
      timer: ({ context }) => (context.timer !== null ? Math.max(0, context.timer - 1) : null),
    }),
    clearTimer: assign({ timer: () => null }),
  },
  guards: {
    enoughPlayers: ({ context }) => connected(context.players).length >= MIN_PLAYERS,

    senderIsVip: ({ context, event }) => {
      // Events the host raises itself (TV buttons) have no sender
      if (!("senderId" in event) || !event.senderId) return true;
      return context.players[event.senderId]?.isVip ?? false;
    },

    validFake: ({ context, event }) => {
      if (event.type !== "SUBMIT_FAKE") return false;
      const round = currentRound(context);
      if (!round || !context.players[event.senderId]) return false;
      const text = normalizeFake(event.text ?? "");
      return (
        text.includes(LINK_TOKEN) &&
        text.length <= MAX_FAKE_LENGTH + LINK_TOKEN.length &&
        !!round.lureOptions[event.senderId]?.some((l) => l.id === event.lureId)
      );
    },

    validVote: ({ context, event }) => {
      if (event.type !== "SUBMIT_VOTE") return false;
      const round = currentRound(context);
      const entry = round?.entries.find((e) => e.id === event.entryId);
      return !!entry && entry.authorId !== event.senderId && !!context.players[event.senderId];
    },

    allFakesIn: ({ context }) => {
      const round = currentRound(context);
      const here = connected(context.players);
      return !!round && here.length > 0 && here.every((p) => round.fakes[p.id]);
    },

    allVotesIn: ({ context }) => {
      const round = currentRound(context);
      const here = connected(context.players);
      return !!round && here.length > 0 && here.every((p) => round.votes[p.id]);
    },

    moreRevealSteps: ({ context }) => {
      const round = currentRound(context);
      return !!round && context.revealStep < round.revealOrder.length;
    },

    moreRounds: ({ context }) => context.currentRoundIndex < context.config.rounds - 1,
  },
}).createMachine({
  id: "game",
  initial: "lobby",
  context: ({ input }) => ({
    roomCode: input.roomCode ?? "",
    players: {},
    config: {
      rounds: GAME_LENGTH_ROUNDS[input.gameLength ?? DEFAULT_GAME_LENGTH],
      writeSeconds: 200,
      voteSeconds: 40,
    },
    timer: null,
    scenarioQueue: [],
    currentRoundIndex: -1,
    rounds: [],
    revealStep: 0,
  }),
  on: {
    PLAYER_CONNECTED: { actions: "addPlayer" },
    PLAYER_DISCONNECTED: { actions: "disconnectPlayer" },
    TIMER_TICK: { actions: "tickTimer" },
  },
  states: {
    lobby: {
      on: {
        START_GAME: {
          target: "tutorial",
          guard: and(["senderIsVip", "enoughPlayers"]),
          actions: "prepareGame",
        },
      },
    },

    tutorial: {
      entry: "setTutorialTimer",
      on: {
        NEXT_PHASE: { target: "writing", guard: "senderIsVip" },
        TIMER_END: "writing",
      },
    },

    writing: {
      entry: "startRound",
      on: {
        PLAYER_CONNECTED: { actions: ["addPlayer", "dealLateJoiner"] },
        SUBMIT_FAKE: { guard: "validFake", actions: "submitFake" },
        TIMER_END: { target: "voting", actions: "buildEntries" },
        NEXT_PHASE: { target: "voting", guard: "senderIsVip", actions: "buildEntries" },
      },
      always: { target: "voting", guard: "allFakesIn", actions: "buildEntries" },
    },

    voting: {
      on: {
        SUBMIT_VOTE: { guard: "validVote", actions: "submitVote" },
        TIMER_END: "reveal",
        NEXT_PHASE: { target: "reveal", guard: "senderIsVip" },
      },
      always: { target: "reveal", guard: "allVotesIn" },
    },

    reveal: {
      entry: "scoreRound",
      on: {
        TIMER_END: [
          { guard: "moreRevealSteps", actions: "nextRevealStep" },
          { guard: "moreRounds", target: "writing" },
          { target: "leaderboard" },
        ],
        NEXT_PHASE: [
          { guard: and(["senderIsVip", "moreRevealSteps"]), actions: "nextRevealStep" },
          { guard: and(["senderIsVip", "moreRounds"]), target: "writing" },
          { guard: "senderIsVip", target: "leaderboard" },
        ],
      },
    },

    leaderboard: {
      entry: "clearTimer",
      on: {
        PLAY_AGAIN: {
          target: "tutorial",
          guard: and(["senderIsVip", "enoughPlayers"]),
          actions: ["resetScores", "prepareGame"],
        },
      },
    },
  },
});
