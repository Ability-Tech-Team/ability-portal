# Ability Portal: app-level agent notes

Read `../AGENTS.md` before working here. It is the canonical guide for the
`CRM/` workspace: architecture, repository boundaries, definitions-module
conventions, identity, entitlement, and tenant rules, and verification
requirements. This file adds app-specific facts only. If anything here seems to
conflict, `../AGENTS.md` and the user's current request take precedence. In a
standalone clone without the parent folder, get the canonical `AGENTS.md` from
the workspace instead of assuming it exists.

- **Target:** a chat started in this directory targets Ability Portal, the
  single client-facing entry point (npm package `ability-portal`, local port
  3300). Do not change sibling apps unless the request names them.
- **Responsibility:** navigation and access presentation only. The Portal shows
  one card per product (Ability CRM, Community Admin) and links to each
  separately deployed app. It contains no CRM or community business modules.
  A card's state is presentation, never an access decision: each product and
  its API enforce access, including on direct entry.
- **Independence:** this app has its own manifest, lockfile, environment files,
  build output, and local Git repository. Never import runtime code from
  `../Amer-CRM`, `../Ability-CRM`, or `../Ability-Community-Admin`.
- **Status:** public product-selection page only. Sign-in through the central
  identity provider, purchased-product locking, employee permission states,
  and organization selection wait for their contracts (see
  `../docs/MIGRATION.md`). Do not add fake users, fabricated purchases,
  localStorage license switches, or true-by-default access helpers. A loading,
  unknown, or failed entitlement result must never render a product as
  available.
- **Product destinations:** `NEXT_PUBLIC_CRM_APP_URL` and
  `NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL` are read only in
  `src/lib/productDestinations.ts`, with literal `process.env.NEXT_PUBLIC_*`
  access so that Next.js inlines them at build time. They are validated there:
  an absolute `https:` URL (`http:` only for loopback hosts) without
  credentials, query string, or fragment; an optional base path is allowed.
  Anything else renders the card as "configuration pending". Never take a
  destination from a query parameter or put tokens or credentials in product
  links.
- **Structure** (definitions-module responsibilities, kept small):
  - `src/app/[locale]/page.tsx`: composes the product-selection page and its
    translated labels.
  - `src/app/[locale]/components/ProductCard.tsx`: card presentation.
  - `src/app/[locale]/types.ts` and `utils.ts`: the card view model and the
    pure builder that turns validated destinations into cards.
  - `src/lib/productDestinations.ts`: product keys, destination parsing and
    validation, and localized entry URLs.
  - `src/components/LocaleSwitcher.tsx`: app-wide language links.
  - `src/app/[locale]/(auth)/` and `src/services/` are reserved for sign-in
    routes and the central access API once their contracts are agreed.
- **Tests:** `npm test` runs Vitest (`vitest.config.mts`) on `src/**/*.test.ts`.
  Keep tests on consequential logic such as destination validation and, later,
  access states.
- **Imports** use the root-based alias `"@/*": ["./*"]`, e.g.
  `@/src/lib/productDestinations`.
- **Locales:** routing lives in `src/proxy.ts` (the Next.js 16 name for
  middleware) and `src/i18n/`. `src/app/[locale]/layout.tsx` is the root
  layout, and the request locale comes from `next/root-params`. English is the
  default; Arabic renders right-to-left. This app owns `messages/en.json` and
  `messages/ar.json`. Product links keep the selected locale for products that
  route under `/en` and `/ar`.

Commands, from this directory (details in `README.md`):

```bash
npm ci
cp .env.example .env.local   # local product URLs; edit as needed
npm run dev -- --port 3300
npm run lint
npm run typecheck
npm test
npm run build
npm run start -- --port 3300
```

State, decisions, and pending access contracts: `../docs/MIGRATION.md`.
Workspace commands: `../README.md`.

The block below is managed by Next.js: `next dev` re-adds it when it is missing
or outdated. Keep it unchanged.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
