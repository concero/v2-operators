# --------------------
# deps
# --------------------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN apk add --no-cache git
RUN npm install --force


# --------------------
# build
# --------------------
FROM deps AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY src ./src
COPY .env* tsconfig.json package-lock.json ./

RUN npm run build


# --------------------
# runtime
# --------------------
FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=build /app/dist ./dist

COPY package.json ./
COPY .env* ./

CMD ["echo", "success"]