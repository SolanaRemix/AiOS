-- AIOS Platform – Initial Database Migration
-- Run with: psql $DATABASE_URL -f 001_init.sql

-- ─── Extensions ────────────────────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"    SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto"     SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector"       SCHEMA extensions;

-- ─── Tenants ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  plan        TEXT        NOT NULL DEFAULT 'free',
  status      TEXT        NOT NULL DEFAULT 'active',
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug   ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ─── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id   TEXT        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'user',
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);

-- ─── Projects ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id   TEXT        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     TEXT        NOT NULL REFERENCES users(id),
  name        TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'active',
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id   ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status    ON projects(status);

-- ─── Agent Logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_logs (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id   TEXT        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id  TEXT        REFERENCES projects(id) ON DELETE SET NULL,
  agent_type  TEXT        NOT NULL,
  input       TEXT        NOT NULL DEFAULT '',
  output      TEXT        NOT NULL DEFAULT '',
  model       TEXT        NOT NULL DEFAULT '',
  tokens      INTEGER     NOT NULL DEFAULT 0,
  cost        NUMERIC(12,6) NOT NULL DEFAULT 0,
  duration    INTEGER     NOT NULL DEFAULT 0,
  status      TEXT        NOT NULL DEFAULT 'pending',
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_tenant_id  ON agent_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_project_id ON agent_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_type ON agent_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status     ON agent_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at DESC);

-- ─── Usage ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage (
  id          TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id   TEXT          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     TEXT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model       TEXT          NOT NULL,
  tokens      INTEGER       NOT NULL DEFAULT 0,
  cost        NUMERIC(12,6) NOT NULL DEFAULT 0,
  date        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_tenant_id ON usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_id   ON usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_date      ON usage(date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_model     ON usage(model);

-- ─── Billing ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing (
  id                       TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id                TEXT        NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id       TEXT        UNIQUE,
  stripe_subscription_id   TEXT        UNIQUE,
  plan                     TEXT        NOT NULL DEFAULT 'free',
  status                   TEXT        NOT NULL DEFAULT 'inactive',
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_stripe_customer_id     ON billing(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_stripe_subscription_id ON billing(stripe_subscription_id);

-- ─── Secrets ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS secrets (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id       TEXT        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key             TEXT        NOT NULL,
  encrypted_value TEXT        NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_secrets_tenant_id ON secrets(tenant_id);

-- ─── Vector Embeddings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vector_embeddings (
  id          TEXT                     PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id   TEXT                     NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id  TEXT                     REFERENCES projects(id) ON DELETE SET NULL,
  content     TEXT                     NOT NULL,
  embedding   extensions.vector(1536),
  metadata    JSONB                    NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vector_embeddings_tenant_id  ON vector_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_project_id ON vector_embeddings(project_id);
-- HNSW index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_hnsw
  ON vector_embeddings
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── updated_at trigger function ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['tenants','users','projects','agent_logs','billing','secrets']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$s;
       CREATE TRIGGER trg_%1$s_updated_at
       BEFORE UPDATE ON %1$s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl
    );
  END LOOP;
END;
$$;
