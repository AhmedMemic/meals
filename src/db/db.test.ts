import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STARTER_MEALS } from '../data/meals';
import { createBackup, parseBackup, restoreBackup } from '../lib/backup';
import {
  addListItem,
  addMealToPlan,
  addPlanToList,
  copyWeek,
  deleteMeal,
  removePlanEntry,
  replaceDeals,
  restoreStarterMeals,
  savePrices,
  weekEntries,
} from './actions';
import { DB_NAME, MealsDb } from './db';
import type { Deal } from '../types';

let d: MealsDb;
let n = 0;

beforeEach(async () => {
  d = new MealsDb(`test-${n++}`);
  await d.open();
});
afterEach(async () => {
  await d.delete();
});

describe('db', () => {
  it('uses its own database name', () => {
    expect(DB_NAME).toBe('meals');
    expect(DB_NAME).not.toBe('corner');
  });

  it('seeds starter data on first open', async () => {
    expect(await d.meals.count()).toBe(STARTER_MEALS.length);
    expect(await d.categories.count()).toBeGreaterThan(10);
    expect(await d.catalog.get('hljeb')).toMatchObject({ category: 'pekara' });
  });

  it('adds multi-day meals with leftovers and removes them together', async () => {
    await addMealToPlan('2026-10-27', 'vecera', 's-zeljanica', 2, d);
    const e = await weekEntries('2026-10-26', d);
    expect(e.map((x) => x.leftover)).toEqual([false, true]);
    expect(e[1]!.sourceId).toBe(e[0]!.id);
    await removePlanEntry(e[0]!.id!, d);
    expect(await d.plan.count()).toBe(0);
  });

  it('adds the plan to the list once, merging amounts', async () => {
    await addMealToPlan('2026-10-26', 'vecera', 's-sarma', 3, d);
    await addMealToPlan('2026-10-29', 'vecera', 's-punjene-paprike', 1, d);
    await addListItem('2 luk', d);
    expect(await addPlanToList('2026-10-26', d)).toBe(2);
    const luk = await d.list.where('key').equals('luk').toArray();
    expect(luk).toHaveLength(1);
    expect(luk[0]!.qty).toEqual([{ amount: 5, unit: 'kom' }]);
    expect(luk[0]!.sources).toEqual(['Sarma', 'Punjene paprike']);
    expect((await d.list.where('key').equals('so').first())!.staple).toBe(true);
    expect(await addPlanToList('2026-10-26', d)).toBe(0);
  });

  it('learns new items in the catalog', async () => {
    await addListItem('Ajran 2', d);
    expect(await d.catalog.get('ajran')).toMatchObject({ name: 'Ajran', category: 'ostalo', useCount: 1 });
    await addListItem('mlijeko', d);
    expect((await d.list.where('key').equals('mlijeko').first())!.category).toBe('mlijecni');
  });

  it('copies last week', async () => {
    await addMealToPlan('2026-10-20', 'vecera', 's-grah', 1, d);
    expect(await copyWeek('2026-10-19', '2026-10-26', d)).toBe(1);
    expect((await weekEntries('2026-10-26', d))[0]!.date).toBe('2026-10-27');
  });

  it('deletes and restores starter meals', async () => {
    await addMealToPlan('2026-10-20', 'vecera', 's-grah', 1, d);
    await deleteMeal('s-grah', d);
    expect(await d.plan.count()).toBe(0);
    expect(await restoreStarterMeals(d)).toBe(1);
  });

  it('round-trips a backup', async () => {
    await addListItem('sapun', d);
    const text = JSON.stringify(await createBackup(d));
    const other = new MealsDb(`test-${n++}`);
    await other.open();
    await restoreBackup(parseBackup(text), other);
    expect(await other.list.count()).toBe(1);
    expect(await other.meals.count()).toBe(STARTER_MEALS.length);
    await other.delete();
    expect(() => parseBackup('{"app":"corner","data":{}}')).toThrow();
  });

  it('backs up prices but not sales, and reads backups made before prices', async () => {
    await savePrices([{ key: 'mlijeko', name: 'Mlijeko 1 l', store: 'bingo', price: 1.85, unit: '1 l', date: '2026-10-28', source: 'racun' }], d);
    await replaceDeals('bingo', [deal('Jaja 10 kom', 'jaja')], d);
    const backup = await createBackup(d);
    expect(backup.data.prices).toHaveLength(1);
    expect(JSON.stringify(backup)).not.toContain('Jaja 10 kom');

    const old = JSON.parse(JSON.stringify(backup));
    delete old.data.prices;
    await restoreBackup(parseBackup(JSON.stringify(old)), d);
    expect(await d.prices.count()).toBe(0);
  });

  it('replaces only the checked store\'s sales', async () => {
    await replaceDeals('bingo', [deal('Jaja 10 kom', 'jaja'), deal('Mlijeko', 'mlijeko')], d);
    await replaceDeals('mercator', [deal('Hljeb', 'hljeb')], d);
    await replaceDeals('bingo', [deal('Riža', null)], d);
    expect((await d.deals.toArray()).map((x) => x.name).sort()).toEqual(['Hljeb', 'Riža']);
  });
});

function deal(name: string, key: string | null): Deal {
  return { store: 'bingo', name, price: 2, oldPrice: null, unit: 'kom', validFrom: null, validTo: null, key, category: null, fetchedAt: 0 };
}
