#!/usr/bin/env bash
# Ensure required env vars are set
: "${BASE_PATH?Need to set BASE_PATH}"
: "${PORT?Need to set PORT}"
# Install dependencies
pnpm install
# Run TypeScript type‑check
pnpm run typecheck
# Perform production build
pnpm run build
# Exit status will reflect build success
