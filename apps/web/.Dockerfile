FROM node:22-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat

ARG PORT=3000
ENV PORT=${PORT}

ARG NEXT_PUBLIC_HTTP_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_HTTP_URL=${NEXT_PUBLIC_HTTP_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

WORKDIR /app

FROM base AS prepare
RUN corepack enable
RUN npm i -g turbo

COPY . .
RUN turbo prune web --docker

FROM base AS builder
COPY --from=prepare /app/out/json .

RUN corepack enable
RUN CI=true pnpm install --frozen-lockfile

COPY --from=prepare /app/out/full .
RUN pnpm turbo build --filter=web

FROM base AS runner 
RUN addgroup -S -g 1001 nodejs
RUN adduser -S -u 1001 express
RUN addgroup express nodejs

COPY --from=builder --chown=express:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=express:nodejs /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder --chown=express:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=express:nodejs /app/package.json ./package.json
COPY --from=builder --chown=express:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=express:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN corepack enable
RUN pnpm install --frozen-lockfile

RUN cd packages/db && pnpm exec prisma generate


COPY --from=builder --chown=express:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=express:nodejs /app/packages/db/dist ./packages/db/dist

USER express
WORKDIR /app/apps/web


CMD ["pnpm", "start"]