import { MIN_PLAYERS, type PlayerViewState } from "@phish/shared";
import Avatar, { AVATARS } from "../../shared/Avatar";

interface LobbyPhaseProps {
  view: PlayerViewState;
  onStart: () => void;
}

export default function LobbyPhase({ view, onStart }: LobbyPhaseProps) {
  const me = view.players[view.playerId];
  const here = Object.values(view.players).filter((p) => p.isConnected);
  const vip = here.find((p) => p.isVip);
  const needed = Math.max(0, MIN_PLAYERS - here.length);

  return (
    <div className="flex flex-col items-center text-center gap-4">
      {me && <Avatar avatarId={me.avatarId} size="size-28" className="animate-wobble" />}
      <div>
        <h2 className="font-display text-3xl">You're at the counter!</h2>
        {me && <p className="text-ink/70">You're playing as a {AVATARS[me.avatarId % AVATARS.length].name.toLowerCase()}. Look for yourself on the TV.</p>}
      </div>

      <div className="flex flex-wrap justify-center gap-2 w-full">
        {here.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 bg-white rounded-full border-2 border-ink pr-3 text-sm font-semibold">
            <Avatar avatarId={p.avatarId} size="size-7" className="!border-2" />
            {p.name}
            {p.isVip && "👨‍🍳"}
          </span>
        ))}
      </div>

      {me?.isVip ? (
        <div className="w-full flex flex-col gap-2 mt-2">
          <p className="text-sm font-semibold">You've got the chef's hat 👨‍🍳 so start when everyone's in.</p>
          <button onClick={onStart} disabled={needed > 0} className="btn btn-ketchup w-full">
            {needed > 0 ? `Need ${needed} more…` : "Start frying 🔥"}
          </button>
        </div>
      ) : (
        <p className="text-ink/70 mt-2">
          Waiting for <b>{vip?.name ?? "the chef"}</b> to start the game…
        </p>
      )}
    </div>
  );
}
