import { useMemo } from "react";

const PIECES = ["🍟", "🐟", "🍋", "🟡", "🍟", "✨"];

export default function Confetti({ count = 36 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: PIECES[i % PIECES.length],
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 5 + Math.random() * 5,
        size: 1.2 + Math.random() * 1.6,
      })),
    [count],
  );
  return (
    <div aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, fontSize: `${p.size}rem` }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
