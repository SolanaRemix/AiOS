-- Migration: Add social features, prompt marketplace, and payments
-- Social profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio         TEXT,
  avatar      TEXT,
  website     TEXT,
  twitter     TEXT,
  github      TEXT,
  "isPublic"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_userId ON user_profiles ("userId");

-- Social follow graph
CREATE TABLE IF NOT EXISTS follows (
  id            TEXT PRIMARY KEY,
  "followerId"  TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  "followingId" TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("followerId", "followingId")
);

CREATE INDEX IF NOT EXISTS idx_follows_followerId  ON follows ("followerId");
CREATE INDEX IF NOT EXISTS idx_follows_followingId ON follows ("followingId");

-- Prompt marketplace
CREATE TABLE IF NOT EXISTS prompts (
  id           TEXT PRIMARY KEY,
  "userId"     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tenantId"   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  description  TEXT,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  category     TEXT NOT NULL DEFAULT 'general',
  visibility   TEXT NOT NULL DEFAULT 'private',
  price        FLOAT NOT NULL DEFAULT 0,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "viewCount"  INT NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompts_userId    ON prompts ("userId");
CREATE INDEX IF NOT EXISTS idx_prompts_tenantId  ON prompts ("tenantId");
CREATE INDEX IF NOT EXISTS idx_prompts_visibility ON prompts (visibility);
CREATE INDEX IF NOT EXISTS idx_prompts_category  ON prompts (category);
CREATE INDEX IF NOT EXISTS idx_prompts_createdAt ON prompts ("createdAt" DESC);

-- Prompt likes
CREATE TABLE IF NOT EXISTS prompt_likes (
  id          TEXT PRIMARY KEY,
  "promptId"  TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  "userId"    TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("promptId", "userId")
);

CREATE INDEX IF NOT EXISTS idx_prompt_likes_promptId ON prompt_likes ("promptId");
CREATE INDEX IF NOT EXISTS idx_prompt_likes_userId   ON prompt_likes ("userId");

-- Payments (multi-provider)
CREATE TABLE IF NOT EXISTS payments (
  id           TEXT PRIMARY KEY,
  "tenantId"   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "userId"     TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  provider     TEXT NOT NULL,
  "externalId" TEXT UNIQUE,
  amount       FLOAT NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'usd',
  status       TEXT NOT NULL DEFAULT 'pending',
  metadata     JSONB NOT NULL DEFAULT '{}',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenantId  ON payments ("tenantId");
CREATE INDEX IF NOT EXISTS idx_payments_userId    ON payments ("userId");
CREATE INDEX IF NOT EXISTS idx_payments_provider  ON payments (provider);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_createdAt ON payments ("createdAt" DESC);

