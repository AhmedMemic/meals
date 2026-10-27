import type { CatalogItem, Category, CategoryId, ListItem, Meal, PlanEntry, Qty } from '../types';
import { addQty, formatQtyList, normalizeKey } from './units';

export type ListDraft = Pick<ListItem, 'name' | 'key' | 'category' | 'qty' | 'sources' | 'staple'>;

/** Ingredients of all cooked (non-leftover, not yet added) entries, combined by name. */
export function planToDrafts(
  entries: PlanEntry[],
  meals: Map<string, Meal>,
  catalog: Map<string, CatalogItem>,
): ListDraft[] {
  const out = new Map<string, ListDraft>();
  for (const e of entries) {
    if (e.leftover || e.inList) continue;
    const meal = meals.get(e.mealId);
    if (!meal) continue;
    for (const ing of meal.ingredients) {
      const key = normalizeKey(ing.name);
      if (!key) continue;
      const known = catalog.get(key);
      const d = out.get(key) ?? {
        name: known?.name ?? ing.name.trim(),
        key,
        category: known?.category ?? ing.category,
        qty: [],
        sources: [],
        staple: known?.staple ?? false,
      };
      d.qty = addQty(d.qty, { amount: ing.amount, unit: ing.unit });
      if (!d.sources.includes(meal.name)) d.sources.push(meal.name);
      out.set(key, d);
    }
  }
  return [...out.values()];
}

/**
 * Merges drafts into the current list: an unchecked item with the same name
 * gets the amounts added, everything else becomes a new item.
 */
export function mergeDrafts(
  list: ListItem[],
  drafts: ListDraft[],
  now: number,
): { updated: ListItem[]; created: ListItem[] } {
  const open = new Map(list.filter((i) => !i.checked).map((i) => [i.key, i]));
  const updated: ListItem[] = [];
  const created: ListItem[] = [];
  for (const d of drafts) {
    const cur = open.get(d.key);
    if (cur) {
      const qty = d.qty.reduce<Qty[]>(addQty, cur.qty);
      const sources = [...cur.sources, ...d.sources.filter((s) => !cur.sources.includes(s))];
      const next = { ...cur, qty, sources };
      updated.push(next);
      open.set(d.key, next);
    } else {
      const item: ListItem = { ...d, checked: false, createdAt: now };
      created.push(item);
      open.set(d.key, item);
    }
  }
  return { updated, created };
}

export interface ListGroup {
  category: Category;
  items: ListItem[];
}

/** Open items grouped by category in store order (empty groups left out). */
export function groupByCategory(items: ListItem[], categories: Category[]): ListGroup[] {
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const known = new Set<CategoryId>(sorted.map((c) => c.id));
  return sorted
    .map((category) => ({
      category,
      items: items
        .filter((i) => i.category === category.id || (category.id === 'ostalo' && !known.has(i.category)))
        .sort((a, b) => a.name.localeCompare(b.name, 'bs')),
    }))
    .filter((g) => g.items.length > 0);
}

/** Plain-text list for the share sheet (Viber, WhatsApp…). */
export function listToText(items: ListItem[], categories: Category[], title: string): string {
  const open = items.filter((i) => !i.checked);
  const lines = [title];
  for (const g of groupByCategory(open, categories)) {
    lines.push('', `${g.category.name}:`);
    for (const i of g.items) {
      const q = formatQtyList(i.qty);
      lines.push(`- ${i.name}${q ? ` (${q})` : ''}`);
    }
  }
  return lines.join('\n');
}
