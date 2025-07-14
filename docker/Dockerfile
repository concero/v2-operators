# Stage 1: Builder
FROM oven/bun:canary-debian AS builder
LABEL stage=app-builder

WORKDIR /app

# Install esbuild to use globally (docker on macos throws error because of architecture differences of esbuild package)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && npm install -g esbuild

COPY package.json bun.lockb* ./

COPY prisma ./prisma

RUN bun install

# Copy the rest of the application code to the container
COPY . .

RUN esbuild src/relayer-a/index.ts --bundle --platform=node --target=node22 --outdir=dist --format=esm

RUN bunx prisma generate --schema=prisma/schema.prisma

# Stage 2: Runner
FROM oven/bun:canary-debian AS runner

WORKDIR /app

# Create a non-root user and set permissions
RUN groupadd -r bunuser && useradd -r -g bunuser bunuser && \
    chown -R bunuser:bunuser /app

# Switch to a non-root user
USER bunuser

# Copy only necessary files from the builder stage
COPY --from=builder --chown=bunuser:bunuser /app/dist /app/dist
COPY --from=builder --chown=bunuser:bunuser /app/node_modules /app/node_modules
COPY --from=builder --chown=bunuser:bunuser /app/package.json /app/
COPY --from=builder --chown=bunuser:bunuser /app/prisma /app/prisma

# Expose any necessary ports (if needed)
# EXPOSE 3000

# Start the application
CMD ["bun", "./dist/index.js"]
