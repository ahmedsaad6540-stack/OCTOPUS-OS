#!/usr/bin/env bash
# OCTOPUS OS — database restore script.
#
# Restores a dump produced by backup.sh into DATABASE_URL. Uses
# --clean --if-exists so it can be run against a database that already has
# (stale) OCTOPUS OS tables in it, and --no-owner/--no-privileges so a
# restore doesn't fail on role mismatches between the backup source and
# the restore target.
#
# Usage:
#   DATABASE_URL=postgres://user:pass@host:5432/octopus ./scripts/ops/restore.sh ./backups/octopus-20260707T000000Z.dump
#
# DESTRUCTIVE: this drops and recreates every table the dump contains.
# Confirm you're pointed at the intended database before running it.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL must be set" >&2
  exit 1
fi

DUMP_FILE="${1:-}"
if [ -z "${DUMP_FILE}" ] || [ ! -f "${DUMP_FILE}" ]; then
  echo "Usage: DATABASE_URL=... $0 <path-to-dump-file>" >&2
  exit 1
fi

echo "About to restore ${DUMP_FILE} into ${DATABASE_URL%%@*}@..."
echo "This will DROP and recreate tables present in the dump. Ctrl+C within 5s to abort."
sleep 5

pg_restore --clean --if-exists --no-owner --no-privileges --dbname="${DATABASE_URL}" "${DUMP_FILE}"

echo "Restore complete from ${DUMP_FILE}"
