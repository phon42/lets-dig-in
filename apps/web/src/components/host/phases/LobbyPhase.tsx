import { QRCodeSVG } from "qrcode.react";
import { MAX_PLAYERS, MIN_PLAYERS, type Player } from "@phish/shared";
import PlayerSticker from "../PlayerSticker";
import Art from "../../shared/Art";

interface LobbyPhaseProps {
  roomCode: string;
  players: Record<string, Player>;
  rounds: number;
}

export default function LobbyPhase({ roomCode, players, rounds }: LobbyPhaseProps) {
  const list = Object.values(players).filter((p) => p.isConnected);
  const vip = list.find((p) => p.isVip);
  const needed = Math.max(0, MIN_PLAYERS - list.length);
  const joinUrl = `${window.location.origin}/?code=${roomCode}`;

  return (
    <div className="h-full grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8">
      {/* Join card */}
      <section className="newsprint sticker p-8 flex flex-col justify-between -rotate-1 animate-slide-up">
        <div>
        <p className="font-display text-ketchup text-2xl uppercase tracking-wider">Now serving</p>
        <h2 className="font-display text-5xl leading-tight mt-1">Grab your phone &amp; join the queue</h2>
        <p className="mt-4 text-xl">
          Go to <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border-2 border-ink">{window.location.host}</span> and enter:
        </p>
        <div className="flex gap-2 mt-5">
          {roomCode.split("").map((ch, i) => (
            <span
              key={i}
              className="sticker-sm bg-mustard font-display text-7xl w-[1.3em] h-[1.5em] flex items-center justify-center animate-pop-in"
              style={{ animationDelay: `${i * 60}ms`, rotate: `${(i % 2 ? 1 : -1) * 3}deg` }}
            >
              {ch}
            </span>
          ))}
        </div>
        </div>
        <ul className="flex flex-col gap-3 text-2xl">
          <li>🎣 Cook up a convincing scam message</li>
          <li>🔗 Every fake has to carry a dodgy link</li>
          <li>🐟 Spot the one real message hiding among them</li>
        </ul>
        <div className="flex items-end gap-6 pt-6">
          <div className="bg-white p-3 rounded-xl border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)]">
            <QRCodeSVG value={joinUrl} size={210} fgColor="#14213D" bgColor="#ffffff" level="M" />
          </div>
          <div className="text-lg leading-snug">
            <p className="font-bold">Or scan to join</p>
            <p className="text-ink/70">
              {MIN_PLAYERS}–{MAX_PLAYERS} players · {rounds} rounds
            </p>
          </div>
        </div>
      </section>

      {/* The counter */}
      <section className="flex flex-col min-h-0">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl text-paper">At the counter</h2>
          <span className="font-display text-2xl text-mustard">
            {list.length}/{MAX_PLAYERS}
          </span>
        </div>
        <div className="flex-1 mt-4 rounded-3xl border-[3px] border-dashed border-paper/25 p-6 grid grid-cols-5 grid-rows-2 gap-6 place-items-center">
          {list.map((p) => (
            <PlayerSticker key={p.id} player={p} size="lg" />
          ))}
          {Array.from({ length: Math.max(0, MAX_PLAYERS - list.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex flex-col items-center gap-2 opacity-35">
              <div className="size-28 rounded-full border-[3px] border-dashed border-paper/60 flex items-center justify-center text-3xl">🍽️</div>
              <span className="text-paper/70 text-sm">empty seat</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-5">
          <Art name="mascot" fallback="🐟" className="size-32 animate-float text-7xl shrink-0" alt="Codfrey the chef" />
          <div className="relative newsprint sticker-sm px-5 py-4 text-xl font-semibold">
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 size-5 rotate-45 bg-paper border-l-[2.5px] border-b-[2.5px] border-ink" />
            {needed > 0 ? (
              <>Need {needed} more hungry {needed === 1 ? "player" : "players"} before we can fry!</>
            ) : vip ? (
              <>
                <span className="text-ketchup">{vip.name}</span> has the chef's hat 👨‍🍳 and starts the game from their phone.
              </>
            ) : (
              <>Fryer's hot. Waiting for the chef…</>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
