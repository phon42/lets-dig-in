# Phish & Chips 🐟🍟
*MadHacks Fall 2026 Submission*

**Theme: Let's Dig In**

A Jackbox-style party game about phishing. Everyone writes a convincing scam message, the fakes get shuffled in with one **real** message, and you all try to spot the real one.

## How to play

1. Open the game on a big screen (TV or laptop) and click **Open a new shop**. Everyone else joins on their phone with the room code or QR code (3–10 players).
2. **Take the order:** everyone gets the same scenario, like *"Your bank flags a suspicious charge"*, plus the brand's real website.
3. **Cook a phish:** write the message a scammer would send. Every fake **must include a 🔗 link**, and you choose how dodgy it looks:
   - 🌶️ **Mild**: a sneaky typosquat (`brinebamk.com`), 250 points per player hooked
   - 🌶️🌶️ **Medium**: a costume (`brinebank-secure.com`, `brinebank.com.verify-check.net`), 500 points per hook
   - 🌶️🌶️🌶️ **Hot**: blatant (`bit.ly/…`, a bare IP address), 750 points per hook
4. **Spot the fresh catch:** vote for the message you think is real. Spotting it earns **+1000**.
5. **The reveal:** the TV goes through every fake from least to most convincing. It shows who wrote each one, who fell for it, and its **tells**: the lookalike-link trick plus red flags like fake deadlines, threats, requests for secrets and "Dear customer". Then it shows the real message and explains why it's legit.
6. The final round counts double. The end screen gives out awards: Head Chef, Master Angler, Eagle Eye and Gullible Guppy.

### Why the link?
If fakes were just text, anyone could copy the real message word for word and nobody could tell them apart. So every message has a `{{link}}`. The real message's link is on the brand's real domain (shown to everyone). Every fake's link is a lookalike. A careful reader can always find the truth, which is exactly the habit the game teaches: **check the link**. Writers still choose how easy that is.

All brands in the truth bank (`apps/web/src/data/scenarios.ts`) are made up, so the game never impersonates a real company.

## Development

```bash
pnpm install
pnpm --filter @phish/shared build
pnpm --filter @phish/server dev   # relay server on :3000
pnpm --filter @phish/web dev      # Vite on :3001, proxies /api to :3000
```

Open http://localhost:3001. To play from phones on the same Wi-Fi, use the "Network" URL that Vite prints.

Production: `docker compose up --build` serves everything on :3000.

## Architecture

Based on N of Us Are Lying, with the same **host-authoritative** design:

- `apps/server`: a minimal Bun WebSocket relay. It routes messages between the host and the phones and knows nothing about the game rules.
- `apps/web`: React + XState + Tailwind v4. The host browser runs the entire game in `machines/gameMachine.ts` and sends each phone its own slice of the state (`lib/view.ts`). Phones also hold an encrypted copy of the host state, so a refreshed TV recovers mid-game.
- `packages/shared`: shared types, constants and the message envelope.

Key files: `data/scenarios.ts` (truth bank), `lib/lures.ts` (lookalike link generator), `lib/tells.ts` (red-flag detector for the reveal).
