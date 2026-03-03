# Deployment Guide

## Docker Compose (Recommended for VPS)

### 1. Prepare the server

```bash
# Run the VPS setup script (installs Docker, configures firewall)
bash scripts/setup-vps.sh
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with production values:
# - DATABASE_URL (Supabase / Neon / your Postgres)
# - REDIS_URL
# - JWT_SECRET (32+ chars, cryptographically random)
# - ENCRYPTION_KEY (64 hex chars)
# - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
# - LLM API keys
```

### 3. Deploy

```bash
docker-compose up -d --build
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed
```

### 4. Configure Nginx + TLS

Update `nginx.conf` with your domain, then:
```bash
certbot --nginx -d yourdomain.com
```

---

## Kubernetes

```bash
# 1. Apply namespace and resource quotas
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets
kubectl create secret generic aios-secrets \
  --from-env-file=.env \
  -n aios

# 3. Deploy infrastructure
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/redis-deployment.yaml

# 4. Deploy applications
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/web-deployment.yaml

# 5. Configure ingress + TLS
kubectl apply -f k8s/ingress.yaml

# 6. Enable autoscaling
kubectl apply -f k8s/hpa.yaml
```

---

## Vercel (Web Frontend Only)

```bash
cd apps/web
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` → your API URL

---

## CI/CD (GitHub Actions)

Workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | Push / PR | Lint, type-check, test, build Docker |
| `deploy.yml` | Push to `main` | Build, push to GHCR, deploy to VPS |
| `security.yml` | Push / Weekly | CodeQL, npm audit, Trivy scan |

### Required Secrets (GitHub repository settings)

```
VPS_HOST          SSH host of your VPS
VPS_USER          SSH username
VPS_SSH_KEY       Private SSH key
VPS_DEPLOY_PATH   e.g. /opt/aios
GHCR_TOKEN        GitHub token with packages:write
CODECOV_TOKEN     (optional) for coverage reports
```

---

## Environment Variables Reference

See [`.env.example`](../.env.example) for the complete list.

### Required for production

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL URL (for migrations) |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Min 32 chars random string |
| `JWT_REFRESH_SECRET` | Min 32 chars random string |
| `ENCRYPTION_KEY` | 64 hex chars (AES-256 key) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### LLM API Keys (at least one required)

| Variable | Provider |
|---|---|
| `OPENAI_API_KEY` | OpenAI GPT-4 / GPT-mini |
| `ANTHROPIC_API_KEY` | Anthropic Claude |
| `GOOGLE_AI_API_KEY` | Google Gemini |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI |
| `OLLAMA_BASE_URL` | Local Ollama instance |
