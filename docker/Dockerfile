########################
# Stage 1: Builder
########################
FROM oven/bun:1.1.30-debian AS builder
WORKDIR /app

COPY package.json bun.lockb* ./
COPY prisma ./prisma
RUN bun install

COPY src ./src
COPY tsconfig.json ./
RUN bun run build

########################
# Stage 2: Runner
########################
FROM oven/bun:1.1.30-debian AS runner
WORKDIR /app

COPY ./docker/entrypoint.sh /app/entrypoint.sh
RUN chmod 0755 /app/entrypoint.sh

RUN groupadd -r bunuser && useradd -r -g bunuser bunuser && \
    mkdir -p /app/logs && chown -R bunuser:bunuser /app && chmod -R 755 /app/logs
USER bunuser

COPY --from=builder --chown=bunuser:bunuser /app/dist          /app/dist
COPY --from=builder --chown=bunuser:bunuser /app/node_modules   /app/node_modules
COPY --from=builder --chown=bunuser:bunuser /app/package.json   /app/
COPY --from=builder --chown=bunuser:bunuser /app/prisma         /app/prisma

COPY --chown=bunuser:bunuser ./rpc.extensions.json /app/
COPY --chown=bunuser:bunuser ./rpc.overrides.json /app/

ENV NODE_ENV=production \
    DATABASE_URL=file:/app/data/concero.sqlite
ENTRYPOINT ["/app/entrypoint.sh"]
