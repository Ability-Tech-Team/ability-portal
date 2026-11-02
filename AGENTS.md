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
  commercial products (npm package `ability-portal`, local port 9992). Do not
  change sibling apps unless the request names them.
- **Responsibility (decided 2026-11-01; rules in `../AGENTS.md`):** users
  sign in here with the email and password of their client's backend,
  through the portal backend. The Portal then shows who is signed in, offers
  sign-out, and shows one card per product (Ability CRM, Community Admin),
  open or "not included" according to the sign-in's `session.platforms`; an
  open card links to the separately deployed app. It contains no CRM or
  community business modules, never verifies passwords, and never decides
  access: the portal backend checks passwords, and each product and its API
  enforce access, including on direct entry. There is no forgot- or
  set-password page (administrators reset passwords from Ability CRM).
- **Independence:** this app has its own manifest, lockfile, environment files,
  build output, and local Git repository. Never import runtime code from
  `../Amer-CRM`, `../Ability-CRM`, or `../Ability-Community-Admin`.
- **Status (2026-11-01):** sign-in through the portal backend, sign-out, the
  `ability_portal_session` cookie, and the card states are implemented and
  were checked end to end against contract stand-ins (again on 2026-11-02,
  with production's `/portal` routes). Neither the dev nor the production
  portal backend answers CORS for the Portal's origin yet, so a real sign-in
  is blocked by the browser and reports the service as unavailable; behind
  that, both answer 404 for real accounts (`../docs/MIGRATION.md`, problem 22). Do not add
  fake users, demo credentials, a sign-in that accepts any password or checks
  it in the browser, a stub or bypass, fabricated products, localStorage
  switches, or true-by-default access helpers. A missing or unknown product
  list never renders a product as available.
- **Sign-in** (`src/app/[locale]/(auth)/sign-in/`):
  - `hooks/useSignInForm.ts` runs in the browser: it checks the fields
    (`schema.ts`, with the backend's limits from `(auth)/_shared/validation.ts`),
    calls `src/services/portalAuth.ts#signIn`, then the Server Action
    `actions.ts#completeSignIn` with the answer (never the password).
  - `src/services/portalAuth.ts`: the only calls to the portal backend
    (`POST <NEXT_PUBLIC_PORTAL_API_URL>/auth/login` and `/auth/logout`; the
    value includes the backend's `/portal` prefix), from the browser with
    `credentials: 'include'`, so the browser receives the backend's HttpOnly
    `access_token`. 401 and 422 are wrong credentials, 429 is throttling (with
    `Retry-After` when exposed), a `step` other than `done` is a client or
    project choice (not offered yet), and anything else, including a CORS
    block, is "unavailable".
  - `completeSignIn` checks the answer (`src/lib/signInAnswer.ts`), stores it,
    and redirects to `returnTo` (only a configured product destination,
    `src/lib/returnTo.ts`) or the Portal home. The answer passes through the
    browser, so it is display data only.
  - The page sends a signed-in user to the Portal home, unless a product sent
    them back (`returnTo`): then the form shows "Your session ended", so
    nothing loops.
  - `noValidate` form through `useActionState`; the email field uses
    `autocomplete="username"`, the password `"current-password"`. Any wrong
    email or password gets one generic error. After a failed attempt, focus
    moves to the field to fix or to the error. Amer CRM's login page is a
    visual reference only (see `../AGENTS.md`).
- **Session** (`src/lib/session.ts`, server-only; `src/lib/signInAnswer.ts`):
  - `getCurrentSession()` reads `ability_portal_session` once per render
    (React `cache`); call it in each page that needs the user.
  - `startSession` and `endSession` set and delete it, in Server Actions only.
    The value is base64url JSON of the answer's `session`, `client`, and
    `platforms`, with the same rules Ability CRM and Community Admin parse
    (keep them in step), at most 4,000 characters.
  - Options come from `src/lib/sessionCookie.ts`: `HttpOnly`, `SameSite=Lax`,
    `Path=/`, `Secure` except for plain HTTP on a loopback host (decided from
    the request's `Origin`), `Domain` from `SESSION_COOKIE_DOMAIN`, and 6
    hours (the `access_token` lifetime).
  - Sign-out (`components/SignOutForm.tsx`): the browser calls the backend's
    logout (best effort), then `actions.ts#signOut` deletes the cookie.
- **Product destinations:** `NEXT_PUBLIC_CRM_APP_URL` and
  `NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL` are read only in
  `src/lib/productDestinations.ts`, with literal `process.env.NEXT_PUBLIC_*`
  access so that Next.js inlines them at build time. They are validated there
  (rules in `src/lib/baseUrl.ts`): an absolute `https:` URL (`http:` only for
  loopback hosts) without credentials, query string, or fragment; an optional
  base path is allowed. Anything else renders an available product's card as
  "configuration pending". The sign-in answer's `platforms[].url` is not used.
  Never take a destination from a query parameter or put tokens or
  credentials in product links.
- **Structure** (definitions-module responsibilities):
  - `src/app/[locale]/page.tsx`: the product-selection page. It sends
    signed-out users to sign-in. `components/AccountBadge.tsx` shows who is
    signed in and their organization; `SignOutForm.tsx` and
    `SignOutButton.tsx` sign out.
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
    builder that turns product access and validated destinations into cards
    (access decides first), and `orderCardsForScreen` (Ability CRM stays on
    the right in both languages, so the reading order differs by direction;
    never reorder visually with CSS).
  - `src/app/[locale]/(auth)/sign-in/`: `page.tsx`, `actions.ts`, `hooks/`,
    `components/`, `types.ts`, `schema.ts`, and `utils.ts`. `(auth)/_shared/`
    holds the panel, fields, alert, submit button, and validation.
  - `src/components/`: `PortalShell.tsx` (header, navy hero, and footer of
    every page), `HeroBackdrop.tsx`, `highlight.tsx` (the accent in hero
    titles), `LocaleSwitcher.tsx` (the "EN | ع" toggle; it keeps the current
    page), and `BrandLogo.tsx` (the official logo from `public/brand/`, sized
    only through its `height` prop).
  - `src/lib/`: `session.ts`, `sessionCookie.ts`, `signInAnswer.ts`,
    `portalApi.ts`, `returnTo.ts`, `formData.ts`, `baseUrl.ts`,
    `productDestinations.ts`, and `pointer.ts` (pure tilt and click helpers).
    `src/services/portalAuth.ts` holds the portal backend calls.
- **Environment** (`.env.example`): `NEXT_PUBLIC_PORTAL_API_URL` (the portal
  backend, which the browser calls; `http:` also allowed for private-network
  dev hosts) and the product destinations are public and inlined at build
  time. `SESSION_COOKIE_DOMAIN` is server-only and read at runtime. The portal
  backend must list the Portal's origin in its CORS allowlist. Deployments
  with several instances need a stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`;
  behind a proxy whose host differs from the browser's origin, set
  `serverActions.allowedOrigins`.
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
- **Container** (README.md, Container): `Dockerfile` (the standalone server,
  built with `NEXT_OUTPUT=standalone`; `next.config.ts` keeps the regular
  output otherwise), `.dockerignore` (no env file enters the image), and
  `scripts/docker.sh`, run by `npm run docker:prod:update`, `docker:prod`,
  `docker:prod:build`, `docker:prod:logs`, and `docker:prod:stop`. The
  container reads `.env.production` when it starts and is ready when
  `/aws/health-check` answers. Its `NEXT_PUBLIC_*` lines are build arguments,
  inlined at build time, so changing one needs `docker:prod:update`. Reading the scripts doesn't authorize
  running them; Docker isn't installed on the development Mac.
- **Tests:** `npm test` runs Vitest (`vitest.config.mts`) on
  `src/**/*.test.ts`; `test/server-only.ts` stands in for `server-only`.
  Keep tests on consequential logic: destination and `returnTo` validation,
  cookie options, the sign-in answer and the cookie value, the portal backend
  client (with a mocked `fetch`), form validation, and card states.
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
cp .env.example .env.local   # product URLs and the portal backend
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

State and decisions: `../docs/MIGRATION.md`.
Workspace commands: `../README.md`.

The block below is managed by Next.js: `next dev` re-adds it when it is missing
or outdated. Keep it unchanged.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
