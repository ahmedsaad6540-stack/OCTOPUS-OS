---
name: OCTOPUS NEXUS OS Architecture
description: Core decisions and structure for the OCTOPUS Business Operating System project
---

## Architecture

- **Frontend**: `artifacts/mockup-sandbox` (React + Vite + Tailwind) — serves the full OS dashboard at `/__mockup/`
- **Backend**: `artifacts/api-server` (Express + TypeScript) — serves at `/api/`
- **DB**: PostgreSQL via Drizzle ORM in `lib/db`

## Auth

- JWT-based (jsonwebtoken + bcryptjs), 7-day token expiry
- Token stored in localStorage under `octopus_token` / `octopus_user`
- `JWT_SECRET` defaults to hardcoded string — must set env var in production
- `requireAuth` middleware in `artifacts/api-server/src/middleware/auth.ts`

## DB Tables

- `users` — id, email, password (bcrypt), name, role
- `ai_providers` — per-user AI provider configs (openai/gemini/claude/etc)
- `social_accounts` — per-user social platform connections
- `affiliate_networks` — per-user affiliate network configs
- `campaigns` — per-user campaign tracking

## Frontend Pages (state-based routing, no URL changes)

- Command Center, Agents (10), AI Providers, Social Accounts, Affiliate Networks, Campaigns, Analytics, Prompt Studio, Settings

**Why state router:** avoids conflict with existing `/preview/*` path system used by the canvas mockup system.

## Test Credentials

- Email: admin@octopus.ai / Password: octopus123 (created during dev)
