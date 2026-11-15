import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROOM_CODE_LENGTH } from "@phish/shared";
import { createRoom } from "../lib/api";
import { getLastRoom, getPlayerSession, setHostGameLength, setHostToken, setPlayerSession } from "../lib/session";
import { DEFAULT_GAME_LENGTH, GAME_LENGTH_ROUNDS, type GameLength } from "../machines/gameMachine";
import Logo from "../components/shared/Logo";
import Art from "../components/shared/Art";

const LENGTHS: { value: GameLength; label: string; emoji: string }[] = [
  { value: "snack", label: "Snack", emoji: "🍟" },
  { value: "feast", label: "Feast", emoji: "🐟" },
];

export default function Home() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [lastRoom] = useState(() => getLastRoom());
  const [roomCode, setRoomCode] = useState(() => (params.get("code") || "").toUpperCase().slice(0, ROOM_CODE_LENGTH));
  const [name, setName] = useState(() => params.get("name") || "");
  const [length, setLength] = useState<GameLength>(DEFAULT_GAME_LENGTH);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canJoin = roomCode.length === ROOM_CODE_LENGTH && name.trim().length > 0;

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canJoin) return;
    const code = roomCode.toUpperCase();
    const existing = getPlayerSession(code);
    if (!existing || existing.name !== name.trim()) setPlayerSession(code, { name: name.trim() });
    navigate(`/play/${code}`);
  };

  const host = async () => {
    setCreating(true);
    setError(null);
    try {
      const { roomCode, hostToken } = await createRoom();
      setHostToken(roomCode, hostToken);
      setHostGameLength(roomCode, length);
      navigate(`/host/${roomCode}`);
    } catch {
      setError("Couldn't open a new shop. Is the server running?");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="stage min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      <div className="animate-pop-in">
        <Logo size="lg" />
      </div>
      <p className="mt-3 text-center text-paper/80 text-lg max-w-md">
        Cook up convincing scam messages. Spot the one real message hiding among them.
      </p>

      <div className="w-full max-w-md mt-8 flex flex-col gap-6">
        {lastRoom && !params.get("code") && (
          <button onClick={() => navigate(`/play/${lastRoom.roomCode}`)} className="btn btn-pea w-full">
            Rejoin {lastRoom.roomCode} as {lastRoom.session.name}
          </button>
        )}

        <form onSubmit={join} className="newsprint sticker p-6 flex flex-col gap-4 animate-slide-up">
          <h2 className="font-display text-3xl">Join a game</h2>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-sm uppercase tracking-wider text-ink/70">Room code</span>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              maxLength={ROOM_CODE_LENGTH}
              placeholder="ABC123"
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full rounded-xl border-[3px] border-ink bg-white px-4 py-3 text-center font-mono font-bold text-3xl tracking-[0.3em] uppercase placeholder:text-ink/20 focus:outline-none focus:ring-4 focus:ring-mustard"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold text-sm uppercase tracking-wider text-ink/70">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 16))}
              placeholder="Captain Haddock"
              autoComplete="nickname"
              className="w-full rounded-xl border-[3px] border-ink bg-white px-4 py-3 text-center text-2xl font-semibold placeholder:text-ink/25 focus:outline-none focus:ring-4 focus:ring-mustard"
            />
          </label>
          <button type="submit" disabled={!canJoin} className="btn w-full mt-1">
            Grab a seat 🍽️
          </button>
        </form>

        <div className="sticker bg-ink-2 border-paper/30 text-paper p-6 flex flex-col gap-4 animate-slide-up [animation-delay:120ms]">
          <div className="flex items-center gap-3">
            <Art name="mascot" fallback="🐟" className="size-16 text-5xl" />
            <div>
              <h2 className="font-display text-3xl">Host on a big screen</h2>
              <p className="text-paper/70 text-sm">Open this on a TV or laptop everyone can see.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {LENGTHS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={length === option.value}
                onClick={() => setLength(option.value)}
                className={`rounded-xl border-[3px] px-3 py-2.5 text-left cursor-pointer transition-colors ${
                  length === option.value ? "border-mustard bg-mustard/15" : "border-paper/25 hover:border-paper/50"
                }`}
              >
                <span className="font-display text-xl">
                  {option.emoji} {option.label}
                </span>
                <span className="block text-paper/70 text-sm">{GAME_LENGTH_ROUNDS[option.value]} rounds</span>
              </button>
            ))}
          </div>
          <button onClick={host} disabled={creating} className="btn btn-ketchup w-full">
            {creating ? "Heating the fryer…" : "Open a new shop 🔥"}
          </button>
          {error && <p className="text-ketchup font-semibold text-center">{error}</p>}
        </div>
      </div>

      <p className="mt-10 text-paper/40 text-sm text-center">
        All brands are made up. No real fish were phished. 🐟
      </p>
    </div>
  );
}
