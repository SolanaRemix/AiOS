#!/usr/bin/env bash
# =============================================================================
# backup.sh – PostgreSQL database backup script
# Usage: ./scripts/backup.sh [--keep-days 7]
# =============================================================================
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
KEEP_DAYS="${KEEP_DAYS:-7}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/aios}"
S3_BUCKET="${S3_BUCKET:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aios_db_${TIMESTAMP}.sql.gz"

# Load env
if [[ -f ".env" ]]; then
  set -a; source .env; set +a
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-aios_prod}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

# ─── Colors ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${BLUE}[$(date '+%H:%M:%S')] $*${NC}"; }
ok()    { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✔ $*${NC}"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ✖ $*${NC}"; }

# ─── Create backup dir ───────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ─── Dump database ───────────────────────────────────────────────────────────
log "Starting backup of database: $POSTGRES_DB"

PGPASSWORD="$POSTGRES_PASSWORD" docker compose exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-password \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
ok "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ─── Upload to S3 (optional) ─────────────────────────────────────────────────
if [[ -n "$S3_BUCKET" ]]; then
  log "Uploading to S3: s3://${S3_BUCKET}/backups/${BACKUP_FILE}"
  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${S3_BUCKET}/backups/${BACKUP_FILE}" \
    --storage-class STANDARD_IA
  ok "Uploaded to S3"
fi

# ─── Rotate old backups ──────────────────────────────────────────────────────
log "Removing backups older than $KEEP_DAYS days..."
find "$BACKUP_DIR" -name "aios_db_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
REMAINING=$(find "$BACKUP_DIR" -name "aios_db_*.sql.gz" | wc -l)
ok "Rotation complete. $REMAINING backup(s) retained."

# ─── Verify backup ───────────────────────────────────────────────────────────
log "Verifying backup integrity..."
if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null; then
  ok "Backup integrity verified"
else
  error "Backup verification failed!"
  exit 1
fi

ok "Backup completed successfully: ${BACKUP_DIR}/${BACKUP_FILE}"
