#!/bin/sh
set -e

# Generate Prisma client from the bind-mounted schema
echo "Generating Prisma client..."
pnpm prisma:generate

echo "Applying migrations..."
pnpm prisma:migrate:deploy

echo "Seeding database..."
npx ts-node prisma/seed.ts

echo "Seeding demo data..."
npx ts-node prisma/seed-demo.ts

exec "$@"
