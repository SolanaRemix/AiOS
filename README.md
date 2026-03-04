# AIOS – Enterprise AI SaaS Platform

**AIOS** is a production-ready, multi-tenant Enterprise AI SaaS platform with multi-agent orchestration, LLM federation, real-time collaboration, and comprehensive billing — all deployable via a single bootstrap script.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          AIOS Platform                          │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  apps/web    │  │  apps/mobile  │  │   apps/desktop       │ │
│  │  Next.js 15  │  │  Expo RN      │  │   Electron 35        │ │
│  └──────┬───────┘  └───────┬───────┘  └──────────┬───────────┘ │
│         └──────────────────┼──────────────────────┘            │
│                            │ REST / WebSocket                   │
│                     ┌──────┴──────┐                            │
│                     │  apps/api   │  Node.js / Express / TS    │
│                     │             │                            │
│                     │ ┌─────────┐ │  ┌─────────────────────┐  │
│                     │ │ Auth    │ │  │ LLM Federation      │  │
│                     │ │ RBAC    │ │  │ OpenAI · Claude     │  │
│                     │ │ Tenant  │ │  │ Gemini · Ollama     │  │
│                     │ └─────────┘ │  │ Azure OpenAI        │  │
│                     │ ┌─────────┐ │  └─────────────────────┘  │
│                     │ │ Agent   │ │  ┌─────────────────────┐  │
│                     │ │ Engine  │ │  │ Job Queue (Bull)    │  │
│                     │ │ (9 role)│ │  │ Redis backing       │  │
│                     │ └─────────┘ │  └─────────────────────┘  │
│                     └──────┬──────┘                            │
│                            │                                   │
│              ┌─────────────┼──────────────┐                    │
│              │             │              │                    │
│       ┌──────┴──┐   ┌──────┴──┐   ┌──────┴──┐                 │
│       │Postgres │   │  Redis  │   │ pgvector │                 │
│       │(Supabase│   │  Cache  │   │Embeddings│                 │
│       │ / Neon) │   │  Queue  │   │  Memory  │                 │
│       └─────────┘   └─────────┘   └──────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|---|---|---|
| **Web** | Next.js 15 + Tailwind + Shadcn/UI | Dashboard, IDE workspace, admin panel |
| **API** | Node.js + Express + TypeScript | REST API, auth, orchestration |
| **Mobile** | Expo 55 (React Native) | Cross-platform iOS/Android app |
| **Desktop** | Electron 35 | Native desktop wrapper |
| **Database** | PostgreSQL + pgvector | Data storage + vector embeddings |
| **Cache/Queue** | Redis + Bull | Caching, job queue |
| **Auth** | JWT + bcrypt + RBAC | Multi-tenant authentication |
| **Billing** | Stripe | Subscriptions, usage billing |
| **LLMs** | OpenAI, Anthropic, Gemini, Ollama, Azure | AI federation |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker + Docker Compose
- Git

### Option 1 – PowerShell Bootstrap (Windows/Linux/macOS)

```powershell
# Clone the repo
git clone https://github.com/SolanaRemix/AiOS.git
cd AiOS

# Run the bootstrap (dev mode)
./pipelinebootstrap.ps1

# Or production mode
./pipelinebootstrap.ps1 -Mode production

# Or full Docker mode
./pipelinebootstrap.ps1 -Mode docker
```

### Option 2 – Manual Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and database URL

# Start infrastructure (Postgres + Redis)
docker-compose up -d postgres redis

# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed initial data
npm run db:seed

# Start all services
npm run dev
```

### Option 3 – Full Docker Compose

```bash
cp .env.example .env
# Edit .env

docker-compose up --build
```

---

## Services & Ports

| Service | URL | Description |
|---|---|---|
| **Web App** | http://localhost:3000 | Next.js frontend |
| **API** | http://localhost:4000 | Express REST API |
| **API Health** | http://localhost:4000/health | Health check endpoint |
| **Prisma Studio** | http://localhost:5555 | Database GUI (dev only) |

---

## Default Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@aios.app | ChangeMe123! |
| Demo Admin | demo-admin@aios.app | Demo@12345! |
| Demo Dev | dev@aios.app | Dev@12345! |

> ⚠️ Change all passwords immediately in production.

---

## API Reference

### Authentication

```http
POST /api/auth/register   # Create account + tenant
POST /api/auth/login      # Returns { accessToken, refreshToken }
POST /api/auth/refresh    # Refresh access token
POST /api/auth/logout     # Invalidate token
GET  /api/auth/me         # Current user info
```

### Plans (public)

```http
GET  /api/plans           # List all active plans
GET  /api/plans/:id       # Get plan details + feature gates
```

### Projects

```http
GET    /api/projects           # List projects (tenant-scoped)
POST   /api/projects           # Create project
GET    /api/projects/:id       # Get project details
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Archive project
```

### Jobs (AI Task Queue)

```http
POST  /api/jobs              # Submit AI job
GET   /api/jobs              # List jobs (filterable by status, agentType)
GET   /api/jobs/:id          # Get job detail + logs
POST  /api/jobs/:id/cancel   # Cancel queued/running job
GET   /api/jobs/:id/logs     # Get job execution logs
GET   /api/jobs/stats/summary  # Aggregate stats (admin)
```

### AI Federation

```http
POST /api/federation/chat           # Chat with best-selected LLM
POST /api/federation/complete       # Text completion
GET  /api/federation/models         # List available models
POST /api/federation/select-model   # Select model for task type
```

### Billing

```http
POST /api/billing/create-subscription  # Subscribe to a plan
POST /api/billing/cancel-subscription  # Cancel subscription
GET  /api/billing/subscription         # Current subscription
GET  /api/billing/usage                # Token/cost usage
GET  /api/billing/invoices             # Invoice history
POST /api/billing/portal               # Stripe customer portal URL
POST /api/billing/webhook              # Stripe webhook (no auth)
```

---

## RBAC Roles

| Role | Permissions |
|---|---|
| `super-admin` | Full platform access |
| `admin` | Manage tenant users, projects, billing |
| `dev` | Create/manage projects, run agents |
| `user` | View projects, submit jobs |

---

## Agent Types

| Agent | Purpose |
|---|---|
| `builder` | Write production-ready code |
| `debugger` | Identify and fix bugs |
| `tester` | Generate comprehensive test suites |
| `deployment` | Create Docker/K8s/CI-CD configs |
| `refactor` | Improve code quality |
| `security` | OWASP security analysis |
| `designer` | UI/UX component generation |
| `analytics` | Data analysis and SQL |
| `devops` | Infrastructure as code |

---

## SaaS Plans

| Plan | Price/mo | Projects | Agents | Tokens/mo |
|---|---|---|---|---|
| **Free** | $0 | 3 | 1 | 10K |
| **Starter** | $29 | 10 | 5 | 100K |
| **Pro** | $99 | Unlimited | 20 | 1M |
| **Enterprise** | $499 | Unlimited | Unlimited | Unlimited |

---

## Deployment

### Docker Compose (VPS)

```bash
# Production
docker-compose -f docker-compose.yml up -d

# With dev hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

### Vercel (Web Frontend)

```bash
cd apps/web
npx vercel --prod
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<32+ char secret>
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
```

---

## Development

```bash
# Install all workspace deps
npm install

# Run all services in dev mode (with turbo)
npm run dev

# Run API only
npm run dev --workspace=apps/api

# Run Web only  
npm run dev --workspace=apps/web

# Type check
npm run build --workspace=apps/api  # tsc
cd apps/web && npx tsc --noEmit

# Run tests
npm run test

# Lint
npm run lint
```

---

## Project Structure

```
AiOS/
├── apps/
│   ├── api/              # Express/TypeScript backend
│   │   ├── src/
│   │   │   ├── config/   # DB, Redis, Logger
│   │   │   ├── middleware/ # Auth, RBAC, FeatureGate, TenantIsolation
│   │   │   ├── routes/   # REST endpoints
│   │   │   └── services/ # Business logic
│   │   └── prisma/       # Schema, migrations, seed
│   ├── web/              # Next.js 15 frontend
│   ├── mobile/           # Expo React Native
│   └── desktop/          # Electron wrapper
├── k8s/                  # Kubernetes manifests
├── scripts/              # Deploy, backup, setup scripts
├── Dockerfile.api
├── Dockerfile.web
├── docker-compose.yml
├── nginx.conf
└── pipelinebootstrap.ps1
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a Pull Request

CI will run lint, type checks, and tests automatically.

---

## License

[LICENSE](LICENSE)
