# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci


FROM base AS development
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

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules

# Install dev tools
RUN apk add --no-cache git curl
RUN sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

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

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
