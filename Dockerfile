# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# OCTOPUS OS — api-server production image
#
# Multi-stage build: install + typecheck + bundle in a full Node image,
# then copy only the bundled output and production node_modules into a
# slim runtime image. `artifacts/api-server/build.mjs` bundles the entire
# server (including every `@workspace/*` library it depends on) into a
# single esbuild output under `dist/`, with a small, explicit external-deps
# list (native modules that can't be bundled) — see that file for the list.
#
# This Dockerfile only builds and runs `@workspace/api-server`. The two
# frontends (`artifacts/octopus-os`, `artifacts/mockup-sandbox`) are static
# Vite apps with their own build output; containerizing them is a separate,
# smaller Dockerfile (a static file server behind nginx or similar) that
# hasn't been added yet — see FINAL_DEPLOYMENT_GUIDE.md.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---------------------------------------------------------------------------
# deps: install the full workspace so pnpm's workspace symlinks resolve
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib ./lib
COPY artifacts ./artifacts
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# build: typecheck everything, then bundle just the api-server
# ---------------------------------------------------------------------------
FROM deps AS build
# Placeholder build-time values — only the frontend Vite configs read these
# at build time; the api-server itself reads real values from the runtime
# environment (see docker-compose.prod.yml / your orchestrator's env config).
ARG PORT=5000
ARG BASE_PATH=/
ARG DATABASE_URL=postgres://build:build@localhost:5432/build
ENV PORT=${PORT} BASE_PATH=${BASE_PATH} DATABASE_URL=${DATABASE_URL}
RUN pnpm run typecheck
RUN pnpm --filter @workspace/api-server run build

# ---------------------------------------------------------------------------
# prod-deps: production-only node_modules for the runtime image
# ---------------------------------------------------------------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib ./lib
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
RUN pnpm install --frozen-lockfile --prod --filter @workspace/api-server...

# ---------------------------------------------------------------------------
# runtime: slim final image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
RUN addgroup -S octopus && adduser -S octopus -G octopus
WORKDIR /app

COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/artifacts/api-server/node_modules ./artifacts/api-server/node_modules
COPY --from=build /repo/artifacts/api-server/dist ./dist
COPY --from=build /repo/artifacts/api-server/package.json ./package.json

USER octopus
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--enable-source-maps", "dist/index.mjs"]
