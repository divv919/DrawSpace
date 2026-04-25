FROM node:22-alpine AS base
RUN apk update 
RUN apk add --no-cache libc6-compat

ARG PORT=8080
ENV PORT={PORT}

WORKDIR /app

FROM base AS prepare 
COPY . .
RUN corepack enable
RUN npm i -g turbo
RUN turbo prune ws-backend --docker

FROM base AS builder
COPY --from=prepare  /app/out/json . 

RUN corepack enable
RUN CI=true pnpm install --frozen-lockfile

COPY --from=prepare /app/out/full .
RUN pnpm turbo build --filter=ws-backend

FROM base AS runner
RUN addgroup -S -g 1001 nodejs
RUN adduser -S -u 1001 ws
RUN addgroup ws nodejs

# Copy package files first
COPY --from=builder --chown=ws:nodejs /app/apps/ws-backend/package.json ./apps/ws-backend/package.json
COPY --from=builder --chown=ws:nodejs /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder --chown=ws:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=ws:nodejs /app/packages/common/package.json ./packages/common/package.json
COPY --from=builder --chown=ws:nodejs /app/package.json ./package.json
COPY --from=builder --chown=ws:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=ws:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml



# Not installing again as we can just copy the installed node_modules form builder
RUN corepack enable
# RUN pnpm install --frozen-lockfile

COPY --from=builder --chown=ws:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ws:nodejs /app/packages/db/node_modules ./packages/db/node_modules

RUN cd packages/db && pnpm exec prisma generate


COPY --from=builder --chown=ws:nodejs /app/apps/ws-backend/dist ./apps/ws-backend/dist
COPY --from=builder --chown=ws:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=ws:nodejs /app/packages/common/dist ./packages/common/dist

USER ws
WORKDIR /app/apps/ws-backend

CMD ["node", "dist/index.js"]