# Burrower
*MadHacks Fall 2026 Submission*

**Theme: Let's Dig In**

Burrower is a whack-a-mole game where the mole is a player. One player is an attacker tunnelling through a company network toward the crown jewels. Everyone else is the security team, digging through the logs on their phones to find them. Nobody can spot the mole alone, so the game is played out loud and cooperation is key.

## How to play

- **Join**: Players open the site on their phones and enter the room code. A TV is optional: open `/tv/CODE` on a big screen for the shared map, the whack reveals and the end-of-round replay.
- **The mole** starts at the `ENTRY` machine and digs between adjacent machines:
  - **Quiet dig** (9s): leaves one faint trace, a login with stolen creds but no matching network connection.
  - **Loud dig** (3s): sprays port scans from your machine to all its neighbours.
  - **Loot** (10s) a crown jewel: file copies by a user who never logged in there.
  - **Decoy**: fake a suspicious trace somewhere else.
  - Loot **3 jewels** before the clock runs out to win.
- **Defenders** each watch a different log feed: logins, network, or files.
  - **The rule**: real activity always leaves a matching set across all three feeds (a connection, a login from that source, a file touch by that user). Mole activity leaves a piece missing or wrong.
  - 🔨 **Whack** quarantines a machine. It needs **two defenders** on the same machine, and the team has 5. A miss knocks that machine offline for 30s, which leaves a blind spot.
  - Each feed comes with a tool. Logins → **reset passwords** (knocks the mole back one machine). Network → **firewall** (no digging in or out for 25s). Files → **bait** (looting it reveals the mole).
  - **Dig in**: see all three feeds for one machine for 10s, while your own feed goes blind.
  - Defenders win by catching the mole **twice** or running out the clock.
- **Traffic spikes** are announced 10s ahead and triple the log noise. That's the moment the mole will want to move.

The mole role rotates every round.

## Development

Requires [Bun](https://bun.sh) ≥ 1.3 and pnpm 9.

```bash
pnpm install
pnpm dev          # server on :3000, web on :3001 (also exposed on your LAN for phones)
pnpm test         # engine tests (bun test)
pnpm typecheck
```

Open `http://localhost:3001`. Player identity is stored per tab (sessionStorage), so you can playtest a whole room from one browser by opening several tabs.

Production: `docker compose up --build` serves the built client and the API on port 3000.

## Architecture

A pnpm and Turborepo monorepo, structured like `n-of-us-are-lying`, with one key difference: the **server is authoritative**. There's no host client running the rules. Every client is a thin view.

```
apps/server      Bun HTTP + WebSocket server
  src/game/      Pure game engine (no I/O): network generation, traffic/noise, rules
  src/room.ts    Room: connections, 200ms tick loop, per-socket views
apps/web         React + Vite + Tailwind client
  pages/Play     Phone controller (mole or defender)
  pages/Tv       Optional read-only big screen
packages/shared  Types, tunables (GAME constants) and zod schemas for client messages
```

- Clients send intents (`MOLE_DIG`, `WHACK_VOTE`, `USE_TOOL`…). They are validated with zod and then checked against the rules in `Game`.
- Every tick, the room sends each socket a `RoomView` built for that viewer. The mole's position goes only to the mole, each defender gets only their own feeds, and bait locations go only to defenders. Hidden information never leaves the server.
- `Game` takes an injectable RNG and advances only through `tick(dt)`, so it's deterministic under test.
- All balance knobs (dig times, cooldowns, noise rates, spike timing) live in `packages/shared/src/constants.ts`.

### HTTP / WS

- `POST /api/v1/rooms` → `{ roomCode }`
- `GET /api/v1/rooms/:code` → 200 if the room exists
- `GET /api/v1/rooms/:code/ws?name=…` join · `?playerId=…&token=…` reconnect · `?display=1` TV
