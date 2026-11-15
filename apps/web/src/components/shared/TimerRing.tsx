interface TimerRingProps {
  seconds: number | null;
  total?: number;
  size?: "sm" | "lg";
}

export default function TimerRing({ seconds, total, size = "lg" }: TimerRingProps) {
  if (seconds === null) return null;
  const urgent = seconds <= 5;
  const fraction = total ? Math.max(0, Math.min(1, seconds / total)) : 1;
  const r = 20;
  const c = 2 * Math.PI * r;
  const dims = size === "lg" ? "size-16" : "size-11";
  return (
    <div className={`relative ${dims} shrink-0 ${urgent ? "animate-urgent" : ""}`} role="timer" aria-label={`${seconds} seconds left`}>
      <svg viewBox="0 0 48 48" className="size-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="6" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={urgent ? "var(--color-ketchup)" : "var(--color-mustard)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-display ${size === "lg" ? "text-2xl" : "text-lg"} ${urgent ? "text-ketchup" : "text-ink"}`}>
        {seconds}
      </span>
    </div>
  );
}
