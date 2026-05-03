# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL="postgresql://mealplanner:mealplanner@localhost:5432/mealplanner?schema=public" \
  AUTH_SECRET="build-secret" \
  AUTH_URL="http://localhost:3000" \
  AUTH_TRUST_HOST="true" \
  AUTH_ALLOWED_EMAILS="build@example.com" \
  AUTH_GOOGLE_ID="build" \
  AUTH_GOOGLE_SECRET="build" \
  AUTH_MICROSOFT_ENTRA_ID_ID="build" \
  AUTH_MICROSOFT_ENTRA_ID_SECRET="build" \
  AUTH_MICROSOFT_ENTRA_ID_ISSUER="https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0" \
  npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
