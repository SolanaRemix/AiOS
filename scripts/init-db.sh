#!/usr/bin/env bash
# =============================================================================
# init-db.sh – Initialize PostgreSQL with pgvector extension
# Runs automatically via docker-entrypoint-initdb.d
# =============================================================================
set -euo pipefail

DB="${POSTGRES_DB:-aios_prod}"
USER="${POSTGRES_USER:-postgres}"

echo "▶ Initializing database: $DB"

psql -v ON_ERROR_STOP=1 --username "$USER" --dbname "$DB" <<-EOSQL
    -- Enable pgvector for AI embeddings
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Enable other useful extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS btree_gin;

    -- Verify
    SELECT extname, extversion FROM pg_extension
    WHERE extname IN ('vector', 'uuid-ossp', 'pg_trgm', 'btree_gin');
EOSQL

echo "✔ Database initialized successfully"
