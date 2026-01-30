# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app



ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
apt-get install -y --no-install-recommends curl ca-certificates && \
rm -rf /var/lib/apt/lists/*

RUN sh -c "$(curl -fsSL https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

COPY package.json package-lock.json ./
RUN npm ci


FROM deps AS development
WORKDIR /app

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
ARG NEXT_PUBLIC_NOVU_APP_IDENTIFIER
ARG NEXT_PUBLIC_NOVU_BACKEND_URL
ARG NEXT_PUBLIC_NOVU_WS_URL
ARG NOVU_SECRET_KEY
ARG BETTER_AUTH_SECRET
ARG S3_ENDPOINT
ARG TEMPORAL_ADDRESS

ENV NEXT_PUBLIC_NOVU_APP_IDENTIFIER=${NEXT_PUBLIC_NOVU_APP_IDENTIFIER}
ENV NEXT_PUBLIC_NOVU_BACKEND_URL=${NEXT_PUBLIC_NOVU_BACKEND_URL}
ENV NEXT_PUBLIC_NOVU_WS_URL=${NEXT_PUBLIC_NOVU_WS_URL}
ENV NOVU_SECRET_KEY=${NOVU_SECRET_KEY}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV S3_ENDPOINT=${S3_ENDPOINT}
ENV TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS}

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install dev tools
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

# Install dev dependencies
RUN npm install
COPY . .

EXPOSE 3000
EXPOSE 3001
EXPOSE 3002

CMD ["npm", "run", "dev"]


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
ARG NEXT_PUBLIC_NOVU_APP_IDENTIFIER
ARG NEXT_PUBLIC_NOVU_BACKEND_URL
ARG NEXT_PUBLIC_NOVU_WS_URL
ARG NOVU_SECRET_KEY
ARG BETTER_AUTH_SECRET
ARG S3_ENDPOINT
ARG TEMPORAL_ADDRESS

ENV NEXT_PUBLIC_NOVU_APP_IDENTIFIER=${NEXT_PUBLIC_NOVU_APP_IDENTIFIER}
ENV NEXT_PUBLIC_NOVU_BACKEND_URL=${NEXT_PUBLIC_NOVU_BACKEND_URL}
ENV NEXT_PUBLIC_NOVU_WS_URL=${NEXT_PUBLIC_NOVU_WS_URL}
ENV NOVU_SECRET_KEY=${NOVU_SECRET_KEY}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV S3_ENDPOINT=${S3_ENDPOINT}
ENV TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS}

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /usr/local/bin/task /usr/local/bin
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:${NODE_VERSION}-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
