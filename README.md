# Ability Portal

Ability Portal is the single client-facing entry point to Ability Tech's
commercial products, in the Ability Tech brand. Users sign in with the email
address and password of their client's backend, through the portal backend.
The home page then shows two animated product cards, **Community Admin** and
**Ability CRM** (on the right in both languages). A product that the sign-in
lists for the user opens its separately deployed app in the selected
language; the other card says it isn't included.

The dev portal backend doesn't answer CORS for the Portal's origin yet, so
the browser blocks the sign-in, which reports the service as unavailable. A
card is never an access decision: each product and its API enforce access
themselves.

Read `../AGENTS.md` and `../docs/MIGRATION.md` before working here.

## Local development

Requires Node.js 22.12 or newer (the Vitest 5 test runner; Next.js alone needs
20.9 or newer) and npm. Verified with Node.js 22.23.2.

From `CRM/`:

```bash
npm --prefix Ability-Portal ci
cp Ability-Portal/.env.example Ability-Portal/.env.local
npm run dev:portal   # or: npm --prefix Ability-Portal run dev
```

Open <http://localhost:9992>; `/` redirects to `/en` (or the browser's
preferred supported locale), and a signed-out visitor lands on `/en/sign-in`.
`/ar` renders right-to-left, and its cards link to the Arabic pages of each
product. To follow the links locally, run `npm run dev` from `CRM/` instead: it
starts the Portal, Ability CRM (9994), and Community Admin (9993) together (see
`../README.md`). Signing in needs the portal backend at
`NEXT_PUBLIC_PORTAL_API_URL`, with the Portal's origin in its CORS allowlist.

| Task | Command (from this directory) |
| --- | --- |
| Lint (ESLint) | `npm run lint` |
| Type check (`tsc --noEmit`) | `npm run typecheck` |
| Unit tests (Vitest) | `npm test` |
| Production build | `npm run build` |
| Production server | `npm run start` |

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

The only page is `/<locale>/sign-in` (optional `?returnTo=` from a product).
There is no forgot- or set-password page: an administrator resets a user's
password from Ability CRM's Users screen, and Ability CRM asks for a new one
at the next sign-in.

- **Sign-in from the browser:** the form calls the portal backend
  (`POST <NEXT_PUBLIC_PORTAL_API_URL>/auth/login`, e.g.
  `https://api-prd.ability-tech.com/portal/auth/login`) from the browser
  (`src/services/portalAuth.ts`). The browser itself receives the backend's
  HttpOnly `access_token` cookie, which Ability CRM's API accepts. The
  password goes only to the backend; it is never stored, logged, put in a
  URL, or sent to the Portal's server.
- **The session cookie:** the Portal's server stores the answer's `session`,
  `client`, and `platforms` in the `ability_portal_session` cookie
  (`HttpOnly`, `SameSite=Lax`, `Secure` except over plain HTTP on localhost,
  6 hours). Ability CRM and Community Admin read the same cookie, so users
  don't sign in twice.
  - The answer passes through the browser, so the cookie is display data:
    who is signed in and which products appear (`session.platforms`).
  - The products' APIs check `access_token` on every call.
- **Returning:** `returnTo` is followed only into a configured product
  destination; anything else opens the Portal home. A product that sends a
  signed-in user back gets the form again ("Your session ended"), never an
  automatic redirect.
- **Choice step:** if the backend asks to choose a client or project, the
  form says that isn't available yet.
- **Sign-out** (in the header): the browser asks the backend to clear
  `access_token`, and the Portal deletes its cookie, which also signs the
  user out of both products.

| Variable | Local value | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_PORTAL_API_URL` | the dev portal backend (`.env.local`) | The portal backend, called by the browser; public, inlined by `next build`. `https:`, or `http:` for loopback and private-network hosts |
| `SESSION_COOKIE_DOMAIN` | empty | Deployed: the parent domain shared with both products, e.g. `apps.ability-tech.com`; server-only |

The portal backend must list the Portal's origin in its CORS allowlist, with
credentials. A missing or invalid address makes sign-in report the service as
unavailable. With several instances, deployments need a stable
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`.

## Product destinations

| Variable | Card | Local value |
| --- | --- | --- |
| `NEXT_PUBLIC_CRM_APP_URL` | Ability CRM | `http://localhost:9994` |
| `NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL` | Community Admin | `http://localhost:9993` |

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

## Container

To run the app as a standalone container on a server with Docker and curl,
from this directory:

```bash
cp .env.example .env.production   # this server's values, without quotes
npm run docker:prod:update
```

| Command | What it does |
| --- | --- |
| `npm run docker:prod:update` | Builds a new image, checks it in a private preview container, then switches port 9992 to it. The running container serves until then and comes back if the new one doesn't answer. Also does the first deploy |
| `npm run docker:prod:build` | Builds the image only |
| `npm run docker:prod` | (Re)starts the container from the last image, e.g. after changing `.env.production` |
| `npm run docker:prod:logs` | Follows the container's logs |
| `npm run docker:prod:stop` | Stops and removes the container; the images stay |

- **Image:** the `Dockerfile` builds the standalone server on Node.js 22
  Alpine (`NEXT_OUTPUT=standalone`; `npm run build` keeps the regular output
  for `next start`). It runs as the unprivileged `node` user on port 3000
  inside the container.
- **Settings:** the image holds no env file (`.dockerignore`). The
  `NEXT_PUBLIC_*` lines of `.env.production` are inlined into the build, so
  the script passes them as build arguments: after changing one, run `npm run
  docker:prod:update` (`docker:prod` warns that the image still has the old
  values). The container reads the rest, `SESSION_COOKIE_DOMAIN`, when it
  starts (`docker run --env-file`). Docker reads the file literally, so write
  values without quotes; the script refuses quoted ones.
- **Readiness:** `GET /aws/health-check`, for the script's switch and the
  image's `HEALTHCHECK`.
- **Options:** `PORT` (host port, default 9992), `ENV_FILE` (default
  `.env.production`), `IMAGE` and `NAME` (default `ability-portal`),
  `STARTUP_TIMEOUT` (60 seconds), and `KEEP_RELEASES` (3), e.g.
  `PORT=8080 npm run docker:prod:update`.
- **Releases:** each image is tagged `ability-portal:<UTC time>-<commit>` and
  `ability-portal` (the last one built or deployed); the 3 newest release tags are
  kept. To go back by hand:
  `docker tag ability-portal:<older tag> ability-portal && npm run docker:prod`.
- **Network:** `docker build` downloads the npm packages and the fonts from Google Fonts.
- **Behind a load balancer or reverse proxy** that terminates HTTPS, forward
  `Host` (or `X-Forwarded-Host`) and `X-Forwarded-Proto`. The app builds the
  addresses it sends users back to from them.

## Structure

- `src/app/[locale]/page.tsx` - the product-selection page (signed-in only),
  with `actions.ts` (sign-out)
- `src/app/[locale]/components/ProductCard.tsx` - card presentation (server),
  including the "not included" state
- `src/app/[locale]/components/ProductCardSurface.tsx`,
  `ProductLaunchLink.tsx` - the card's two small client parts: pointer
  effects and the product link with its opening state
- `src/app/[locale]/components/ProductPreview.tsx` - decorative product
  miniatures
- `src/app/[locale]/components/AccountBadge.tsx`, `SignOutForm.tsx`,
  `SignOutButton.tsx` - who is signed in, and sign-out
- `src/app/[locale]/hooks/useProductCardPointer.ts`, `useProductLaunch.ts` -
  pointer tilt and spotlight; opening state
- `src/app/[locale]/types.ts`, `utils.ts` - card view model, builder, and
  screen order
- `src/app/[locale]/(auth)/sign-in/` - the sign-in page, its Server Action,
  hook, form, and types; `(auth)/_shared/` holds the fields and validation
- `src/services/portalAuth.ts` - the portal backend calls (browser; tested)
- `src/lib/signInAnswer.ts` - the sign-in answer, the cookie value, and the
  products it lists (tested)
- `src/lib/session.ts` - reads, sets, and deletes the session cookie
  (server-only)
- `src/lib/returnTo.ts`, `sessionCookie.ts`, `portalApi.ts`, `formData.ts`,
  `baseUrl.ts` - helpers (tested)
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
- `src/app/aws/health-check/route.ts` - `GET /aws/health-check` answers 200
  with `{"status":200}` for the load balancer, as in Amer CRM (no locale or
  session)
- `messages/en.json`, `messages/ar.json` - this app's translation catalogs
- `test/server-only.ts` - stands in for `server-only` in unit tests
- `Dockerfile`, `.dockerignore`, `scripts/docker.sh` - the standalone
  container and the `docker:prod:*` scripts (see [Container](#container))

Imports use the root-based alias `@/src/...` (`"@/*": ["./*"]`).

## Repository

This directory is its own Git repository, with its own `origin` remote on
GitHub (`Ability-Tech-Team`). It shares no history or remote with Amer CRM or
the other apps.
