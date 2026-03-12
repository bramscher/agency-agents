# Railway Dockerfile — builds the configurator with agent files baked in
# (Railway has no volume mounts, so everything must be in the image)

# --- Stage 1: Install dependencies ---
FROM node:22-alpine AS deps
WORKDIR /app/configurator

COPY configurator/package.json configurator/package-lock.json ./
RUN npm ci --ignore-scripts

# --- Stage 2: Build ---
FROM node:22-alpine AS builder
WORKDIR /app/configurator

COPY --from=deps /app/configurator/node_modules ./node_modules
COPY configurator/ .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Stage 3: Production image ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV AGENT_ROOT=/app/agents

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone Next.js output
COPY --from=builder /app/configurator/.next/standalone ./configurator/
COPY --from=builder /app/configurator/.next/static ./configurator/.next/static
COPY --from=builder /app/configurator/public ./configurator/public

# Copy agent markdown files into the image
COPY design/ /app/agents/design/
COPY engineering/ /app/agents/engineering/
COPY game-development/ /app/agents/game-development/
COPY marketing/ /app/agents/marketing/
COPY paid-media/ /app/agents/paid-media/
COPY product/ /app/agents/product/
COPY project-management/ /app/agents/project-management/
COPY spatial-computing/ /app/agents/spatial-computing/
COPY specialized/ /app/agents/specialized/
COPY strategy/ /app/agents/strategy/
COPY support/ /app/agents/support/
COPY testing/ /app/agents/testing/

USER nextjs

EXPOSE 3000

CMD ["node", "configurator/server.js"]
