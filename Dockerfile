ARG BUN_VERSION=1.3

FROM oven/bun:${BUN_VERSION} AS bun

# pnpm needs a real Node.js
FROM node:22-slim AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/server apps/server
COPY apps/web apps/web
# The server bundle inlines @burrower/shared, zod and nanoid, so the runtime needs no node_modules
RUN pnpm --filter @burrower/web build && pnpm --filter @burrower/server build

FROM oven/bun:${BUN_VERSION}-slim AS runtime
WORKDIR /app
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/web/dist ./public
ENV NODE_ENV=production STATIC_DIR=/app/public PORT=3000
EXPOSE 3000
CMD ["bun", "run", "/app/dist/index.js"]
