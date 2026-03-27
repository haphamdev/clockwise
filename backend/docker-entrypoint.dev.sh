#!/bin/sh
set -e

# Generate Prisma client from the bind-mounted schema
echo "Generating Prisma client..."
pnpm prisma:generate

exec "$@"
