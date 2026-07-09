# Ops Run-books

This document outlines standard operating procedures and deployment guidelines for the OCTOPUS OS Phase 2 infrastructure.

## 1. Local Environment Setup

To run the application locally for development or runtime validation:

### Prerequisites
- Node.js v22+
- `pnpm` installed globally
- Docker Desktop running

### Step-by-Step Setup
1. **Start Local PostgreSQL via Docker:**
   ```bash
   docker run --name octopus_db \
     -e POSTGRES_USER=dummy \
     -e POSTGRES_PASSWORD=dummy \
     -e POSTGRES_DB=dummy \
     -p 5432:5432 \
     -d postgres:15-alpine
   ```

2. **Wait for Database Readiness:**
   Verify the database is accepting connections:
   ```bash
   docker logs octopus_db
   ```
   *(Look for: "database system is ready to accept connections")*

3. **Database Migrations:**
   Run Drizzle migrations to initialize the schema:
   ```bash
   pnpm --filter @workspace/db run push
   ```

4. **Verify Database Health:**
   ```bash
   pnpm db:verify
   ```

## 2. Running the Application

### Start the API Server
Ensure your environment variables (`PORT` and `DATABASE_URL`) are exported, then start the compiled server:
```bash
export PORT=5000
export DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy"
node dist/index.mjs
```

### Stop the API Server
The application listens for `SIGINT` (Ctrl+C) and `SIGTERM`. Upon receiving a stop signal, it will:
1. Stop accepting new tasks in the scheduler.
2. Drain the event bus safely.
3. Close the HTTP server gracefully.
4. Exit with code 0.

## 3. Deploy Pipeline (CI/CD Steps)

Production deployments (e.g., to Railway) follow this automated pipeline:

1. **Build Step**:
   ```bash
   pnpm -r --filter '!mockup-sandbox' --filter '!octopus-os' run build
   ```
2. **Environment Variables**:
   Ensure all required environment variables are set:
   - `PORT`: (default 5000)
   - `DATABASE_URL`: Connection string for Supabase PostgreSQL.

3. **Start Command**:
   ```bash
   node dist/index.mjs
   ```

## 4. Monitoring KPIs

Key Performance Indicators to monitor on Grafana / Railway Dashboard:
- **profit.twin.insight**: Event volume.
- **Budget Spend**: Daily spend vs. allocation.
- **Policy Violations**: Spike in violations indicates overly restrictive policies or agent hallucination.
- **API Latency**: Core REST endpoints (`< 200ms`).

## 5. Troubleshooting & Rollback

### Common Errors
- **`Missing required environment variable DATABASE_URL`**: The server will immediately crash. Ensure the secrets are injected properly in the orchestrator.
- **`password authentication failed`**: The database connection string is malformed or IP is not allow-listed in Supabase.

### Rollback Procedure (Self-Evolution Revert)
If a newly deployed proposal causes system instability:
1. Identify the problematic proposal ID in `evolution_proposals`.
2. Revert its status from `deployed` to `rejected`.
3. Restart the `api-server` instances to flush the configuration from memory.
4. If the system is still unstable, force the Engine into `MANUAL` mode:
   ```bash
   curl -X PUT http://<API_URL>/api/profit-engine/settings/mode -d '{"mode":"MANUAL"}'
   ```
