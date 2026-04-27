-- Migration: Add social features, prompt marketplace, and payments
-- Social profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio         TEXT,
  avatar      TEXT,
  website     TEXT,
  twitter     TEXT,
  github      TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);

-- Social follow graph
CREATE TABLE IF NOT EXISTS follows (
  id           TEXT PRIMARY KEY,
  follower_id  TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);

-- Prompt marketplace
CREATE TABLE IF NOT EXISTS prompts (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  description TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  category    TEXT NOT NULL DEFAULT 'general',
  visibility  TEXT NOT NULL DEFAULT 'private',
  price       FLOAT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  view_count  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id   ON prompts (user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_tenant_id ON prompts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_prompts_visibility ON prompts (visibility);
CREATE INDEX IF NOT EXISTS idx_prompts_category  ON prompts (category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts (created_at DESC);

-- Prompt likes
CREATE TABLE IF NOT EXISTS prompt_likes (
  id         TEXT PRIMARY KEY,
  prompt_id  TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prompt_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt ON prompt_likes (prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user   ON prompt_likes (user_id);

-- Payments (multi-provider)
CREATE TABLE IF NOT EXISTS payments (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  provider    TEXT NOT NULL,
  external_id TEXT UNIQUE,
  amount      FLOAT NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'usd',
  status      TEXT NOT NULL DEFAULT 'pending',
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_id  ON payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id    ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider   ON payments (provider);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments (created_at DESC);
