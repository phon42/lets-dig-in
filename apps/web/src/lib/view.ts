import type { SnapshotFrom } from "xstate";
import type { GamePhase, PlayerRoundResult, PlayerViewState, PublicScenario } from "@phish/shared";
import { currentRound, type gameMachine } from "../machines/gameMachine";
import { getScenario } from "../data/scenarios";
import { computeAwards } from "./awards";

export type GameSnapshot = SnapshotFrom<typeof gameMachine>;

const PHASES: Record<string, GamePhase> = {
  lobby: "LOBBY",
  tutorial: "TUTORIAL",
  writing: "WRITING",
  voting: "VOTING",
  reveal: "REVEAL",
  leaderboard: "LEADERBOARD",
};

export const phaseOf = (state: GameSnapshot): GamePhase => PHASES[String(state.value)] ?? "LOBBY";

export function publicScenario(id: string): PublicScenario | undefined {
  const scenario = getScenario(id);
  if (!scenario) return undefined;
  const { id: sid, emoji, channel, brand, domain, sender, subject, prompt } = scenario;
  return { id: sid, emoji, channel, brand, domain, sender, subject, prompt };
}

export function getRoundProgress(state: GameSnapshot) {
  const phase = phaseOf(state);
  const round = currentRound(state.context);
  if (!round || !["WRITING", "VOTING", "REVEAL"].includes(phase)) return undefined;
  return {
    current: state.context.currentRoundIndex + 1,
    total: state.context.config.rounds,
    multiplier: round.multiplier,
  };
}

/** Project the host's full state down to what one phone is allowed to know */
export function toPlayerView(state: GameSnapshot, playerId: string): PlayerViewState {
  const { context } = state;
  const phase = phaseOf(state);
  const round = currentRound(context);
  const view: PlayerViewState = {
    roomCode: context.roomCode,
    phase,
    playerId,
    players: context.players,
    timer: context.timer,
    roundProgress: getRoundProgress(state),
  };

  if (!round || !["WRITING", "VOTING", "REVEAL"].includes(phase)) {
    if (phase === "LEADERBOARD") view.awards = computeAwards(context.players);
    return view;
  }

  view.scenario = publicScenario(round.scenarioId);

  if (phase === "WRITING") {
    view.lureOptions = round.lureOptions[playerId];
    view.tips = round.tips[playerId];
    view.mySubmission = round.fakes[playerId];
    view.submittedCount = Object.keys(round.fakes).length;
    return view;
  }

  if (phase === "VOTING") {
    view.options = round.entries
      .map(({ id, text, url, authorId }, i) => ({ id, text, url, authorId, number: i + 1 }))
      .filter((e) => e.authorId !== playerId)
      .map(({ id, text, url, number }) => ({ id, text, url, number }));
    view.myVoteId = round.votes[playerId];
    const mineIndex = round.entries.findIndex((e) => e.authorId === playerId);
    if (mineIndex >= 0) view.myEntryNumber = mineIndex + 1;
    return view;
  }

  // REVEAL
  const voteId = round.votes[playerId];
  const voted = round.entries.find((e) => e.id === voteId);
  const mine = round.entries.find((e) => e.authorId === playerId);
  const result: PlayerRoundResult = {
    points: round.points[playerId] ?? 0,
    vote: !voted
      ? null
      : voted.kind === "player"
        ? { kind: "player", authorName: context.players[voted.authorId!]?.name ?? "someone" }
        : { kind: voted.kind },
    hookedNames: mine
      ? Object.entries(round.votes)
          .filter(([, id]) => id === mine.id)
          .map(([voter]) => context.players[voter]?.name ?? "someone")
      : [],
    wrote: !!mine,
  };
  view.result = result;
  view.revealDone = context.revealStep >= round.revealOrder.length;
  return view;
}
