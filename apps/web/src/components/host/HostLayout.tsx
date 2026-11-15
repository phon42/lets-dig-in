import Logo from "../shared/Logo";
import TimerRing from "../shared/TimerRing";
import SoundToggle from "../shared/SoundToggle";

interface HostLayoutProps {
  roomCode: string;
  isConnected: boolean;
  timer: number | null;
  timerTotal?: number;
  roundProgress?: { current: number; total: number; multiplier: number };
  phase: string;
  onSkip?: () => void;
  children: React.ReactNode;
}

const PHASE_LABEL: Record<string, string> = {
  lobby: "Doors open",
  tutorial: "How to play",
  writing: "Cook a phish",
  voting: "Spot the real one",
  reveal: "The reveal",
  leaderboard: "Final scores",
};

export default function HostLayout({
  roomCode,
  isConnected,
  timer,
  timerTotal,
  roundProgress,
  phase,
  onSkip,
  children,
}: HostLayoutProps) {
  return (
    <div className="stage h-screen w-screen overflow-hidden flex flex-col">
      <header className="flex items-center justify-between gap-6 px-8 pt-5 pb-3">
        <Logo size="sm" />

        <div className="flex items-center gap-3">
          <span className="sticker-sm bg-paper text-ink font-display text-xl px-4 py-1.5">{PHASE_LABEL[phase] ?? phase}</span>
          {roundProgress && (
            <span className="sticker-sm bg-ink-2 text-paper font-display text-xl px-4 py-1.5 border-paper/30">
              Round {roundProgress.current}/{roundProgress.total}
            </span>
          )}
          {roundProgress && roundProgress.multiplier > 1 && (
            <span className="sticker-sm bg-ketchup text-white font-display text-xl px-4 py-1.5 animate-wobble">
              Final round · double battered ×{roundProgress.multiplier}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {phase !== "lobby" && (
            <span className="text-paper/70 text-base">
              Join <span className="font-mono font-bold text-mustard text-lg tracking-widest">{roomCode}</span>
            </span>
          )}
          <TimerRing seconds={timer} total={timerTotal} />
          {onSkip && (
            <button onClick={onSkip} className="btn btn-ink !text-sm !px-3 !py-1.5 !shadow-[0_3px_0_#000]" title="Skip ahead">
              Skip ⏭
            </button>
          )}
          <SoundToggle />
          <span
            className={`size-3 rounded-full ${isConnected ? "bg-pea" : "bg-ketchup animate-pulse"}`}
            title={isConnected ? "Connected" : "Reconnecting…"}
          />
        </div>
      </header>
      <main className="flex-1 min-h-0 px-8 pb-6">{children}</main>
    </div>
  );
}
