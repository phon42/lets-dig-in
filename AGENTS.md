# AGENTS.md

See README.md for the game rules and architecture overview.

## Commands

```bash
pnpm install
pnpm dev                              # server :3000 + web :3001
pnpm --filter @burrower/server test   # bun test (engine)
pnpm typecheck                        # all packages
pnpm --filter @burrower/web build
```

## Conventions

- **Server-authoritative.** All rules live in `apps/server/src/game/engine.ts`. The web app never decides outcomes; it renders `RoomView` and sends `ClientMessage` intents.
- **Hidden information stays on the server.** Anything only one role may know (mole position, feeds, bait) must go through the per-player `viewFor()` in `apps/server/src/room.ts`, never through `publicView()`.
- **The mismatch rule is the core mechanic.** Legit sessions (`spawnSession`) must always emit a matching NETWORK + LOGIN + FILE triple. Mole actions emit an incomplete or wrong set. Keep `engine.test.ts` passing when you touch traffic generation.
- `Game` is pure and time only advances through `tick(dt)`, so keep it free of `Date.now()`, timers and sockets.
- Tunables go in `packages/shared/src/constants.ts` (`GAME`, `NOISE_RATES`).
- `@burrower/shared` is consumed as TypeScript source (no build step).
- Message shape: flat `{ type, ...fields }`, validated by `ClientMessageSchema` (zod).
