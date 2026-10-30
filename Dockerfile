# Two images from one build: `web` (Next.js standalone server) and `schema` (drizzle-kit, to push
# the schema before a rollout). Built by CI, see .github/workflows/ci.yml.
ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm fetch
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --offline --frozen-lockfile

FROM deps AS build
# Public variables are inlined at build time; everything else is read at run time.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
# `next build` prerenders pages from the database (Cache Components), so it needs DATABASE_URL:
# a BuildKit secret, never a layer, reached through `--network host` (CI port-forwards to the
# cluster, see .github/workflows/ci.yml). Source maps go to PostHog when its personal key is
# given; SKIP_POSTHOG=true skips the upload.
ARG SKIP_POSTHOG=false
ENV SKIP_ENV_VALIDATION=1 NEXT_TELEMETRY_DISABLED=1 DATABASE_DRIVER=node-postgres
COPY . .
RUN --mount=type=secret,id=DATABASE_URL --mount=type=secret,id=POSTHOG_API_KEY \
    DATABASE_URL="$(cat /run/secrets/DATABASE_URL)" \
    POSTHOG_API_KEY="$(cat /run/secrets/POSTHOG_API_KEY 2>/dev/null || true)" \
    pnpm build

FROM ${NODE_IMAGE} AS web
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]

# drizzle-kit with the schema and its imports; nothing else from the app.
FROM deps AS schema
COPY drizzle.config.ts tsconfig.json ./
COPY src/env.ts src/load-env.ts ./src/
COPY src/db ./src/db
COPY drizzle ./drizzle
ENV SKIP_ENV_VALIDATION=1
USER node
CMD ["pnpm", "exec", "drizzle-kit", "push", "--force"]
