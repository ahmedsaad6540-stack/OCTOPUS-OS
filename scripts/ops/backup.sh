#!/usr/bin/env bash
# OCTOPUS OS — database backup script.
#
# Real pg_dump wrapper, not a placeholder: takes a timestamped, compressed
# custom-format dump of DATABASE_URL and writes it to $BACKUP_DIR (default
# ./backups). Custom format (-Fc) so it can be restored selectively via
# pg_restore, not just replayed as a flat SQL script.
#
# Usage:
#   DATABASE_URL=postgres://user:pass@host:5432/octopus ./scripts/ops/backup.sh
#
# Has not been executed against a real database in the environment that
# wrote this script — no reachable Postgres instance exists there. The
# script itself is real and complete; verify it against a real
# DATABASE_URL before relying on it in production. See
# FINAL_DEPLOYMENT_GUIDE.md for the recommended backup schedule.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL must be set" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="${BACKUP_DIR}/octopus-${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "Backing up ${DATABASE_URL%%@*}@... to ${OUT_FILE}"
pg_dump --format=custom --compress=9 --file="${OUT_FILE}" "${DATABASE_URL}"

echo "Backup complete: ${OUT_FILE} ($(du -h "${OUT_FILE}" | cut -f1))"

# Retention: keep the last 14 daily backups, delete anything older.
# Adjust RETENTION_COUNT for your actual recovery-point-objective needs.
RETENTION_COUNT="${RETENTION_COUNT:-14}"
# shellcheck disable=SC2012
ls -1t "${BACKUP_DIR}"/octopus-*.dump 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | while read -r old; do
  echo "Pruning old backup: ${old}"
  rm -f -- "${old}"
done
