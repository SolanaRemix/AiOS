# AiOS Deployment Guide

Production deployment guide for the AiOS platform.

---

## Prerequisites

Ensure the following are available before deploying:

| Dependency | Minimum Version | Notes |
|---|---|---|
| Node.js | 18.x | 20.x recommended |
| npm | 9.x | Included with Node.js |
| PostgreSQL | 16+ | pgvector extension required for memory features |
| Redis | 7+ | Used for caching, pub/sub, and job queues |
| Docker | 24+ | Required for Docker-based deployment |
| Docker Compose | 2.x | Required for `docker-compose.yml` workflow |

---

## Environment Variables Reference

Copy `.env.example` to `.env` and populate all required values.

### Core

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `PORT` | No | API server port (default: `3001`) |
| `WEB_PORT` | No | Web frontend port (default: `3000`) |

### Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (`postgresql://user:pass@host:5432/dbname`) |
| `DATABASE_POOL_MIN` | No | Minimum DB connection pool size (default: `2`) |
| `DATABASE_POOL_MAX` | No | Maximum DB connection pool size (default: `10`) |

### Redis

| Variable | Required | Description |
|---|---|---|
| `REDIS_URL` | Yes | Redis connection URL (`redis://localhost:6379`) |
| `REDIS_TLS` | No | Enable TLS for Redis (`true`/`false`, default: `false`) |

### Authentication

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | Yes | Secret key for JWT signing (min 32 chars, use a random secret in prod) |
| `JWT_ACCESS_EXPIRES` | No | Access token expiry (default: `15m`) |
| `JWT_REFRESH_EXPIRES` | No | Refresh token expiry (default: `7d`) |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key for encrypting secrets at rest |

### LLM Providers

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Conditional | Required if using OpenAI models |
| `ANTHROPIC_API_KEY` | Conditional | Required if using Anthropic models |
| `GROQ_API_KEY` | Conditional | Required if using Groq models |
| `OLLAMA_BASE_URL` | Conditional | Required if using local Ollama (default: `http://localhost:11434`) |
| `DEFAULT_MODEL` | No | Fallback model (default: `gpt-4o-mini`) |

### Tool Configuration

| Variable | Required | Description |
|---|---|---|
| `WEB_SEARCH_API_KEY` | Conditional | Required for the `web_search` tool |
| `WEB_SEARCH_PROVIDER` | No | Search provider: `serper`, `brave`, `serpapi` |
| `FILE_WORKSPACE_ROOT` | No | Directory for agent file I/O (default: `/tmp/aios-workspaces`) |

---

## Docker Deployment

The recommended production deployment method is Docker Compose.

### `docker-compose.yml` Explained

The provided `docker-compose.yml` defines the following services:

| Service | Image | Description |
|---|---|---|
| `api` | `./Dockerfile.api` | Express.js API server |
| `web` | `./Dockerfile.web` | Next.js frontend |
| `postgres` | `pgvector/pgvector:pg16` | PostgreSQL with pgvector |
| `redis` | `redis:7-alpine` | Redis cache and pub/sub broker |
| `nginx` | `nginx:alpine` | Reverse proxy (terminates SSL, routes to api/web) |

### Start All Services

```bash
# Build images and start in background
docker compose up -d --build

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f api
```

### Stop All Services

```bash
docker compose down

# Also remove volumes (WARNING: deletes all data)
docker compose down -v
```

### Environment in Docker

When using Docker Compose, set environment variables via a `.env` file in the project root. Docker Compose automatically loads `.env`:

```bash
cp .env.example .env
# Edit .env with your values
docker compose up -d
```

---

## Manual Deployment Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build All Packages

```bash
npm run build
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

### 4. Seed Development Data (optional)

```bash
npm run db:seed
```

### 5. Start the API Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run start
```

### 6. Start the Web Frontend

In a separate terminal (or configure a process manager like PM2):

```bash
cd apps/web
npm run start
```

### PM2 Process Manager (Recommended for VPS)

```bash
npm install -g pm2

# Start both services
pm2 start ecosystem.config.js

# Auto-start on server reboot
pm2 startup
pm2 save
```

Example `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'aios-api',
      cwd: './apps/api',
      script: 'dist/index.js',
      env_production: { NODE_ENV: 'production', PORT: 3001 },
    },
    {
      name: 'aios-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      env_production: { NODE_ENV: 'production', PORT: 3000 },
    },
  ],
};
```

---

## Database Migration

AiOS uses Prisma for schema management. All migration files are in `apps/api/prisma/migrations/`.

```bash
# Apply all pending migrations
npm run db:migrate

# Create a new migration (development only)
npx prisma migrate dev --name your_migration_name

# Reset database (development only — DELETES ALL DATA)
npx prisma migrate reset

# Open Prisma Studio (GUI for inspecting data)
npx prisma studio
```

### pgvector Setup

Long-term memory requires the `pgvector` PostgreSQL extension. Run this once on a fresh database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This is handled automatically by `npm run db:migrate` if the migration includes the extension creation.

---

## Monitoring and Health Checks

### Health Check Endpoint

```
GET /health
```

Returns:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "llm": "ok"
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

Docker Compose and Kubernetes are both configured to use this endpoint for liveness and readiness probes.

### Metrics (Prometheus)

```
GET /metrics
```

Exposes Prometheus-format metrics for scraping. Configure your Prometheus instance to scrape this endpoint:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'aios-api'
    static_configs:
      - targets: ['aios-api:3001']
    scrape_interval: 15s
```

Key metrics to monitor:

| Metric | Alert Threshold |
|---|---|
| `aios_active_processes` | > 100 concurrent agents |
| `aios_agent_duration_seconds_p99` | > 30s |
| `aios_llm_tokens_total` (rate) | Per your provider budget |
| `process_heap_used_bytes` | > 1.5 GB |
| `http_request_duration_seconds_p99` | > 2s |

### Logging

AiOS uses structured JSON logging. Logs are written to stdout and should be collected by your logging infrastructure (CloudWatch, Datadog, Loki, etc.):

```json
{
  "level": "info",
  "message": "Agent execution completed",
  "agentName": "research-agent",
  "processId": "proc_abc123",
  "durationMs": 2340,
  "tokensUsed": 1024,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

Log level is controlled by the `LOG_LEVEL` environment variable (`debug`, `info`, `warn`, `error`).

---

## Kubernetes Deployment

Kubernetes manifests are located in the `k8s/` directory. The setup includes:

- `k8s/api-deployment.yaml` — API server Deployment and Service
- `k8s/web-deployment.yaml` — Web frontend Deployment and Service
- `k8s/ingress.yaml` — Ingress controller configuration (nginx)
- `k8s/configmap.yaml` — Non-secret environment configuration
- `k8s/secrets.yaml` — Template for Kubernetes Secrets (do not commit actual values)
- `k8s/hpa.yaml` — Horizontal Pod Autoscaler for the API tier

### Quick Start

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n aios

# View API server logs
kubectl logs -l app=aios-api -n aios -f
```

### Secrets Management

Never commit actual secrets to `k8s/secrets.yaml`. Use one of:

- **Kubernetes Secrets** with a secret management tool (Sealed Secrets, External Secrets Operator)
- **AWS Secrets Manager** or **GCP Secret Manager** via CSI driver
- **HashiCorp Vault** with the Vault Agent Injector

---

## Scaling Recommendations

### API Server

The API server is stateless and can be scaled horizontally. Start with 2 replicas for high availability.

```yaml
# k8s/hpa.yaml
spec:
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Database

- Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, Supabase) for production
- Enable read replicas for read-heavy workloads
- Configure PgBouncer for connection pooling under high concurrency

### Redis

- Use a managed Redis service (AWS ElastiCache, Upstash) for production
- Enable Redis persistence (AOF) to survive restarts without data loss
- For very high throughput, use Redis Cluster mode

### Worker Tier

Heavy agent workloads (long research runs, batch automation) can be offloaded to a dedicated worker tier:

```bash
# Start a dedicated worker process
NODE_ROLE=worker npm run start
```

Workers consume jobs from the BullMQ queue and can be scaled independently from the API tier.
