// Sales checked every Thursday by the GitHub Action (scripts/fetch-deals.ts),
// published next to the app as deals.json.
import { db, type MealsDb } from '../db/db';
import { replaceDeals } from '../db/actions';
import { STORES, type Deal, type StoreId } from '../types';
import { toYmd } from './dates';
import { cleanDeals } from './prices';
import { getItem, setItem } from './storage';

export interface WeeklyDeals {
  /** When the check ran (ms). */
  generatedAt: number;
  city: string;
  /** Sales per store that was checked successfully. */
  stores: Partial<Record<StoreId, Omit<Deal, 'id'>[]>>;
}

export function parseWeeklyDeals(v: unknown): WeeklyDeals | null {
  const w = v as Partial<WeeklyDeals> | null;
  if (!w || typeof w.generatedAt !== 'number' || typeof w.stores !== 'object' || !w.stores) return null;
  return { generatedAt: w.generatedAt, city: typeof w.city === 'string' ? w.city : '', stores: w.stores };
}

/**
 * Stores to take from the weekly file: the file must be new to this phone, and a
 * store checked by hand on the same day or later keeps its own sales.
 */
export function storesToTake(file: WeeklyDeals, lastSeen: number, checkedOn: (s: StoreId) => string | null): StoreId[] {
  if (file.generatedAt <= lastSeen) return [];
  const fileDay = toYmd(new Date(file.generatedAt));
  return STORES.filter((s) => {
    if (!Array.isArray(file.stores[s])) return false;
    const mine = checkedOn(s);
    return !mine || mine < fileDay;
  });
}

/** Loads deals.json (if newer) into this phone's sales. Quietly does nothing offline. */
export async function syncWeeklyDeals(d: MealsDb = db): Promise<number> {
  let file: WeeklyDeals | null;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}deals.json`, { cache: 'no-store' });
    if (!res.ok) return 0;
    file = parseWeeklyDeals(await res.json());
  } catch {
    return 0;
  }
  if (!file) return 0;
  const take = storesToTake(file, Number(getItem('weeklyDeals') ?? 0), (s) => getItem(`dealsChecked:${s}`));
  // Keys are checked again against this phone's catalog (it may differ from the starter one).
  const catalog = new Map((await d.catalog.toArray()).map((c) => [c.key, c]));
  let n = 0;
  for (const s of take) {
    const deals = cleanDeals(file.stores[s]!, s, catalog, file.generatedAt);
    await replaceDeals(s, deals, d);
    setItem(`dealsChecked:${s}`, toYmd(new Date(file.generatedAt)));
    n += deals.length;
  }
  setItem('weeklyDeals', String(file.generatedAt));
  return n;
}
