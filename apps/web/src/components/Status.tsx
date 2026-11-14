import type { Announcement, PublicGameView } from "@burrower/shared";
import { clock, secs } from "../lib/format";

/** Compact one-line scoreboard for phones */
export function MiniHud({ game }: { game: PublicGameView }) {
  const low = game.timeLeftMs < 30_000;
  return (
    <div className="flex items-center gap-3 font-mono text-sm">
      <span className={`font-bold ${low ? "text-red-400" : "text-slate-100"}`}>⏱ {clock(game.timeLeftMs)}</span>
      <span title="Crown jewels looted">
        💰 {game.loots}/{game.lootsToWin}
      </span>
      <span title="Times the mole was caught">
        🚨 {game.catches}/{game.catchesToWin}
      </span>
      <span title="Whacks left">🔨 {game.whacksLeft}</span>
    </div>
  );
}

const ANNOUNCEMENT_STYLE: Record<Announcement["kind"], string> = {
  WHACK_HIT: "bg-green-600 text-white",
  WHACK_MISS: "bg-red-700 text-white",
  LOOT: "bg-amber-500 text-slate-950",
  SPIKE_WARN: "bg-fuchsia-700 text-white",
  SPIKE_START: "bg-fuchsia-600 text-white",
  RESET: "bg-sky-700 text-white",
  FIREWALL: "bg-orange-600 text-white",
  BAIT: "bg-red-600 text-white",
};

export function announcementClass(kind: Announcement["kind"]): string {
  return ANNOUNCEMENT_STYLE[kind];
}

/**
 * The most urgent thing happening right now: a whack in progress, a tripped
 * bait, a traffic spike, or the latest fresh announcement.
 */
export function Banner({ game }: { game: PublicGameView }) {
  let text: string | null = null;
  let style = "";

  const latest = game.announcements.at(-1);
  if (game.whack) {
    if (game.whack.stage === "DROPPING") {
      text = `🔨 Whacking ${game.whack.machine}…`;
      style = "bg-slate-200 text-slate-950";
    } else {
      text = game.whack.hit ? `🔨 MOLE! Caught on ${game.whack.machine}` : `🔨 Clean. ${game.whack.machine} knocked offline`;
      style = game.whack.hit ? "bg-green-600 text-white" : "bg-red-700 text-white";
    }
  } else if (game.revealedMole) {
    text = `🪤 Bait tripped! Mole seen looting ${game.revealedMole.machine}`;
    style = "bg-red-600 text-white animate-pulse";
  } else if (game.spike) {
    text =
      game.spike.stage === "INCOMING"
        ? `📈 Traffic spike in ${secs(game.spike.msLeft)}`
        : `📈 TRAFFIC SPIKE, ${secs(game.spike.msLeft)} left`;
    style = game.spike.stage === "INCOMING" ? "bg-fuchsia-800 text-white" : "bg-fuchsia-600 text-white animate-pulse";
  } else if (latest && game.elapsedMs - latest.at < 5000) {
    text = latest.text;
    style = announcementClass(latest.kind);
  }

  if (!text) return null;
  return <div className={`px-3 py-2 text-center text-sm font-bold ${style}`}>{text}</div>;
}
