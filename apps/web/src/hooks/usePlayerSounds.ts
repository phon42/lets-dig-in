import { useEffect, useRef } from "react";
import type { GamePhase, PlayerViewState } from "@phish/shared";
import { getSoundStatus, playSound } from "../lib/sound";

const ACTION_PHASES: GamePhase[] = ["WRITING", "VOTING"];

/** Phones only chime when it's your move, and when you score */
export function usePlayerSounds(view: PlayerViewState | null) {
  const prevRef = useRef<PlayerViewState | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = view;
    if (!view || !prev) return;

    if (view.phase !== prev.phase && ACTION_PHASES.includes(view.phase)) {
      playSound("ding");
      if (getSoundStatus() === "on") navigator.vibrate?.(60);
    }

    if (view.phase === "REVEAL" && prev.phase !== "REVEAL" && view.result) {
      if (view.result.vote?.kind === "real") playSound("coin");
      else if (view.result.vote) playSound("splash");
    }
  }, [view]);
}
