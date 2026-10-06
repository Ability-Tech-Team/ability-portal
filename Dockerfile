# syntax=docker/dockerfile:1.7
#
# Ability Portal. Build and run on the server (from this directory):
#
#   docker build -t ability-portal-stand-alone . && docker rm -f ability-portal-stand-alone 2>/dev/null; docker run -d --name ability-portal-stand-alone --restart unless-stopped -p 6539:6539 ability-portal-stand-alone
#
# The configuration is set below, so the server needs no .env file. The build
# downloads the web fonts from Google Fonts, so it needs internet access.

ARG NODE_VERSION=22.12.0

FROM node:${NODE_VERSION}-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=6539 \
    HOSTNAME=0.0.0.0 \
    TZ=Africa/Cairo \
    # Sign-in: the Portal API (portal-api).
    PORTAL_API_URL=http://172.20.1.141:9995 \
    # Diagnostic: while set, the Ability CRM card opens /<locale>/token-check,
    # which calls this CRM API with the access token. Set it to "" to link
    # straight to the CRM.
    CRM_API_URL=http://172.20.1.141:9999 \
    # Forgot password and set password: the account service (not built yet).
    ACCOUNT_SERVICE_URL=http://localhost:3400 \
    ACCOUNT_SERVICE_CLIENT_ID=ability-portal \
    ACCOUNT_SERVICE_CLIENT_SECRET= \
    # Shared with crm.ability-tech.com and the other products. Applied only
    # when the Portal is opened under this domain; opened by IP, the cookie
    # stays on that host.
    SESSION_COOKIE_DOMAIN=ability-tech.com

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 6539

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:6539/en/sign-in',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
