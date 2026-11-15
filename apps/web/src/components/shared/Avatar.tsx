import { useState } from "react";

export const AVATARS = [
  { name: "Chip", emoji: "🍟", bg: "#F2B705" },
  { name: "Cod", emoji: "🐟", bg: "#4EA8DE" },
  { name: "Pea", emoji: "🟢", bg: "#6BAA3A" },
  { name: "Lemon", emoji: "🍋", bg: "#FFE066" },
  { name: "Vinegar", emoji: "🍶", bg: "#C08552" },
  { name: "Ketchup", emoji: "🍅", bg: "#E23D28" },
  { name: "Tartare", emoji: "🥣", bg: "#E9E4D0" },
  { name: "Onion Ring", emoji: "🧅", bg: "#E8A33D" },
  { name: "Pickle", emoji: "🥒", bg: "#9BC53D" },
  { name: "Sausage", emoji: "🌭", bg: "#D9734E" },
];

interface AvatarProps {
  avatarId: number;
  size?: string; // Tailwind size classes, e.g. "size-12"
  className?: string;
  dim?: boolean;
}

export default function Avatar({ avatarId, size = "size-12", className = "", dim }: AvatarProps) {
  const avatar = AVATARS[avatarId % AVATARS.length];
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`${size} shrink-0 rounded-full border-[3px] border-ink overflow-hidden flex items-center justify-center ${dim ? "grayscale opacity-50" : ""} ${className}`}
      style={{ background: avatar.bg }}
      title={avatar.name}
    >
      {failed ? (
        <span className="leading-none" style={{ fontSize: "1.6em" }}>
          {avatar.emoji}
        </span>
      ) : (
        <img
          src={`/art/avatar-${avatarId % AVATARS.length}.png`}
          alt={avatar.name}
          draggable={false}
          onError={() => setFailed(true)}
          className="w-[112%] h-[112%] max-w-none object-cover translate-y-[6%]"
        />
      )}
    </div>
  );
}
