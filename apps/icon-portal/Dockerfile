# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++

# Copy workspace configuration and package files
COPY package.json pnpm-lock.yaml ./
COPY apps/icon-portal/package.json ./apps/icon-portal/
COPY packages/core/icons/package.json ./packages/core/icons/
COPY packages/core/tokens/package.json ./packages/core/tokens/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies (monorepo)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
WORKDIR /app/apps/icon-portal
RUN pnpm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install production dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/icon-portal/package.json ./apps/icon-portal/
COPY --from=builder /app/apps/icon-portal/dist ./apps/icon-portal/dist
COPY --from=builder /app/apps/icon-portal/backend ./apps/icon-portal/backend
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/apps/icon-portal

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run using tsx (already installed in devDependencies/node_modules)
CMD ["npx", "tsx", "backend/server.ts"]
