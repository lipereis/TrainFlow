#!/bin/sh
set -eu

# Railway/Supabase: DATABASE_URL (pooled) + DIRECT_URL (direct) required by Prisma.
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required (Supabase PostgreSQL connection string)" >&2
  exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

echo "Running prisma migrate deploy..."
pnpm --filter @trainflow/db exec prisma migrate deploy

echo "Starting API..."
exec node apps/api/dist/main.js
