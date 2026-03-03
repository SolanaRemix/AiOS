-- AIOS Platform – Migration 002: Plans, FeatureGates, Jobs, JobLogs, AuditLogs
-- Run with: psql $DATABASE_URL -f 002_plans_jobs.sql

-- ─── Plans ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id             TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL UNIQUE,
  display_name   TEXT        NOT NULL,
  description    TEXT,
  price_monthly  FLOAT       NOT NULL DEFAULT 0,
  price_yearly   FLOAT       NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  features       JSONB       NOT NULL DEFAULT '[]',
  limits         JSONB       NOT NULL DEFAULT '{}',
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order     INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_name      ON plans(name);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

-- ─── Feature Gates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_gates (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  plan_id     TEXT        NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature     TEXT        NOT NULL,
  value       TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, feature)
);

CREATE INDEX IF NOT EXISTS idx_feature_gates_plan_id ON feature_gates(plan_id);

-- ─── Jobs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id    TEXT        NOT NULL,
  user_id      TEXT        NOT NULL,
  project_id   TEXT,
  agent_type   TEXT        NOT NULL,
  title        TEXT,
  input        TEXT        NOT NULL,
  output       TEXT,
  model        TEXT,
  status       TEXT        NOT NULL DEFAULT 'queued',
  priority     INT         NOT NULL DEFAULT 5,
  attempts     INT         NOT NULL DEFAULT 0,
  max_attempts INT         NOT NULL DEFAULT 3,
  tokens       INT         NOT NULL DEFAULT 0,
  cost         FLOAT       NOT NULL DEFAULT 0,
  duration_ms  INT         NOT NULL DEFAULT 0,
  queue_job_id TEXT,
  error_msg    TEXT,
  scheduled_at TIMESTAMPTZ,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id  ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id    ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status     ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_agent_type ON jobs(agent_type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- ─── Job Logs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_logs (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  job_id     TEXT        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  level      TEXT        NOT NULL DEFAULT 'info',
  message    TEXT        NOT NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id     ON job_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_logs_level      ON job_logs(level);
CREATE INDEX IF NOT EXISTS idx_job_logs_created_at ON job_logs(created_at);

-- ─── Audit Logs ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  tenant_id   TEXT,
  user_id     TEXT,
  action      TEXT        NOT NULL,
  resource    TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id  ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ─── Add updated_at triggers ──────────────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['plans', 'feature_gates', 'jobs']
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
