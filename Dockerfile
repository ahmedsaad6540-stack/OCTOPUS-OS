# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22-alpine

############################
# Base
############################
FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

############################
# Install dependencies
############################
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts

RUN pnpm install --no-frozen-lockfile
RUN pnpm rebuild -r protobufjs || true

############################
# Build
############################
FROM deps AS builder

RUN pnpm --filter @workspace/api-server build

############################
# Production dependencies
############################
FROM deps AS prod-deps

RUN pnpm prune --prod

############################
# Runtime
############################
FROM node:${NODE_VERSION} AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/package.json ./package.json

EXPOSE 5000

CMD ["node","--enable-source-maps","dist/index.mjs"]