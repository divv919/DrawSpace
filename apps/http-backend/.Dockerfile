FROM node:22-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat

ARG PORT=3001
ENV PORT=${PORT}

WORKDIR /app

FROM base AS prepare
COPY . .
RUN corepack enable
RUN npm i -g turbo
RUN turbo prune http-backend --docker

FROM base AS builder
COPY --from=prepare  /app/out/json . 
COPY --from=prepare /app/out/full .

RUN corepack enable
RUN  CI=true pnpm install --frozen-lockfile

RUN pnpm turbo build --filter=http-backend

FROM base AS runner
RUN addgroup -S -g 1001 nodejs
RUN adduser -S -u 1001 express

# Copy package files first
COPY --from=builder --chown=express:nodejs /app/apps/http-backend/package.json ./apps/http-backend/package.json
COPY --from=builder --chown=express:nodejs /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder --chown=express:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=express:nodejs /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder --chown=express:nodejs /app/package.json ./package.json
COPY --from=builder --chown=express:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=express:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Install all dependencies (need prisma CLI for generate)
RUN corepack enable
RUN pnpm install --frozen-lockfile

# Generate Prisma client with fresh install paths
RUN cd packages/db && pnpm exec prisma generate

# Now copy the built code
COPY --from=builder --chown=express:nodejs /app/apps/http-backend/dist ./apps/http-backend/dist
COPY --from=builder --chown=express:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=express:nodejs /app/packages/common/dist ./packages/common/dist

USER express
WORKDIR /app/apps/http-backend


CMD ["node", "dist/index.js"]