// Weekly sales check, run by the GitHub Action every Thursday morning:
// asks Claude for each store's current sales in CITY and writes public/deals.json.
// Stores that fail keep last week's sales (the workflow downloads the live file first).
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { STARTER_CATALOG } from '../src/data/catalog';
import { SALE_STORES } from '../src/data/stores';
import { fetchDeals } from '../src/lib/ai';
import { DEFAULT_CITY } from '../src/lib/aiKey';
import { today } from '../src/lib/dates';
import { normalizeKey } from '../src/lib/units';
import { parseWeeklyDeals, type WeeklyDeals } from '../src/lib/weeklyDeals';
import type { CatalogItem } from '../src/types';

const OUT = 'public/deals.json';
const city = process.env.CITY || DEFAULT_CITY;

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.log('ANTHROPIC_API_KEY is not set: keeping last week\'s sales.');
  process.exit(0);
}

const catalog: CatalogItem[] = STARTER_CATALOG.map((s) => ({
  key: normalizeKey(s.name),
  name: s.name,
  category: s.category,
  staple: s.staple ?? false,
  groups: s.groups ?? [],
  useCount: 0,
  lastUsed: 0,
}));

function readPrevious(): WeeklyDeals | null {
  try {
    return existsSync(OUT) ? parseWeeklyDeals(JSON.parse(readFileSync(OUT, 'utf8'))) : null;
  } catch {
    return null;
  }
}

const previous = readPrevious();
const client = new Anthropic({ apiKey });
const out: WeeklyDeals = { generatedAt: Date.now(), city, stores: {} };
let failed = 0;

await Promise.all(
  SALE_STORES.map(async (store) => {
    try {
      out.stores[store.id] = await fetchDeals(store, catalog, today(), city, client);
      console.log(`${store.name}: ${out.stores[store.id]!.length} sales`);
    } catch (e) {
      failed++;
      console.log(`${store.name}: failed (${e instanceof Error ? e.message : e}), keeping last week's`);
      const old = previous?.stores[store.id];
      if (old) out.stores[store.id] = old;
    }
  }),
);

writeFileSync(OUT, JSON.stringify(out));
console.log(`Wrote ${OUT} for ${city}.`);
// Fail the run only if nothing worked, so a broken key or API outage is noticed.
if (failed === SALE_STORES.length) process.exit(1);
