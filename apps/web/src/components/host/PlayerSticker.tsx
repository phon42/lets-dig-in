import type { Player } from "@phish/shared";
import Avatar from "../shared/Avatar";

interface PlayerStickerProps {
  player: Player;
  status?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PlayerSticker({ player, status, size = "md", className = "" }: PlayerStickerProps) {
  return (
    <div className={`flex flex-col items-center gap-1.5 animate-pop-in ${className}`}>
      <div className="relative">
        <Avatar avatarId={player.avatarId} size={size === "lg" ? "size-28" : size === "md" ? "size-20" : "size-14"} dim={!player.isConnected} />
        {player.isVip && (
          <span className="absolute -top-3 -right-2 text-2xl rotate-12 drop-shadow" title="VIP: holds the chef's hat">
            👨‍🍳
          </span>
        )}
      </div>
      <span className={`font-display ${size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-base"} max-w-[8rem] truncate text-paper`}>{player.name}</span>
      {status}
    </div>
  );
}
