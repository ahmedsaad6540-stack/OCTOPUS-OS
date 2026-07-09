# Incident Response Plan

This document outlines the standard operating procedures for handling production incidents in OCTOPUS OS. It defines severity levels, provides quick-reference runbooks for common failures, and establishes a communication template for incident postmortems.

---

## 1. Severity Levels

| Severity | Description | Target Response Time | Examples |
| :--- | :--- | :--- | :--- |
| **P0 (Critical)** | Complete system outage. No users can access the system, or core operations (e.g., database writes) are completely down. | Immediate (< 15 mins) | Database cluster down, API returning 502/503 for all requests. |
| **P1 (High)** | Core feature degraded or unavailable for a significant portion of users, but the system is partially functional. | < 1 hour | Specific affiliate network adapter failing, ProfitEngine halting workflows. |
| **P2 (Medium)** | Non-critical feature broken or degraded performance, affecting a limited subset of users. | < 4 hours | High memory usage alerts, delayed notification deliveries. |
| **P3 (Low)** | Minor bugs, cosmetic issues, or localized edge cases. | Next sprint | Incorrect label on dashboard, minor typo in logs. |

---

## 2. Quick-Reference Runbooks

### 🔴 Database Down (P0)
**Symptoms**: API Server throws `Connection refused` or `ETIMEDOUT` errors. Health check returns 503.
**Action**:
1. Check Supabase / Local Postgres instance status.
2. Verify `DATABASE_URL` environment variable is intact.
3. Check database connection limits and active connections (`pg_stat_activity`).
4. If connection pool exhausted, restart API Server instances to flush the pool.

### 🔴 Docker Failed / Image Crash (P0/P1)
**Symptoms**: Container restarts in a loop. `docker ps` shows `Exited`.
**Action**:
1. Run `docker logs octopus-api` to capture the fatal error.
2. If the crash is due to missing environment variables, inject them and restart.
3. If it's a code crash, rollback to the previous stable image tag immediately.

### 🟡 Migration Failed (P1)
**Symptoms**: `pnpm run push` throws syntax errors or conflicts.
**Action**:
1. Do NOT manually modify the database schema.
2. Revert the migration files in Git.
3. Use `drizzle-kit drop` if a partial migration was applied locally, or restore from a database snapshot if in production.

### 🟡 High Memory Usage (P2)
**Symptoms**: Memory exceeds 85% capacity; latency spikes.
**Action**:
1. Trigger a Node.js garbage collection trace if possible.
2. Restart the affected container instances to relieve pressure temporarily.
3. Analyze logs for unbounded arrays or unclosed database connections in long-running `Scheduler` tasks.

---

## 3. Communication Template (Postmortem)

For all P0 and P1 incidents, a postmortem must be filled out and shared within 48 hours of resolution.

```markdown
### Incident Report: [Brief Title]

**Date & Time of Discovery**: YYYY-MM-DD HH:MM UTC
**Duration**: [X hours, Y minutes]
**Severity**: [P0/P1]

#### 1. Impact
*Describe exactly what was broken, which users were affected, and what the user experience was during the outage.*

#### 2. Root Cause
*Describe the technical root cause (e.g., "A missing index on the `events` table caused queries to timeout, exhausting the connection pool").*

#### 3. Timeline
- 10:00 - First alert fired (High CPU).
- 10:05 - DevOps acknowledged.
- 10:15 - Root cause identified as slow query.
- 10:30 - Hotfix deployed, system recovered.

#### 4. Containment & Resolution
*How did we fix it in the short term? (e.g., Restarted servers, rolled back to v1.0.0).*

#### 5. Lessons Learned / Action Items
- [ ] Add missing index to `events` table (Owner: Data Eng).
- [ ] Lower the connection timeout threshold to prevent pool exhaustion (Owner: Backend).
```
