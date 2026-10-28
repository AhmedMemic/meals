# Jela — family meal plan + shopping list

Personal PWA for Ahmed's family (2 adults + baby): pick meals for the week, turn
them into a shopping list grouped by store category, tick items off in the shop.
Used mainly on an Android phone (Chrome, installed to the home screen), ~390 px wide.
Live at https://ahmedmemic.github.io/meals/ (repo `AhmedMemic/meals`).

## Commands
- `npm run dev` — dev server (http://localhost:5173/meals/)
- `npm test` — Vitest (pure logic, db with fake-indexeddb, starter data)
- `npm run build` — `tsc` + Vite build into `dist/`
- `npm run icons` — regenerate PWA icons from `public/icon.svg` (commit the PNGs)
- Always run `npm test && npm run build` before a commit. Commit/push only when asked.

## Deploy
`.github/workflows/deploy.yml`: on push to `main` runs `npm ci`, `npm test`,
`npm run build` and deploys `dist/` to GitHub Pages (Pages source = "GitHub Actions").

## Shared-origin rules (IMPORTANT)
All GitHub Pages apps share the origin `https://ahmedmemic.github.io`
(e.g. the workout app at `/workout/` uses IndexedDB `corner`). So:
- IndexedDB name is `meals` (`src/db/db.ts`). Never `corner`, never rename it.
- Vite `base: '/meals/'`; PWA `start_url`, `scope` and `id` = `/meals/`.
- localStorage keys go through `src/lib/storage.ts`, which adds the `meals:` prefix.

## Stack
Vite + React 18 + TypeScript (strict), react-router-dom with **HashRouter**
(Pages has no SPA fallback), vite-plugin-pwa (autoUpdate, Workbox precache),
Dexie + dexie-react-hooks (`useLiveQuery`), self-hosted Manrope via @fontsource
(latin + latin-ext subsets only, for č ć š ž đ), plain CSS: tokens in
`src/styles/tokens.css`, shared classes in `global.css`, CSS Modules per component.
`@anthropic-ai/sdk` for the AI features (lazy-loaded). No other dependencies unless clearly worth it.

## Layout
- `src/strings.ts` — **all UI text** (Bosnian only, no i18n system).
- `src/types.ts` — data model (Meal, PlanEntry, ListItem, CatalogItem, Category, units).
- `src/data/` — starter categories, store catalog and meals (typed, checked by `data.test.ts`);
  `stores.ts` — stores and their sale pages.
- `src/lib/` — pure logic: `dates`, `units` (combine/convert/parse amounts),
  `list` (plan → list drafts, merging, grouping, share text), `plan`, `backup`, `storage`,
  `prices` (sales/receipt cleaning, grouping, latest prices).
- `src/lib/ai.ts` — Claude calls (only module importing the SDK; always `import()` it lazily);
  `src/lib/aiKey.ts` — API key + `AiError`, safe to import anywhere.
- `src/db/db.ts` — Dexie schema + first-run seeding; `src/db/actions.ts` — all writes.
- `src/pages/` — Plan, Lista, Akcije, Jela, MealEdit, Više; `src/components/` — small UI pieces.

## Conventions
- **Dexie schema:** changes always get a new `this.version(n)`; never edit an old
  version (real data lives in it). Starter data is seeded only on first open
  (`populate`); "Vrati obrisana početna jela" re-adds missing starter meals.
- **Dates** are local `YYYY-MM-DD` strings (`src/lib/dates.ts`); never `toISOString()`.
  Weeks start on Monday.
- Ingredient amounts are for the **whole pot**, not per person. `amount: null` = "some"
  (so, biber). g/kg and ml/l are combined (stored as g/ml); other units are listed side by side.
- Starter meal ingredient names must match a catalog item (same category) so items merge.
- Basic items (`staple` in the catalog: so, ulje, brašno…) land in "Provjeri kod kuće",
  not in the normal list.
- Multi-day meals (pita, čorba): one cooked entry + leftover entries (`sourceId`) on the
  next days; leftovers add nothing to the list.
- Plan → list is explicit ("Dodaj plan u listu"); entries get `inList` so they are not added twice.
- Backup: JSON export via share sheet (falls back to .txt, then download); import accepts
  both; reminder after 7 days (`meals:lastBackup`).
- **AI (Akcije, receipts):** Claude is called straight from the phone with the user's own
  API key (`meals:apiKey`, set under Više; never in backups or the repo), model `claude-opus-5-5`.
  "Provjeri akcije" lets Claude read each store's sale pages (web fetch/search); offers that
  are only images go through a second call with the image URLs. Sales are replaced per store,
  matched to catalog keys (AI picks the key, `prices.ts` verifies it). "Slikaj račun" reads a
  receipt photo; the user checks lines before they become `prices`. Prices are backed up, sales are not.
- Theme "Paprika i bosiljak": dark only, paprika orange accent, basil green ticks.
  Touch targets ≥ 44 px, phone first.

## Ideas for later
- Store per item (Bingo / Mercator / Penny / pijaca) with a list filter.
- Konzum: konzum.ba did not resolve (Oct 2026), so its sales rely on Claude's web search.
- Sync/sharing with family phones (currently: share list as text).
- Pantry ("šta imamo kod kuće").
