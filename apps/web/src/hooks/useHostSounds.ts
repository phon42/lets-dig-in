import { useEffect, useRef } from "react";
import { currentRound } from "../machines/gameMachine";
import { playSound } from "../lib/sound";
import type { GameSnapshot } from "../lib/view";

const COUNTDOWN_PHASES = ["writing", "voting"];
const COUNTDOWN_SECONDS = 5;

function submissions(state: GameSnapshot, phase: string): number {
  const round = currentRound(state.context);
  if (!round) return 0;
  if (phase === "writing") return Object.keys(round.fakes).length;
  if (phase === "voting") return Object.keys(round.votes).length;
  return 0;
}

/** The TV carries the soundtrack: joins, submissions, phase changes, reveal stings */
export function useHostSounds(state: GameSnapshot | null) {
  const prevRef = useRef<GameSnapshot | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state;
    if (!state || !prev || state === prev) return;

    const phase = String(state.value);
    const prevPhase = String(prev.value);
    const { players, timer } = state.context;

    const changes = Object.values(players).map((p) => ({
      now: p.isConnected,
      before: prev.context.players[p.id]?.isConnected ?? false,
    }));
    if (changes.some((p) => p.now && !p.before)) playSound("join");
    else if (changes.some((p) => !p.now && p.before)) playSound("leave");

    const count = submissions(state, prevPhase);
    if (count > submissions(prev, prevPhase)) playSound("submit", count - 1);

    if (phase !== prevPhase) {
      if (phase === "tutorial") playSound("start");
      else if (phase === "writing") playSound("sizzle");
      else if (phase === "leaderboard") playSound("fanfare");
      else if (phase !== "reveal") playSound("whoosh");
    }

    // Reveal slides
    if (phase === "reveal" && (phase !== prevPhase || state.context.revealStep !== prev.context.revealStep)) {
      const round = currentRound(state.context);
      const id = round?.revealOrder[state.context.revealStep];
      const entry = round?.entries.find((e) => e.id === id);
      if (!round || !entry) playSound("coin");
      else if (entry.kind === "real") playSound("truth");
      else if (Object.values(round.votes).includes(entry.id)) playSound("splash");
      else playSound("whoosh");
      return;
    }

    if (timer !== null && timer !== prev.context.timer && COUNTDOWN_PHASES.includes(phase)) {
      if (timer === 0) playSound("timeUp");
      else if (timer <= COUNTDOWN_SECONDS) playSound("tick", timer <= 3 ? 1 : 0);
    }
  }, [state]);
}
