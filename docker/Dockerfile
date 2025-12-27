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
COPY .env* ./
COPY src ./src
COPY tsconfig.json package.json ./


RUN bun run build

FROM oven/bun:1.1-slim AS runtime

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=deps /app/prisma ./prisma

COPY package.json bun.lockb* ./
COPY .env* ./


CMD ["echo", "started"]