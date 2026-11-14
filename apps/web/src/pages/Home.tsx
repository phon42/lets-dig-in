import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROOM_CODE_LENGTH } from "@burrower/shared";
import { createRoom, roomExists } from "../lib/api";
import { getPlayerSession, setPlayerSession } from "../lib/session";

export default function Home() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => (params.get("code") ?? "").toUpperCase().slice(0, ROOM_CODE_LENGTH));
  const [name, setName] = useState(() => params.get("name") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = (roomCode: string) => {
    const existing = getPlayerSession(roomCode);
    // Same name in the same tab means "rejoin as me"
    if (!existing || existing.name !== name.trim()) setPlayerSession(roomCode, { name: name.trim() });
    navigate(`/play/${roomCode}`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (await roomExists(code)) join(code);
      else setError(`No room called ${code}`);
    } catch {
      setError("Couldn't reach the server");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (asTv: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const roomCode = await createRoom();
      if (asTv) navigate(`/tv/${roomCode}`);
      else join(roomCode);
    } catch {
      setError("Couldn't create a room");
    } finally {
      setBusy(false);
    }
  };

  const nameOk = name.trim().length > 0;

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-center font-mono text-5xl font-extrabold tracking-tight text-amber-400">BURROWER</h1>
        <p className="mb-8 mt-2 text-center text-slate-400">One mole digs through the network. Everyone else digs through the logs.</p>

        <form onSubmit={handleJoin} className="flex flex-col gap-3 rounded-2xl bg-panel p-5">
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 16))}
              placeholder="Your name"
              className="rounded-lg bg-slate-800 px-4 py-3 text-xl"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              maxLength={ROOM_CODE_LENGTH}
              placeholder="CODE"
              autoCapitalize="characters"
              className="rounded-lg bg-slate-800 px-2 py-3 text-center font-mono text-xl tracking-widest uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !nameOk || code.length !== ROOM_CODE_LENGTH}
            className="rounded-lg bg-amber-500 py-3 text-lg font-bold text-slate-950 disabled:opacity-40"
          >
            Join room
          </button>
          <button
            type="button"
            disabled={busy || !nameOk}
            onClick={() => handleCreate(false)}
            className="rounded-lg bg-slate-700 py-3 font-semibold disabled:opacity-40"
          >
            New room (play from this phone)
          </button>
        </form>

        <button
          disabled={busy}
          onClick={() => handleCreate(true)}
          className="mt-4 w-full rounded-lg border border-line py-3 text-slate-300 hover:bg-panel"
        >
          📺 New room on this screen (TV)
        </button>

        {error && <p className="mt-4 text-center text-red-400">{error}</p>}
      </div>
    </div>
  );
}
