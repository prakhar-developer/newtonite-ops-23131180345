# Multi-stage Dockerfile for instOS
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl python3 make g++

# Copy package descriptors and prisma schema
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY prisma ./prisma/

# Install dependencies and build shared workspace package
RUN npm install

COPY packages/shared ./packages/shared
RUN npx prisma generate

# Copy source code and build frontend
COPY . .
RUN npm run build:web

# -------------------------------------------------------------
# Runner Stage
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl curl

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app /app

EXPOSE 4000

# Push schema, seed deterministic data, and start server
CMD ["sh", "-c", "npx prisma db push && npm run db:seed && npx tsx apps/api/src/server.ts"]
