# Database Schema

## Overview

AIOS uses **PostgreSQL** with the **pgvector** extension for vector embeddings and **pgcrypto** for encrypted secrets.

Database access is via **Prisma ORM** with connection pooling.

---

## Models

### Tenant

Multi-tenant root entity. Every user, project, and resource belongs to a tenant.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (cuid) | Primary key |
| `name` | TEXT | Display name |
| `slug` | TEXT | URL-safe unique identifier |
| `plan` | TEXT | free / starter / pro / enterprise |
| `status` | TEXT | active / suspended / cancelled |
| `metadata` | JSON | Extensible tenant metadata |

---

### User

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT | Primary key |
| `tenantId` | TEXT | FK → Tenant |
| `email` | TEXT | Unique |
| `password` | TEXT | bcrypt hashed |
| `role` | TEXT | super-admin / admin / dev / user |

---

### Project

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT | Primary key |
| `tenantId` | TEXT | FK → Tenant |
| `userId` | TEXT | FK → User (owner) |
| `name` | TEXT | |
| `status` | TEXT | active / archived / draft |

---

### Plan

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT | e.g. "plan-free" |
| `name` | TEXT | Unique slug: free / starter / pro / enterprise |
| `displayName` | TEXT | |
| `priceMonthly` | FLOAT | |
| `priceYearly` | FLOAT | |
| `features` | JSON | Array of feature strings |
| `limits` | JSON | { max_projects, max_agents, tokensPerMonth } |

---

### FeatureGate

Per-plan feature limits.

| Column | Type | Notes |
|---|---|---|
| `planId` | TEXT | FK → Plan |
| `feature` | TEXT | e.g. "max_projects", "federation" |
| `value` | TEXT | "3", "true", "false", "unlimited" |

---

### Job

AI task orchestration job.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT | Primary key |
| `tenantId` | TEXT | FK → Tenant |
| `agentType` | TEXT | builder / debugger / etc. |
| `input` | TEXT | Task description |
| `output` | TEXT | Generated result |
| `status` | TEXT | queued / running / completed / failed / cancelled |
| `priority` | INT | 1 (high) – 10 (low) |
| `tokens` | INT | Tokens consumed |
| `cost` | FLOAT | USD cost |
| `durationMs` | INT | Execution time in ms |

---

### JobLog

Execution log entries per job.

| Column | Type | Notes |
|---|---|---|
| `jobId` | TEXT | FK → Job |
| `level` | TEXT | info / warn / error / debug |
| `message` | TEXT | |
| `metadata` | JSON | |

---

### AgentLog

Historical record of agent executions (legacy/direct agent calls).

| Column | Type | Notes |
|---|---|---|
| `tenantId` | TEXT | |
| `agentType` | TEXT | |
| `input` | TEXT | |
| `output` | TEXT | |
| `model` | TEXT | |
| `tokens` | INT | |
| `cost` | FLOAT | |
| `status` | TEXT | |

---

### Billing

Stripe subscription record per tenant.

| Column | Type | Notes |
|---|---|---|
| `tenantId` | TEXT | FK → Tenant (unique) |
| `stripeCustomerId` | TEXT | |
| `stripeSubscriptionId` | TEXT | |
| `plan` | TEXT | Current plan |
| `status` | TEXT | active / inactive / past_due / cancelling |
| `currentPeriodEnd` | DATETIME | |

---

### Secret

AES-256-GCM encrypted tenant secrets (API keys, credentials).

| Column | Type | Notes |
|---|---|---|
| `tenantId` | TEXT | |
| `key` | TEXT | e.g. "OPENAI_API_KEY" |
| `encryptedValue` | TEXT | Encrypted ciphertext |

---

### VectorEmbedding

pgvector embeddings for agent memory and semantic search.

| Column | Type | Notes |
|---|---|---|
| `tenantId` | TEXT | |
| `projectId` | TEXT | |
| `content` | TEXT | Original text |
| `embedding` | vector(1536) | pgvector column |
| `metadata` | JSON | |

---

### AuditLog

Immutable audit trail for security and compliance.

| Column | Type | Notes |
|---|---|---|
| `tenantId` | TEXT | |
| `userId` | TEXT | |
| `action` | TEXT | e.g. "user.login", "billing.upgrade" |
| `resource` | TEXT | e.g. "project:abc123" |
| `ipAddress` | TEXT | |

---

## Migrations

| File | Description |
|---|---|
| `001_init.sql` | Initial schema (tenants, users, projects, billing, secrets, vectors) |
| `002_plans_jobs.sql` | Plans, FeatureGates, Jobs, JobLogs, AuditLogs |

Run manually:
```bash
psql $DATABASE_URL -f apps/api/prisma/migrations/001_init.sql
psql $DATABASE_URL -f apps/api/prisma/migrations/002_plans_jobs.sql
```

Or use Prisma:
```bash
npm run db:migrate
```

---

## Vector Search

The `vector_embeddings` table uses an HNSW index for efficient nearest-neighbour search:

```sql
CREATE INDEX ON vector_embeddings USING hnsw (embedding vector_cosine_ops);
```

Query example (find similar documents):
```sql
SELECT content, metadata
FROM vector_embeddings
WHERE tenant_id = $1
ORDER BY embedding <=> $2  -- cosine similarity
LIMIT 10;
```
