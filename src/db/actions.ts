import type { CategoryId, ListItem, Meal, PlanEntry, Qty, Slot } from '../types';
import { STARTER_MEALS } from '../data/meals';
import { weekDays } from '../lib/dates';
import { mergeDrafts, planToDrafts } from '../lib/list';
import { entriesForMeal, fromSavedEntries, shiftEntries, toSavedEntries } from '../lib/plan';
import { addQty, normalizeKey, parseQuickInput } from '../lib/units';
import { db, type MealsDb } from './db';

// ---- Plan ----

export async function weekEntries(start: string, d: MealsDb = db): Promise<PlanEntry[]> {
  const days = weekDays(start);
  return d.plan.where('date').between(days[0]!, days[6]!, true, true).toArray();
}

/** Adds a meal; if it lasts several days, the next days get leftover entries. */
export async function addMealToPlan(date: string, slot: Slot, mealId: string, days: number, d: MealsDb = db) {
  const [first, ...rest] = entriesForMeal(date, slot, mealId, days);
  await d.transaction('rw', d.plan, async () => {
    const sourceId = await d.plan.add(first!);
    if (rest.length) await d.plan.bulkAdd(rest.map((e) => ({ ...e, sourceId })));
  });
}

/** Removes an entry together with its leftovers. */
export async function removePlanEntry(id: number, d: MealsDb = db) {
  await d.transaction('rw', d.plan, async () => {
    await d.plan.where('sourceId').equals(id).delete();
    await d.plan.delete(id);
  });
}

export async function setLeftover(id: number, leftover: boolean, d: MealsDb = db) {
  await d.plan.update(id, { leftover });
}

export async function copyWeek(fromStart: string, toStart: string, d: MealsDb = db): Promise<number> {
  const src = await weekEntries(fromStart, d);
  await d.plan.bulkAdd(shiftEntries(src, fromStart, toStart));
  return src.length;
}

export async function clearWeek(start: string, d: MealsDb = db) {
  const ids = (await weekEntries(start, d)).map((e) => e.id!);
  await d.plan.bulkDelete(ids);
}

export async function saveWeek(name: string, start: string, d: MealsDb = db) {
  const entries = toSavedEntries(await weekEntries(start, d));
  await d.weeks.add({ name: name.trim(), entries });
}

export async function applySavedWeek(id: number, start: string, d: MealsDb = db) {
  const saved = await d.weeks.get(id);
  if (saved) await d.plan.bulkAdd(fromSavedEntries(saved.entries, start));
}

// ---- Shopping list ----

/**
 * Adds ingredients of the week's cooked meals to the list (merging amounts)
 * and marks those entries as added. Returns how many meals were added.
 */
export async function addPlanToList(start: string, d: MealsDb = db): Promise<number> {
  return d.transaction('rw', [d.plan, d.meals, d.catalog, d.list], async () => {
    const entries = (await weekEntries(start, d)).filter((e) => !e.leftover && !e.inList);
    if (!entries.length) return 0;
    const meals = new Map((await d.meals.toArray()).map((m) => [m.id, m]));
    const catalog = new Map((await d.catalog.toArray()).map((c) => [c.key, c]));
    const { updated, created } = mergeDrafts(await d.list.toArray(), planToDrafts(entries, meals, catalog), Date.now());
    await d.list.bulkPut(updated);
    await d.list.bulkAdd(created);
    await d.plan.bulkUpdate(entries.map((e) => ({ key: e.id!, changes: { inList: true } })));
    return entries.length;
  });
}

/** Adds a hand-typed item ("2 l mlijeko"); learns it in the catalog. */
export async function addListItem(input: string, d: MealsDb = db, category?: CategoryId) {
  const { name, qty } = parseQuickInput(input);
  await addItem(name, qty, d, category);
}

/** Adds an item by name (quick-add tap or typed); merges with an open item of the same name. */
export async function addItem(name: string, qty: Qty | null, d: MealsDb = db, category?: CategoryId) {
  const key = normalizeKey(name);
  if (!key) return;
  await d.transaction('rw', d.list, d.catalog, async () => {
    const known = await d.catalog.get(key);
    const now = Date.now();
    const cat = category ?? known?.category ?? 'ostalo';
    const displayName = known?.name ?? capitalize(name.trim());
    if (known) await d.catalog.update(key, { useCount: known.useCount + 1, lastUsed: now });
    else
      await d.catalog.add({ key, name: displayName, category: cat, staple: false, groups: [], useCount: 1, lastUsed: now });

    const existing = (await d.list.where('key').equals(key).toArray()).find((i) => !i.checked);
    if (existing) {
      await d.list.update(existing.id!, { qty: qty ? addQty(existing.qty, qty) : existing.qty, staple: false });
    } else {
      await d.list.add({
        name: displayName,
        key,
        category: cat,
        qty: qty ? addQty([], qty) : [],
        sources: [],
        checked: false,
        staple: false,
        createdAt: now,
      });
    }
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase('bs') + s.slice(1);
}

export async function setChecked(id: number, checked: boolean, d: MealsDb = db) {
  await d.list.update(id, { checked });
}

/** "Imam kod kuće": removes the item from this list. */
export async function removeListItem(id: number, d: MealsDb = db) {
  await d.list.delete(id);
}

export async function restoreListItem(item: ListItem, d: MealsDb = db) {
  await d.list.put(item);
}

/** A basic item (so, ulje…) we actually need: move it into the normal list. */
export async function needStaple(id: number, d: MealsDb = db) {
  await d.list.update(id, { staple: false });
}

export async function clearChecked(d: MealsDb = db) {
  const ids = (await d.list.toArray()).filter((i) => i.checked).map((i) => i.id!);
  await d.list.bulkDelete(ids);
}

export async function clearList(d: MealsDb = db) {
  await d.list.clear();
}

/** Edits an item; a new category is also remembered in the catalog. */
export async function updateListItem(id: number, changes: Pick<ListItem, 'name' | 'category' | 'qty'>, d: MealsDb = db) {
  await d.transaction('rw', d.list, d.catalog, async () => {
    await d.list.update(id, changes);
    const key = normalizeKey(changes.name);
    await d.list.update(id, { key });
    const known = await d.catalog.get(key);
    if (known) await d.catalog.update(key, { category: changes.category });
  });
}

// ---- Meals ----

export async function saveMeal(meal: Meal, d: MealsDb = db) {
  await d.meals.put(meal);
}

/** Deletes a meal and its plan entries. */
export async function deleteMeal(id: string, d: MealsDb = db) {
  await d.transaction('rw', d.meals, d.plan, async () => {
    await d.plan.where('mealId').equals(id).delete();
    await d.meals.delete(id);
  });
}

/** Adds back starter meals that were deleted. Returns how many. */
export async function restoreStarterMeals(d: MealsDb = db): Promise<number> {
  const have = new Set(await d.meals.toCollection().primaryKeys());
  const missing = STARTER_MEALS.filter((m) => !have.has(m.id));
  await d.meals.bulkAdd(missing);
  return missing.length;
}

export function newMealId(): string {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---- Categories ----

export async function moveCategory(id: CategoryId, dir: -1 | 1, d: MealsDb = db) {
  await d.transaction('rw', d.categories, async () => {
    const cats = await d.categories.orderBy('order').toArray();
    const i = cats.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cats.length) return;
    [cats[i], cats[j]] = [cats[j]!, cats[i]!];
    await d.categories.bulkPut(cats.map((c, order) => ({ ...c, order })));
  });
}
