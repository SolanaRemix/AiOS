#!/usr/bin/env bash
# =============================================================================
# deploy.sh – Production deployment script
# Usage: ./scripts/deploy.sh [--branch main] [--tag latest]
# =============================================================================
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
BRANCH="${BRANCH:-main}"
TAG="${TAG:-latest}"
COMPOSE_FILE="docker-compose.yml"
LOG_FILE="/var/log/aios-deploy.log"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()   { echo -e "${BLUE}[$(date '+%H:%M:%S')] $*${NC}" | tee -a "$LOG_FILE"; }
ok()    { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✔ $*${NC}" | tee -a "$LOG_FILE"; }
warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠ $*${NC}" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ✖ $*${NC}" | tee -a "$LOG_FILE"; }

notify_slack() {
  local status="$1" message="$2"
  if [[ -n "$SLACK_WEBHOOK" ]]; then
    local color=$([[ "$status" == "success" ]] && echo "good" || echo "danger")
    curl -s -X POST "$SLACK_WEBHOOK" \
      -H 'Content-type: application/json' \
      -d "{\"attachments\":[{\"color\":\"$color\",\"text\":\"AIOS Deploy: $message\"}]}" || true
  fi
}

# ─── Pre-flight ──────────────────────────────────────────────────────────────
log "Starting AIOS deployment (branch: $BRANCH, tag: $TAG)"

if [[ ! -f ".env" ]]; then
  error ".env file not found. Copy .env.example and configure it."
  exit 1
fi

# ─── Pull latest code ────────────────────────────────────────────────────────
log "Pulling latest code from $BRANCH..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
ok "Code updated"

# ─── Pull latest images ──────────────────────────────────────────────────────
log "Pulling latest Docker images..."
docker compose -f "$COMPOSE_FILE" pull --quiet
ok "Images pulled"

# ─── Build fresh images ──────────────────────────────────────────────────────
log "Building application images..."
docker compose -f "$COMPOSE_FILE" build --no-cache --parallel api web
ok "Images built"

# ─── Run database migrations ─────────────────────────────────────────────────
log "Running database migrations..."
docker compose -f "$COMPOSE_FILE" run --rm api sh -c "cd /app/apps/api && npx prisma migrate deploy"
ok "Migrations complete"

# ─── Rolling restart ─────────────────────────────────────────────────────────
log "Performing rolling restart..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps --scale api=2 api
sleep 15
docker compose -f "$COMPOSE_FILE" up -d --no-deps --scale api=1 api
docker compose -f "$COMPOSE_FILE" up -d --no-deps web nginx
ok "Services restarted"

# ─── Health check ────────────────────────────────────────────────────────────
log "Running health checks..."
MAX_RETRIES=12
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf http://localhost/health > /dev/null 2>&1; then
    ok "Health check passed"
    break
  fi
  if [[ $i -eq $MAX_RETRIES ]]; then
    error "Health check failed after $MAX_RETRIES attempts"
    notify_slack "failure" "Deployment failed – health check timeout"
    exit 1
  fi
  warn "Health check attempt $i/$MAX_RETRIES failed, retrying in 10s..."
  sleep 10
done

# ─── Cleanup ─────────────────────────────────────────────────────────────────
log "Cleaning up old images..."
docker image prune -f --filter "until=24h" || true
ok "Cleanup complete"

ok "Deployment successful! 🚀"
notify_slack "success" "Deployment to production succeeded (tag: $TAG)"
