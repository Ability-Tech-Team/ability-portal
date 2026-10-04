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
  access itself: the account service does both (backend team; contract in
  `../docs/ACCOUNT-SERVICE-API.md`). A card's state is presentation, never an
  access decision: each product and its API enforce access, including on
  direct entry.
- **Independence:** this app has its own manifest, lockfile, environment files,
  build output, and local Git repository. Never import runtime code from
  `../Amer-CRM`, `../Ability-CRM`, or `../Ability-Community-Admin`.
- **Status (2026-10-01):** sign-in, sign-out, forgot password, set password,
  the shared session cookie, and the per-client card states are implemented
  and were verified against a contract stand-in; the account service itself
  doesn't exist yet. Without it, or without the `ACCOUNT_SERVICE_*` settings,
  sign-in reports the service as unavailable. Do not add fake users, demo
  credentials, a sign-in that accepts any password or checks it in the
  browser, a stub or bypass, fabricated subscriptions, localStorage lock
  switches, or true-by-default access helpers. A loading, unknown, or failed
  access result never renders a product as available.
- **Session** (contract, section 7): `src/lib/session.ts` (server-only) is the
  data access layer. `getCurrentSession()` checks the `ability_session` cookie
  with the account service once per render (React `cache`); call it in each
  page that needs the client, not only in a layout. `startSession` and
  `endSession` set and delete the cookie, in Server Actions only. The options
  come from `src/lib/sessionCookie.ts`: `HttpOnly`, `SameSite=Lax`, `Path=/`,
  `Secure` except for plain HTTP on a loopback host (decided from the request's
  `Origin`), and `Domain` from `SESSION_COOKIE_DOMAIN`. The token never reaches
  client components.
- **Sign-in pages** (`src/app/[locale]/(auth)/`; rules in `../AGENTS.md`):
  `noValidate` forms posting to Server Actions through `useActionState`. Fields
  are checked on the server (`(auth)/_shared/validation.ts`, mirroring the
  contract's limits) and again by the service. The email field uses
  `autocomplete="username"` (`"email"` on forgot-password); passwords use
  `"current-password"` or `"new-password"`. Any wrong email or password gets
  one generic error, and throttling shows the service's `Retry-After` in
  minutes. After a failed attempt, focus moves to the field to fix or to the
  error. The set-password page reads the link token from the URL fragment
  (`#token=…`) in the browser, sets `Referrer-Policy: no-referrer`, and its
  language switch carries the fragment. `returnTo` is followed only into a
  configured product destination (`src/lib/returnTo.ts`); a signed-in client
  who opens the sign-in page goes to the Portal home instead, which prevents
  redirect loops. Amer CRM's login page is a visual reference only (see
  `../AGENTS.md`).
- **Account service calls:** only `src/services/accountService.ts`
  (server-only) calls the service, with the app credentials from
  `src/lib/accountServiceConfig.ts`, a 5-second timeout for session checks and
  10 seconds otherwise, no redirects, and zod-checked responses; anything
  outside the contract counts as "unavailable". It forwards the client's IP
  address as `X-End-User-IP` (`src/lib/endUserIp.ts`), so deployments must set
  `X-Real-IP` or `X-Forwarded-For` at their reverse proxy. Never log request
  bodies, tokens, or secrets.
- **Product destinations:** `NEXT_PUBLIC_CRM_APP_URL` and
  `NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL` are read only in
  `src/lib/productDestinations.ts`, with literal `process.env.NEXT_PUBLIC_*`
  access so that Next.js inlines them at build time. They are validated there
  (rules in `src/lib/baseUrl.ts`): an absolute `https:` URL (`http:` only for
  loopback hosts) without credentials, query string, or fragment; an optional
  base path is allowed. Anything else renders an available product's card as
  "configuration pending". Never take a destination from a query parameter or
  put tokens or credentials in product links.
- **Structure** (definitions-module responsibilities):
  - `src/app/[locale]/page.tsx`: the product-selection page. It sends
    signed-out clients to sign-in and shows `components/AccessCheckFailed.tsx`
    when the service can't answer. `components/AccountBadge.tsx` shows who is
    signed in; `SignOutForm.tsx` and `SignOutButton.tsx` post to `actions.ts`.
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
  - `src/lib/`: `session.ts`, `sessionCookie.ts`, `tokens.ts`, `returnTo.ts`,
    `endUserIp.ts`, `formData.ts`, `accountServiceConfig.ts`, `baseUrl.ts`,
    `productDestinations.ts`, and `pointer.ts` (pure tilt and click helpers).
    `src/services/accountService.ts` and `src/types/account.ts` hold the
    account service calls and their types.
- **Environment** (`.env.example`): the product destinations above are
  inlined at build time. `ACCOUNT_SERVICE_URL`, `ACCOUNT_SERVICE_CLIENT_ID`,
  `ACCOUNT_SERVICE_CLIENT_SECRET`, and `SESSION_COOKIE_DOMAIN` are server-only
  and read at runtime. Deployments with several instances need a stable
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
  cookie options, the account service client against the contract (with a
  mocked `fetch`), form validation, and card states.
- **Imports** use the root-based alias `"@/*": ["./*"]`, e.g.
  `@/src/lib/productDestinations`.
- **Locales:** routing lives in `src/proxy.ts` (the Next.js 16 name for
  middleware) and `src/i18n/`. `src/app/[locale]/layout.tsx` is the root
  layout, and the request locale comes from `next/root-params`. English is the
  default; Arabic renders right-to-left. This app owns `messages/en.json` and
  `messages/ar.json`. Product links keep the selected locale for products that
  route under `/en` and `/ar`.

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
