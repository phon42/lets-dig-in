import type { Player, PlayerViewState } from "@phish/shared";
import Avatar from "../shared/Avatar";
import SoundToggle from "../shared/SoundToggle";
import TimerRing from "../shared/TimerRing";

interface PlayerLayoutProps {
  roomCode: string;
  isConnected: boolean;
  me?: Player;
  view: PlayerViewState | null;
  error: string | null;
  children: React.ReactNode;
}

export default function PlayerLayout({ roomCode, isConnected, me, view, error, children }: PlayerLayoutProps) {
  const progress = view?.roundProgress;
  const showTimer = view && ["WRITING", "VOTING"].includes(view.phase);
  return (
    <div className="stage min-h-[100dvh] flex flex-col">
      <div className="gingham h-3 border-b-[3px] border-ink" />
      <header className="flex items-center gap-3 px-4 py-3">
        {me ? (
          <>
            <Avatar avatarId={me.avatarId} size="size-11" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl leading-tight truncate text-paper">
                {me.name} {me.isVip && <span title="You have the chef's hat">👨‍🍳</span>}
              </div>
              <div className="text-mustard font-semibold text-sm">{me.score.toLocaleString()} pts</div>
            </div>
          </>
        ) : (
          <div className="flex-1 font-display text-xl text-paper">Phish &amp; Chips</div>
        )}
        {progress && (
          <span className={`sticker-sm px-2 py-0.5 text-sm font-display ${progress.multiplier > 1 ? "bg-ketchup text-white" : "bg-paper text-ink"}`}>
            {progress.current}/{progress.total}
            {progress.multiplier > 1 && " ×2"}
          </span>
        )}
        {showTimer && <TimerRing seconds={view.timer} size="sm" />}
        <SoundToggle />
      </header>

      {(!isConnected || error) && (
        <div className="mx-4 mb-2 rounded-xl border-2 border-ink bg-ketchup text-white px-3 py-2 text-sm font-semibold">
          {error ?? "Reconnecting…"}
        </div>
      )}

      <main className="flex-1 px-4 pb-6">
        <div className="newsprint sticker p-5 max-w-md mx-auto">{children}</div>
      </main>

      <footer className="text-center text-paper/40 text-xs pb-4 font-mono tracking-widest">{roomCode}</footer>
    </div>
  );
}
