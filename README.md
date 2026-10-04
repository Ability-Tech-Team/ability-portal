# Ability Portal

Ability Portal is the single client-facing entry point to Ability Tech's
commercial products, in the Ability Tech brand. Clients sign in with an email
address and a password (one account per client). The home page then shows two
animated product cards, **Community Admin** and **Ability CRM** (on the right
in both languages). A product in the client's subscription opens its
separately deployed app in the selected language; the other card shows why it
is locked.

The account service behind the sign-in is built by Ability-Tech's backend
team to `../docs/ACCOUNT-SERVICE-API.md`. It doesn't exist yet: until it runs,
the sign-in page reports the service as unavailable. A card is never an access
decision: each product and its API enforce access themselves.

Read `../AGENTS.md` and `../docs/MIGRATION.md` before working here.

## Local development

Requires Node.js 22.12 or newer (the Vitest 5 test runner; Next.js alone needs
20.9 or newer) and npm. Verified with Node.js 22.23.2.

From `CRM/`:

```bash
npm --prefix Ability-Portal ci
cp Ability-Portal/.env.example Ability-Portal/.env.local
npm run dev:portal   # or: npm --prefix Ability-Portal run dev -- --port 3300
```

Open <http://localhost:3300>; `/` redirects to `/en` (or the browser's
preferred supported locale), and a signed-out visitor lands on `/en/sign-in`.
`/ar` renders right-to-left, and its cards link to the Arabic pages of each
product. To follow the links locally, run `npm run dev` from `CRM/` instead: it
starts the Portal, Ability CRM (3100), and Community Admin (3200) together (see
`../README.md`). Signing in needs the account service running at
`ACCOUNT_SERVICE_URL`.

| Task | Command (from this directory) |
| --- | --- |
| Lint (ESLint) | `npm run lint` |
| Type check (`tsc --noEmit`) | `npm run typecheck` |
| Unit tests (Vitest) | `npm test` |
| Production build | `npm run build` |
| Production server | `npm run start -- --port 3300` |

`npm run build` (and `npm run dev`) downloads the Ability Tech web fonts
(Montserrat, Inter, and Cairo) from Google Fonts through `next/font`, so the
build machine needs network access to Google Fonts. Browsers then load the
fonts from the Portal itself; the page makes no third-party requests.

## Design and motion

The Portal uses the Ability Tech brand from <https://www.ability-tech.com/>
(colors, gradients, fonts, logo, and tagline), not Amer CRM branding.

- **Brand assets:** the official logo (the "A" mark above the wordmark) in
  color and white, copied from the site into `public/brand/`, and
  shown through `src/components/BrandLogo.tsx` (white in dark mode and on
  navy). `src/app/icon.png` and `apple-icon.png` are the "A" mark, cut from
  the site's full logo.
- **Tokens** live in `src/app/globals.css` and follow the site's `--at-*`
  names: navy `#002144`/`#00153c`, blue `#0167ad`, cyan `#0bc1b9`, teal
  `#13b3b0`, green `#4bd66b`, and the brand, accent, cool, deep, and rule
  gradients. Product accents: Ability CRM in blue, Community Admin in the
  teal-to-green accent (`[data-product]`, with dark-mode values). Text on the
  teal-green gradient is navy, because the site's white-on-teal is only
  2.6:1; `#6cb4ea` and `#087f7b` are added tints for readable text.
- **Type:** Montserrat headings and Inter text in English, Cairo in Arabic,
  chosen per language in `globals.css`. The eyebrow is the site's tagline,
  "Ability Through Technology" / "قدرات أكبر بفضل التقنية".
- **Layout:** a white header with the logo, "Portal", and an "EN | ع" toggle; a
  navy hero band; two cards that overlap it; and a navy footer. Ability CRM
  is on the right in both languages (the user's choice): its card is read and
  focused second in English and first in Arabic, and on phones the cards
  stack in that reading order (`orderCardsForScreen` in `utils.ts`).
  Light and dark follow the system setting.
- **Cards:** hovering a card, or focusing its link with the keyboard, lifts it,
  lights its edge and a spotlight in the product color, animates its
  miniature illustration, fills its button with the product gradient, and
  fades the other card's contents. A mouse also tilts the card gently toward
  the pointer (at most 5°). Following a card shows "Opening …" with a spinner
  and a light around the card until the product loads; the state clears on
  Back or after 10 seconds. Modified clicks (new tab or window) never show it.
- **Accessibility:** decorative layers are hidden from assistive technology,
  and the card draws a visible focus ring. With "reduce motion" turned on,
  nothing moves: hover and focus keep their color feedback, but there is no
  entrance, drifting background, lift, tilt, or illustration movement. Hover
  effects apply only on devices that can hover.
- The illustrations show skeleton shapes only, never names, numbers, or
  other data.

## Sign-in and sessions

| Page | Path |
| --- | --- |
| Sign in | `/<locale>/sign-in` (optional `?returnTo=` from a product) |
| Forgot password | `/<locale>/forgot-password` |
| Set password (invitation or reset link) | `/<locale>/set-password#token=…` |

- The forms post to Server Actions, which call the account service from the
  server. Passwords are never stored, logged, or put in URLs.
- After sign-in, the Portal stores the service's session token in the
  `ability_session` cookie (`HttpOnly`, `SameSite=Lax`, `Secure` except over
  plain HTTP on localhost). Ability CRM and Community Admin read the same
  cookie, so clients don't sign in twice. Every page checks the session with
  the service, so sign-out, locks, and ended subscriptions apply at once.
- `returnTo` is followed only into a configured product destination;
  anything else opens the Portal home.
- Sign-out (in the header) ends the session in the service and deletes the
  cookie, which also signs the client out of both products.

| Variable | Local value | Purpose |
| --- | --- | --- |
| `ACCOUNT_SERVICE_URL` | `http://localhost:3400` | The account service (server-only) |
| `ACCOUNT_SERVICE_CLIENT_ID` | `ability-portal` | The Portal's app credentials, issued by the backend team |
| `ACCOUNT_SERVICE_CLIENT_SECRET` | from the backend team | Keep it in `.env.local`; never commit it |
| `SESSION_COOKIE_DOMAIN` | empty | Deployed: the parent domain shared with both products, e.g. `apps.ability-tech.com` |

The server reads these when it starts; they are never sent to the browser. A
missing or invalid value is logged by name, and sign-in then reports the
service as unavailable. Deployments need a reverse proxy that sets
`X-Real-IP` or `X-Forwarded-For` (used for the service's rate limits) and,
with several instances, a stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.

## Product destinations

| Variable | Card | Local value |
| --- | --- | --- |
| `NEXT_PUBLIC_CRM_APP_URL` | Ability CRM | `http://localhost:3100` |
| `NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL` | Community Admin | `http://localhost:3200` |

- These are public navigation settings, not secrets and not access decisions.
  `.env.example` is tracked; `.env.local` and other `.env*` files are ignored.
- Next.js inlines `NEXT_PUBLIC_*` values when you run `npm run build`. A built
  portal keeps the values it was built with, so build each environment with
  its own values. `npm run dev` reads them when the server starts. Values set
  in the shell take precedence over `.env*` files, and `.env.local` also
  applies to local production builds.
- Each value must be an absolute `https://` URL. `http://` is accepted only for
  `localhost`, `*.localhost`, `127.x.x.x`, and `[::1]`. Credentials, query
  strings, and fragments are rejected. An optional base path is allowed, for
  example `https://apps.example.com/crm`.
- A missing or invalid value shows that card as "Configuration pending",
  without a link. The server logs a warning naming the variable and the
  problem, without the value.
- The portal appends only the locale (`/en` or `/ar`) to the configured URL. It
  never takes a destination from the request URL or query string and never
  adds tokens or credentials to links.
- The same destinations limit where the sign-in page may return a client.

Example production build (placeholder hosts):

```bash
NEXT_PUBLIC_CRM_APP_URL=https://crm.example.com \
NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL=https://community-admin.example.com \
npm run build
```

## Structure

- `src/app/[locale]/page.tsx` - the product-selection page (signed-in only),
  with `actions.ts` (sign-out)
- `src/app/[locale]/components/ProductCard.tsx` - card presentation (server),
  including the locked states
- `src/app/[locale]/components/ProductCardSurface.tsx`,
  `ProductLaunchLink.tsx` - the card's two small client parts: pointer
  effects and the product link with its opening state
- `src/app/[locale]/components/ProductPreview.tsx` - decorative product
  miniatures
- `src/app/[locale]/components/AccountBadge.tsx`, `SignOutForm.tsx`,
  `SignOutButton.tsx`, `AccessCheckFailed.tsx` - who is signed in, sign-out,
  and the error shown when the service doesn't answer
- `src/app/[locale]/hooks/useProductCardPointer.ts`, `useProductLaunch.ts` -
  pointer tilt and spotlight; opening state
- `src/app/[locale]/types.ts`, `utils.ts` - card view model, builder, and
  screen order
- `src/app/[locale]/(auth)/sign-in/`, `forgot-password/`, `set-password/` -
  the sign-in pages, each with its page, Server Action, hook, form, and
  types; `(auth)/_shared/` holds their shared fields and validation
- `src/lib/session.ts` - reads, checks, sets, and deletes the session cookie
  (server-only)
- `src/services/accountService.ts` - the account service calls (server-only)
- `src/lib/returnTo.ts`, `sessionCookie.ts`, `tokens.ts`, `endUserIp.ts`,
  `formData.ts`, `accountServiceConfig.ts`, `baseUrl.ts` - helpers (tested)
- `src/lib/productDestinations.ts` - destination parsing, validation, and links
- `src/lib/pointer.ts` - pure tilt and click helpers (tested)
- `src/components/PortalShell.tsx`, `HeroBackdrop.tsx` - the frame of every
  page: header, navy hero, and footer
- `src/components/LocaleSwitcher.tsx` - the "EN | ع" language toggle
- `src/components/BrandLogo.tsx` - the official Ability Tech logo
- `src/app/globals.css` - Ability Tech tokens, product accents, fonts per
  language, motion, and the `card-active` / `card-opening` variants
- `src/app/icon.png`, `src/app/apple-icon.png` - favicon and home-screen icon
  (the "A" mark)
- `public/brand/` - the official logo files from ability-tech.com
- `src/proxy.ts`, `src/i18n/` - locale routing, navigation, request config
- `messages/en.json`, `messages/ar.json` - this app's translation catalogs
- `test/server-only.ts` - stands in for `server-only` in unit tests

Imports use the root-based alias `@/src/...` (`"@/*": ["./*"]`).

## Repository

This directory is its own local Git repository, with no remote yet. It shares
no history or remote with Amer CRM or the other apps.
