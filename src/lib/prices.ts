import { STORES, type CatalogItem, type CategoryId, type Deal, type PriceRecord, type StoreId } from '../types';
import { normalizeKey } from './units';

/** Discounts from this percentage up count as "really off price". */
export const BIG_DISCOUNT = 25;

export function formatKm(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} KM`;
}

/** "1,85" or "1.85 KM" → 1.85; null if not a positive number. */
export function parsePrice(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text.trim().replace(/\s*KM$/i, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Discount in whole percent, or null if there is no (sensible) old price. */
export function discount(d: Pick<Deal, 'price' | 'oldPrice'>): number | null {
  if (!d.oldPrice || d.oldPrice <= d.price) return null;
  return Math.round((1 - d.price / d.oldPrice) * 100);
}

/** Deals that have not ended yet (no end date counts as still valid). */
export function activeDeals(deals: Deal[], today: string): Deal[] {
  return deals.filter((d) => !d.validTo || d.validTo >= today);
}

export interface DealGroups {
  /** Items on the current shopping list. */
  forList: Deal[];
  /** Items we buy (catalog items we used, meal ingredients). */
  usual: Deal[];
  /** Everything else with a big discount. */
  big: Deal[];
  other: Deal[];
}

export function groupDeals(deals: Deal[], listKeys: Set<string>, usedKeys: Set<string>): DealGroups {
  const g: DealGroups = { forList: [], usual: [], big: [], other: [] };
  const byDiscount = [...deals].sort((a, b) => (discount(b) ?? 0) - (discount(a) ?? 0));
  for (const d of byDiscount) {
    if (d.key && listKeys.has(d.key)) g.forList.push(d);
    else if (d.key && usedKeys.has(d.key)) g.usual.push(d);
    else if ((discount(d) ?? 0) >= BIG_DISCOUNT) g.big.push(d);
    else g.other.push(d);
  }
  return g;
}

/** The best active deal per catalog key (lowest price). */
export function dealsByKey(deals: Deal[]): Map<string, Deal> {
  const out = new Map<string, Deal>();
  for (const d of deals) {
    if (!d.key) continue;
    const cur = out.get(d.key);
    if (!cur || d.price < cur.price) out.set(d.key, d);
  }
  return out;
}

/** Latest price per store for one item, cheapest first. */
export function latestPrices(records: PriceRecord[]): PriceRecord[] {
  const latest = new Map<StoreId, PriceRecord>();
  for (const r of records) {
    const cur = latest.get(r.store);
    if (!cur || r.date > cur.date || (r.date === cur.date && (r.id ?? 0) > (cur.id ?? 0))) latest.set(r.store, r);
  }
  return [...latest.values()].sort((a, b) => a.price - b.price);
}

// ---- Cleaning what the AI returns ----

const YMD = /^\d{4}-\d{2}-\d{2}$/;

function ymdOrNull(v: unknown): string | null {
  return typeof v === 'string' && YMD.test(v) ? v : null;
}

function positive(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
}

function text(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** A key the AI picked, only if it really is in the catalog. */
function catalogKey(v: unknown, catalog: Map<string, CatalogItem>): string | null {
  if (typeof v !== 'string') return null;
  const key = normalizeKey(v);
  return catalog.has(key) ? key : null;
}

export interface RawDeal {
  name?: unknown;
  price?: unknown;
  oldPrice?: unknown;
  unit?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
  key?: unknown;
}

export function cleanDeals(raw: RawDeal[], store: StoreId, catalog: Map<string, CatalogItem>, now: number): Deal[] {
  const out: Deal[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const name = text(r.name);
    const price = positive(r.price);
    if (!name || price === null) continue;
    const dup = `${normalizeKey(name)}|${price}`;
    if (seen.has(dup)) continue;
    seen.add(dup);
    const key = catalogKey(r.key, catalog);
    out.push({
      store,
      name,
      price,
      oldPrice: positive(r.oldPrice),
      unit: text(r.unit),
      validFrom: ymdOrNull(r.validFrom),
      validTo: ymdOrNull(r.validTo),
      key,
      category: key ? catalog.get(key)!.category : null,
      fetchedAt: now,
    });
  }
  return out;
}

export interface RawReceipt {
  store?: unknown;
  date?: unknown;
  items?: { name?: unknown; price?: unknown; unit?: unknown; key?: unknown }[];
}

/** One receipt line as shown for checking before saving. */
export interface ReceiptLine {
  name: string;
  price: number;
  unit: string;
  key: string | null;
  category: CategoryId | null;
}

export interface Receipt {
  store: StoreId;
  date: string | null;
  lines: ReceiptLine[];
}

export function cleanReceipt(raw: RawReceipt, catalog: Map<string, CatalogItem>): Receipt {
  const store = STORES.find((s) => s === raw.store) ?? 'ostalo';
  const lines: ReceiptLine[] = [];
  for (const i of raw.items ?? []) {
    const name = text(i.name);
    const price = positive(i.price);
    if (!name || price === null) continue;
    const key = catalogKey(i.key, catalog);
    lines.push({ name, price, unit: text(i.unit) || 'kom', key, category: key ? catalog.get(key)!.category : null });
  }
  return { store, date: ymdOrNull(raw.date), lines };
}
