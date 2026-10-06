# Ability Portal: app-level agent notes

Read `../AGENTS.md` before working here. It is the canonical guide for the
`CRM/` workspace: architecture, repository boundaries, definitions-module
conventions, sign-in, subscription, and tenant rules, and verification
requirements. This file adds app-specific facts only. If anything here seems to
conflict, `../AGENTS.md` and the user's current request take precedence. In a
standalone clone without the parent folder, get the canonical `AGENTS.md` from
the workspace instead of assuming it exists.

- **Target:** a chat started in this directory targets Ability Portal, the
  single client-facing entry point and the only sign-in page for the
  commercial products (npm package `ability-portal`, local port 3300). Do not
  change sibling apps unless the request names them.
- **Responsibility (decided 2026-10-01):** clients sign in here with an email
  address and a password, one account per client. The Portal then shows who is
  signed in, offers sign-out, and shows one card per product (Ability CRM,
  Community Admin), unlocked or locked according to the client's subscription
  and Ability-Tech's locks; an unlocked card links to the separately deployed
  app. It also has the forgot-password and set-password pages. It contains no
  CRM or community business modules and never verifies passwords or decides
  access itself. Sign-in goes to the Portal API (`../portal-api`, NestJS;
  decided 2026-10-06), which finds the client an email belongs to and signs in
  with that client's backend. The password pages still use the account service
  (contract in `../docs/ACCOUNT-SERVICE-API.md`). A card's state is
  presentation, never an access decision: each product and its API enforce
  access, including on direct entry.
- **Independence:** this app has its own manifest, lockfile, environment files,
  build output, and local Git repository. Never import runtime code from
  `../Amer-CRM`, `../Ability-CRM`, or `../Ability-Community-Admin`.
- **Status (2026-10-06):** sign-in calls the Portal API at `PORTAL_API_URL`
  (verified against the dev instance at `http://172.20.1.141:9995`). Forgot
  password and set password are implemented against the account service
  contract, but that service doesn't exist yet, so they report it as
  unavailable. Without `PORTAL_API_URL`, sign-in reports the service as
  unavailable. Do not add fake users, demo
  credentials, a sign-in that accepts any password or checks it in the
  browser, a stub or bypass, fabricated subscriptions, localStorage lock
  switches, or true-by-default access helpers. A loading, unknown, or failed
  access result never renders a product as available.
- **Session:** `src/lib/session.ts` (server-only) is the data access layer.
  The Portal API answers the login once and has no session-check endpoint, so
  a successful sign-in stores two cookies: `access_token` (the client's JWT,
  the same name and options as the products' own cookie, `Domain` from
  `SESSION_COOKIE_DOMAIN` when the request's host is inside that domain, and
  none otherwise, so one build also works when opened by IP), and `portal_session` (who signed in and their
  platforms, `src/lib/portalSession.ts`, on the Portal's host only). Both
  expire at the token's `exp`. `getCurrentSession()` (React `cache`) reads
  them: a missing token, or a token without `portal_session`, is signed out; an
  expired or unreadable token is "session ended". The Portal never verifies
  the JWT (it doesn't hold the key; `src/lib/accessToken.ts` only reads
  `exp`); the products do. Call it in each page that needs the client, not
  only in a layout. `startSession` and `endSession` set and delete both
  cookies, in Server Actions only; the Portal API's logout only clears a
  cookie in its own response, so it isn't called. Cookie options come from
  `src/lib/sessionCookie.ts`: `HttpOnly`, `SameSite=Lax`, `Path=/`, and
  `Secure` except for plain HTTP on a loopback host or a private IPv4 address
  (decided from the request's `Origin`; browsers drop `Secure` cookies set
  over HTTP). The token never reaches client components.
- **Sign-in pages** (`src/app/[locale]/(auth)/`; rules in `../AGENTS.md`):
  `noValidate` forms posting to Server Actions through `useActionState`. Fields
  are checked on the server (`(auth)/_shared/validation.ts`, mirroring the
  contract's limits) and again by the service. The email field uses
  `autocomplete="username"` (`"email"` on forgot-password); passwords use
  `"current-password"` or `"new-password"`. Any wrong email or password gets
  one generic error, and throttling shows the service's `Retry-After` in
  minutes. After a failed attempt, focus moves to the field to fix or to the
  error. When the Portal API answers `chooseClient` or `chooseProject`, the
  form shows `sign-in/components/SignInChoice.tsx` and posts again with the
  choice; `hooks/useSignInForm.ts` keeps the typed credentials in a ref for
  that second request and never returns the password in the action state. The set-password page reads the link token from the URL fragment
  (`#token=…`) in the browser, sets `Referrer-Policy: no-referrer`, and its
  language switch carries the fragment. The sign-in page passes on a
  well-formed `returnTo`, and the action follows it only into one of the
  signed-in client's platform addresses (`src/lib/returnTo.ts`); a signed-in
  client who opens the sign-in page goes to the Portal home instead, which
  prevents redirect loops. Amer CRM's login page is a visual reference only (see
  `../AGENTS.md`).
- **Service calls:** only `src/services/portalApi.ts` calls the Portal API
  (`POST {PORTAL_API_URL}/api/auth/login`, Swagger at `/docs` outside
  production), and only `src/services/accountService.ts` calls the account
  service (password pages, app credentials from
  `src/lib/accountServiceConfig.ts`). Both are server-only, follow no
  redirects, and zod-check responses; anything unexpected counts as
  "unavailable". The Portal API call sends `Accept-Language` (the page
  locale) and the client's IP address as `X-Forwarded-For` (it trusts one
  proxy hop for its rate limit), takes the token from its `Set-Cookie`, and
  waits up to 15 seconds (it waits up to 10 for each client backend). It
  maps 401 to the generic wrong-credentials error, 403 to account disabled,
  and 429 to throttling. The account service gets the IP as `X-End-User-IP`.
  Deployments must set `X-Real-IP` or `X-Forwarded-For` at their reverse
  proxy (`src/lib/endUserIp.ts`). Never log request bodies, tokens, or
  secrets.
- **Product destinations:** each client has its own deployments, so the
  addresses come from the login answer's `platforms` (`crm`,
  `community-admin`) and are kept in `portal_session`; each is a full entry
  link, opened as is. A `returnTo` may be any page on the same site (origin)
  as one of them. A listed platform is
  available; an unlisted one shows "not subscribed". Addresses are validated
  when read (`src/lib/baseUrl.ts`): an absolute `https:` URL (`http:` only for
  loopback hosts and private IPv4 addresses) without credentials, query
  string, or fragment; an optional base path is allowed. An invalid one
  renders the card as "configuration pending". Never take a destination from
  a query parameter or put tokens or credentials in product links.
- **Structure** (definitions-module responsibilities):
  - `src/app/[locale]/page.tsx`: the product-selection page. It sends
    signed-out clients to sign-in. `components/AccountBadge.tsx` shows who
    is signed in (the employee name from the login answer, and the email); `SignOutForm.tsx` and `SignOutButton.tsx` post to `actions.ts`.
  - `src/app/[locale]/components/ProductCard.tsx`: card presentation, a
    Server Component (it receives the icon component from the page); only
    available cards link. `ProductCardSurface.tsx` (pointer effects) and
    `ProductLaunchLink.tsx` (the link and its opening state) are client
    components; they take serializable props and server-rendered children,
    and must not import `productDestinations.ts` or `utils.ts` at runtime.
    `ProductPreview.tsx` draws decorative miniatures (skeleton shapes only).
  - `src/app/[locale]/hooks/`: `useProductCardPointer.ts` (writes pointer and
    tilt CSS variables, no React state) and `useProductLaunch.ts` (opening
    state; never prevents navigation).
  - `src/app/[locale]/types.ts` and `utils.ts`: the card view model, the
    builder that turns product states and validated destinations into cards
    (the state decides first), and `orderCardsForScreen` (Ability CRM stays on
    the right in both languages, so the reading order differs by direction;
    never reorder visually with CSS).
  - `src/app/[locale]/(auth)/sign-in/`, `forgot-password/`, `set-password/`:
    each with `page.tsx`, `actions.ts`, `hooks/`, `components/`, `types.ts`,
    and `schema.ts` or `utils.ts`. `(auth)/_shared/` holds the panel, fields,
    alert, submit button, and validation they share.
  - `src/components/`: `PortalShell.tsx` (header, navy hero, and footer of
    every page), `HeroBackdrop.tsx`, `highlight.tsx` (the accent in hero
    titles), `LocaleSwitcher.tsx` (the "EN | ع" toggle; it keeps the current
    page and, for set-password, the fragment through
    `FragmentPreservingLink.tsx`), and `BrandLogo.tsx` (the official logo from
    `public/brand/`, sized only through its `height` prop).
  - `src/lib/`: `session.ts`, `sessionCookie.ts`, `portalSession.ts`,
    `accessToken.ts`, `tokens.ts` (password-link tokens), `returnTo.ts`,
    `endUserIp.ts`, `formData.ts`, `portalApiConfig.ts`,
    `accountServiceConfig.ts`, `baseUrl.ts`, `productDestinations.ts`, and
    `pointer.ts` (pure tilt and click helpers). `src/services/portalApi.ts`,
    `src/services/accountService.ts`, and `src/types/account.ts` hold the
    service calls and their types.
- **Environment** (`.env.example`): `PORTAL_API_URL`, `ACCOUNT_SERVICE_URL`,
  `ACCOUNT_SERVICE_CLIENT_ID`, `ACCOUNT_SERVICE_CLIENT_SECRET`, and
  `SESSION_COOKIE_DOMAIN` are server-only and read at runtime.
  `CRM_API_URL` (optional, server-only, e.g. `http://172.20.1.141:9999`)
  turns on a diagnostic: the Ability CRM card opens `/<locale>/token-check`
  (`src/app/[locale]/token-check/`, `src/services/crmApi.ts`,
  `src/lib/cookieTravel.ts`) instead of the CRM. It calls
  `GET {CRM_API_URL}/definitions/contact-channels` from the Portal's server
  with the token (is the token valid?) and from the browser with
  `credentials: "include"` (does the cookie travel, and does CORS allow it?),
  and links on to the CRM. English only; it never shows or logs the token.
  Remove it once sign-in into the products is confirmed. Deployments with several instances need a stable
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`; behind a proxy whose host differs from
  the browser's origin, set `serverActions.allowedOrigins`.
- **Design:** the Ability Tech brand from ability-tech.com. Tokens (named
  after the site's `--at-*` variables), gradients, product accents
  (`[data-product]`: Ability CRM blue, Community Admin teal-green), fonts per
  language (Montserrat and Inter for English, Cairo for Arabic), motion, and
  the `card-active`/`card-opening` variants are in `src/app/globals.css`.
  Keep text on the teal-green gradient navy (white is only 2.6:1). The whole
  card is one click target through the link's `::after` overlay, so nothing
  between the card and its link may be positioned or transformed (the pill
  inside the link may be). Gate movement behind `motion-safe:`, keep hover
  visuals also on keyboard focus, and use `ltr:` for letter-spacing (Arabic
  is cursive). Isolate Latin names and email addresses with `<bdi>` in
  Arabic text. Fonts are fetched by `next build`/`next dev` from Google Fonts
  and served by the Portal.
- **Tests:** `npm test` runs Vitest (`vitest.config.mts`) on
  `src/**/*.test.ts`; `test/server-only.ts` stands in for `server-only`.
  Keep tests on consequential logic: destination and `returnTo` validation,
  cookie options and the session cookie format, the Portal API and account
  service clients (with a mocked `fetch`), form validation, and card states.
- **Imports** use the root-based alias `"@/*": ["./*"]`, e.g.
  `@/src/lib/productDestinations`.
- **Locales:** routing lives in `src/proxy.ts` (the Next.js 16 name for
  middleware) and `src/i18n/`. `src/app/[locale]/layout.tsx` is the root
  layout, and the request locale comes from `next/root-params`. English is the
  default; Arabic renders right-to-left. This app owns `messages/en.json` and
  `messages/ar.json`. Product links are the entry links the Portal API
  returns, used unchanged: they already carry the product's path and locale
  (e.g. `https://crm.ability-tech.com/en/dashboard/statistics`), so never
  append a locale or path to them.

Commands, from this directory (details in `README.md`; from `CRM/`,
`npm run dev:portal` or `npm run dev` for all three apps):

```bash
npm ci
cp .env.example .env.local   # product URLs and account service settings
npm run dev -- --port 3300
npm run lint
npm run typecheck
npm test
npm run build
npm run start -- --port 3300
```

Deployment: the `Dockerfile` builds the standalone server
(`output: "standalone"`) and sets every environment value in its `ENV`
block, so the server needs no `.env`. From this directory on the server:
`docker build -t ability-portal-stand-alone . && docker rm -f ability-portal-stand-alone 2>/dev/null; docker run -d --name ability-portal-stand-alone --restart unless-stopped -p 6539:6539 ability-portal-stand-alone`.

State and decisions: `../docs/MIGRATION.md`. Account service contract:
`../docs/ACCOUNT-SERVICE-API.md`.
Workspace commands: `../README.md`.

The block below is managed by Next.js: `next dev` re-adds it when it is missing
or outdated. Keep it unchanged.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
