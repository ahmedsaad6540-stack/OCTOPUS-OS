# syntax=docker/dockerfile:1.7
# Root Dockerfile for @workspace/api-server (pnpm monorepo)
# Use this by setting Railway Builder = Dockerfile (root context).

ARG NODE_VERSION=22-alpine

# ---------- Base ----------
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Pin pnpm version explicitly (must match root package.json "packageManager")
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

# ---------- Deps (install with build scripts allowed) ----------
FROM base AS deps
# Copy manifests only for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
# --no-frozen-lockfile to survive minor lockfile drift on Railway
RUN pnpm install --no-frozen-lockfile \
  && pnpm rebuild -r protobufjs || true

# ---------- Builder ----------
FROM deps AS builder
RUN pnpm --filter @workspace/api-server run build

# ---------- Runtime ----------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY --from=builder /app/artifacts/api-server/dist ./dist
EXPOSE 5000
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
