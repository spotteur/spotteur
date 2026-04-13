# syntax=docker/dockerfile:1

ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

ARG NPM_CONFIG_REGISTRY
ENV NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY}

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
apt-get install -y --no-install-recommends curl ca-certificates && \
rm -rf /var/lib/apt/lists/*

RUN sh -c "$(curl -fsSL https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

COPY package.json package-lock.json ./
RUN npm ci


FROM deps AS development
WORKDIR /app

ARG NPM_CONFIG_REGISTRY
ENV NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY}

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

ARG NPM_CONFIG_REGISTRY
ENV NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY}

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /usr/local/bin/task /usr/local/bin
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM base AS production-script-runner
LABEL org.opencontainers.image.source=https://github.com/spotteur/spotteur
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /usr/local/bin/task /usr/local/bin
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove unused dependencies to reduce image size (could save up to ~35%)
RUN rm -rf /opt/yarn-* \
    node_modules/@next \
    node_modules/@react-email \
    node_modules/lucide-react \
    node_modules/monaco-editor \
    node_modules/next \
    node_modules/prettier \
    node_modules/prettier-plugin-tailwindcss
RUN npm cache clean --force

CMD ["/bin/sh", "-c", "echo 'This image is meant to be used as a base for running scripts. Please set the command to run your script.' && exit 1"]

FROM node:${NODE_VERSION}-alpine AS production
LABEL org.opencontainers.image.source=https://github.com/spotteur/spotteur
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
