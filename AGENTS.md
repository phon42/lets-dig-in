# AGENTS.md

Phish & Chips: a host-authoritative party game (see README for the rules).

## Commands
```bash
pnpm install
pnpm build                          # shared -> web + server
pnpm --filter @phish/shared build   # rebuild after editing packages/shared
pnpm --filter @phish/server dev     # :3000
pnpm --filter @phish/web dev        # :3001 (proxies /api + websockets to :3000)
pnpm --filter @phish/web typecheck
```

## Architecture
- **Host owns all game state** (`apps/web/src/machines/gameMachine.ts`, XState v5). The server (`apps/server`) only relays the `{type, payload, target, senderId}` envelope between host and players, so rule changes never touch the server.
- Each phone receives `toPlayerView(state, playerId)` (`apps/web/src/lib/view.ts`). Never put authorship, entry kinds or the real message into a player view before the reveal.
- Truth bank: `apps/web/src/data/scenarios.ts`. Every `real.text` and `house` must contain `{{link}}`, and `real.url` must be on `domain`. Brands are fictional on purpose.
- Lookalike links come from `lib/lures.ts`; red-flag detection for the reveal is in `lib/tells.ts`.
- Art lives in `apps/web/public/art/` (generated); components fall back to emoji if a file is missing.
- The host page scales every rem with the viewport (`html.host-root` in `index.css`), so use rem/Tailwind sizes on TV screens.
