#!/usr/bin/env sh
set -e

bunx prisma generate
bunx prisma migrate deploy
exec bun run start:prod
