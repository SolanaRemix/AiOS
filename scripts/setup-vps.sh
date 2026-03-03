#!/usr/bin/env bash
# =============================================================================
# setup-vps.sh – Provision a fresh Ubuntu/Debian VPS for AIOS
# Tested on Ubuntu 22.04 LTS
# Usage: sudo bash scripts/setup-vps.sh
# =============================================================================
set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()   { echo -e "${BLUE}▶ $*${NC}"; }
ok()    { echo -e "${GREEN}✔ $*${NC}"; }
warn()  { echo -e "${YELLOW}⚠ $*${NC}"; }
error() { echo -e "${RED}✖ $*${NC}"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run as root: sudo bash $0"

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-admin@example.com}"

log "Setting up AIOS VPS..."

# ─── System Update ───────────────────────────────────────────────────────────
log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip htop vim \
  ufw fail2ban \
  ca-certificates gnupg lsb-release \
  apt-transport-https software-properties-common
ok "System updated"

# ─── Docker ──────────────────────────────────────────────────────────────────
log "Installing Docker..."
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  ok "Docker installed"
else
  ok "Docker already installed ($(docker --version))"
fi

# ─── Deploy user ─────────────────────────────────────────────────────────────
log "Creating deploy user: $DEPLOY_USER"
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"
usermod -aG sudo "$DEPLOY_USER"

# Copy SSH keys if present
if [[ -d /root/.ssh ]]; then
  mkdir -p "/home/${DEPLOY_USER}/.ssh"
  cp /root/.ssh/authorized_keys "/home/${DEPLOY_USER}/.ssh/" 2>/dev/null || true
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
  chmod 700 "/home/${DEPLOY_USER}/.ssh"
  chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys" 2>/dev/null || true
fi
ok "Deploy user configured"

# ─── Firewall ────────────────────────────────────────────────────────────────
log "Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
ok "Firewall configured"

# ─── Fail2ban ────────────────────────────────────────────────────────────────
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
EOF
systemctl enable fail2ban
systemctl restart fail2ban
ok "Fail2ban configured"

# ─── SSH Hardening ───────────────────────────────────────────────────────────
log "Hardening SSH..."
sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
ok "SSH hardened"

# ─── App Directory ───────────────────────────────────────────────────────────
log "Creating app directory..."
mkdir -p /opt/aios
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" /opt/aios
chmod 755 /opt/aios

# ─── Swap (if < 4GB RAM) ─────────────────────────────────────────────────────
TOTAL_RAM=$(free -m | awk '/Mem:/{print $2}')
if [[ $TOTAL_RAM -lt 4096 ]] && [[ ! -f /swapfile ]]; then
  log "Creating 2GB swap file (RAM: ${TOTAL_RAM}MB)..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "Swap created"
fi

# ─── Certbot (optional) ──────────────────────────────────────────────────────
if [[ -n "$DOMAIN" ]]; then
  log "Installing Certbot for domain: $DOMAIN"
  apt-get install -y -qq certbot python3-certbot-nginx
  certbot certonly --standalone \
    --non-interactive --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    || warn "Certbot failed – configure SSL manually"
  ok "SSL certificate obtained"
fi

# ─── Cron for backups ────────────────────────────────────────────────────────
log "Setting up backup cron job..."
(crontab -u "$DEPLOY_USER" -l 2>/dev/null; echo "0 2 * * * cd /opt/aios && bash scripts/backup.sh >> /var/log/aios-backup.log 2>&1") \
  | crontab -u "$DEPLOY_USER" -
ok "Backup cron configured (daily at 2:00 AM)"

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
ok "VPS setup complete!"
echo -e "${GREEN}─────────────────────────────────────────${NC}"
echo -e "  ${BLUE}Deploy user:${NC} $DEPLOY_USER"
echo -e "  ${BLUE}App dir:${NC}     /opt/aios"
echo -e "  ${BLUE}Docker:${NC}      $(docker --version)"
echo -e "  ${BLUE}Firewall:${NC}    UFW (80, 443, SSH)"
echo -e "${GREEN}─────────────────────────────────────────${NC}"
echo ""
warn "Next steps:"
echo "  1. Clone the repo: git clone <repo> /opt/aios"
echo "  2. cd /opt/aios && cp .env.example .env && nano .env"
echo "  3. docker compose up -d"
