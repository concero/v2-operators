FROM oven/bun:1.1 AS deps

WORKDIR /app
COPY package.json bun.lock* ./
COPY /prisma ./prisma

RUN bun install

FROM deps AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps bun.lock* ./prisma
COPY --from=deps /app/prisma ./prisma
COPY tsconfig.json package.json ./

RUN bun build

FROM oven/bun:1.1-slim AS runtime

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

COPY package.json bun.lockb* ./
COPY envs/${ENVIRONMENT} ./envs/${ENVIRONMENT}

CMD ["sh", "-c", "echo '✅ Container ready! To run: bun run dist/apps/<service>/main.js'; sleep infinity"]
