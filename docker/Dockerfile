# Stage 1: Builder
FROM oven/bun:canary-debian AS builder
LABEL stage=app-builder

WORKDIR /app

COPY package.json bun.lockb* ./

#COPY prisma ./prisma

RUN bun install --ignore-scripts

# Copy the rest of the application code to the container
COPY . .

RUN bun run build

# Stage 2: Runner
FROM oven/bun:canary-debian AS runner

WORKDIR /app

# Create a non-root user and set permissions
RUN groupadd -r bunuser && useradd -r -g bunuser bunuser && \
    mkdir -p /app/logs && \
    chown -R bunuser:bunuser /app && \
    chmod -R 755 /app/logs

# Switch to a non-root user
USER bunuser

# Copy files from the builder stage
COPY --from=builder --chown=bunuser:bunuser /app/dist /app/dist
COPY --from=builder --chown=bunuser:bunuser /app/node_modules /app/node_modules
COPY --from=builder --chown=bunuser:bunuser /app/package.json /app/

# Copy RPC_MANAGER configuration files
COPY --from=builder --chown=bunuser:bunuser /app/rpc.extensions.json /app/
COPY --from=builder --chown=bunuser:bunuser /app/rpc.overrides.json /app/

#COPY --from=builder --chown=bunuser:bunuser /app/prisma /app/prisma

CMD ["bun", "run", "start:prod"]
