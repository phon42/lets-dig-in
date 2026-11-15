import { useEffect, useSyncExternalStore } from "react";
import { getSoundStatus, primeAudio, setMuted, subscribeSound } from "../../lib/sound";

export default function SoundToggle({ className = "" }: { className?: string }) {
  const status = useSyncExternalStore(subscribeSound, getSoundStatus);
  useEffect(() => primeAudio(), []);
  const icon = status === "muted" ? "🔇" : status === "locked" ? "🔈" : "🔊";
  return (
    <button
      type="button"
      onClick={() => setMuted(status === "on")}
      className={`sticker-sm bg-paper text-ink size-10 flex items-center justify-center text-lg cursor-pointer hover:bg-white ${className}`}
      title={status === "muted" ? "Unmute" : status === "locked" ? "Tap to enable sound" : "Mute"}
      aria-label="Toggle sound"
    >
      {icon}
    </button>
  );
}
