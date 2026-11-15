import { useEffect, useRef } from "react";

/**
 * Ticks once a second while `timer` is not null, and calls onEnd each second
 * it sits at 0. Callbacks are read from a ref so re-renders (every incoming
 * message) don't reset the interval and slow the clock down.
 */
export function useTimer(timer: number | null, onTick: () => void, onEnd: () => void): void {
  const ref = useRef({ timer, onTick, onEnd });
  ref.current = { timer, onTick, onEnd };
  const active = timer !== null;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const { timer, onTick, onEnd } = ref.current;
      if (timer === null) return;
      if (timer <= 0) onEnd();
      else onTick();
    }, 1000);
    return () => clearInterval(id);
  }, [active]);
}
