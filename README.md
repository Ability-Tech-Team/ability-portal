# Ability Portal

Ability Portal is the single client-facing entry point to Ability-Tech's
commercial products. Its page shows two product cards, **Ability CRM** and
**Community Admin**, and each card opens that product's separately deployed
app in the selected language.

This app is currently a **foundation**. Sign-in, purchased-product locking, and
employee access states are not implemented yet, so both cards open each
product's public start page, and the page says so. The pending identity and
entitlement contracts are listed in `../docs/MIGRATION.md`. A card is never an
access decision: each product and its API enforce access themselves.

Read `../AGENTS.md` and `../docs/MIGRATION.md` before working here.

## Local development

Requires Node.js 22.12 or newer (the Vitest 5 test runner; Next.js alone needs
20.9 or newer) and npm. Verified with Node.js 22.23.2.

From `CRM/`:

```bash
npm --prefix Ability-Portal ci
cp Ability-Portal/.env.example Ability-Portal/.env.local
npm --prefix Ability-Portal run dev -- --port 3300
```

Open <http://localhost:3300>; `/` redirects to `/en` (or the browser's
preferred supported locale). `/ar` renders right-to-left, and its cards link to
the Arabic pages of each product. To follow the links locally, also start
`npm --prefix Ability-CRM run dev -- --port 3100` and
`npm --prefix Ability-Community-Admin run dev -- --port 3200`.

| Task | Command (from this directory) |
| --- | --- |
| Lint (ESLint) | `npm run lint` |
| Type check (`tsc --noEmit`) | `npm run typecheck` |
| Unit tests (Vitest) | `npm test` |
| Production build | `npm run build` |
| Production server | `npm run start -- --port 3300` |

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

Example production build (placeholder hosts):

```bash
NEXT_PUBLIC_CRM_APP_URL=https://crm.example.com \
NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL=https://community-admin.example.com \
npm run build
```

## Structure

- `src/app/[locale]/page.tsx` - the product-selection page
- `src/app/[locale]/components/ProductCard.tsx` - card presentation
- `src/app/[locale]/types.ts`, `utils.ts` - card view model and builder
- `src/lib/productDestinations.ts` - destination parsing, validation, and links
- `src/components/LocaleSwitcher.tsx` - language links
- `src/proxy.ts`, `src/i18n/` - locale routing, navigation, request config
- `messages/en.json`, `messages/ar.json` - this app's translation catalogs
- `src/app/[locale]/(auth)/` and `src/services/` (empty, `.gitkeep`) - reserved
  for sign-in routes and the central access API

Imports use the root-based alias `@/src/...` (`"@/*": ["./*"]`).

## Repository

This directory is its own local Git repository, with no remote and no commits
yet. It shares no history or remote with Amer CRM or the other apps.
