# Stage 1: Builder
FROM oven/bun:canary-debian AS builder
WORKDIR /app

# 1) Dependencies first for better caching
COPY package.json bun.lockb* ./
COPY prisma ./prisma

# Install deps (postinstall is disabled, so no host Prisma gen happens)
RUN bun install --frozen-lockfile

# Copy the rest of the source (host node_modules are ignored by .dockerignore)
COPY . .

# Build
RUN bunx esbuild src/index.ts --bundle --platform=node --target=node22 --outdir=dist --format=esm

# Stage 2: Runner
FROM oven/bun:canary-debian AS runner
WORKDIR /app

# Ensure libssl exists in the runtime image
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r bunuser && useradd -r -g bunuser bunuser && chown -R bunuser:bunuser /app
USER bunuser

# Bring in build artifacts + deps
COPY --from=builder --chown=bunuser:bunuser /app/dist /app/dist
COPY --from=builder --chown=bunuser:bunuser /app/node_modules /app/node_modules
COPY --from=builder --chown=bunuser:bunuser /app/package.json /app/
COPY --from=builder --chown=bunuser:bunuser /app/prisma /app/prisma

# Generate Prisma client for THIS image/arch/openssl
RUN rm -rf /app/node_modules/.prisma && \
    bunx prisma generate --schema=prisma/schema.prisma

CMD ["bun", "./dist/index.js"]
