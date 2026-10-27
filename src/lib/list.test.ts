import { describe, expect, it } from 'vitest';
import type { CatalogItem, ListItem, Meal, PlanEntry } from '../types';
import { STARTER_CATEGORIES } from '../data/categories';
import { groupByCategory, listToText, mergeDrafts, planToDrafts } from './list';

const meal = (id: string, name: string, ingredients: Meal['ingredients']): Meal => ({
  id, name, kind: 'kuhano', days: 1, ingredients, notes: '', favourite: false, hidden: false, forBaby: false, builtin: false,
});
const entry = (mealId: string, extra: Partial<PlanEntry> = {}): PlanEntry => ({
  date: '2026-10-26', slot: 'vecera', mealId, leftover: false, inList: false, ...extra,
});

const meals = new Map([
  ['a', meal('a', 'Sarma', [
    { name: 'Luk', amount: 2, unit: 'kom', category: 'povrce' },
    { name: 'Mljeveno meso', amount: 800, unit: 'g', category: 'meso' },
    { name: 'So', amount: null, unit: 'kg', category: 'zacini' },
  ])],
  ['b', meal('b', 'Paprike', [
    { name: 'luk ', amount: 1, unit: 'kom', category: 'povrce' },
    { name: 'Mljeveno meso', amount: 0.7, unit: 'kg', category: 'meso' },
  ])],
]);
const catalog = new Map<string, CatalogItem>([
  ['so', { key: 'so', name: 'So', category: 'zacini', staple: true, groups: [], useCount: 0, lastUsed: 0 }],
]);

describe('planToDrafts', () => {
  it('combines the same ingredient across meals', () => {
    const drafts = planToDrafts([entry('a'), entry('b')], meals, catalog);
    const luk = drafts.find((d) => d.key === 'luk')!;
    expect(luk.qty).toEqual([{ amount: 3, unit: 'kom' }]);
    expect(luk.sources).toEqual(['Sarma', 'Paprike']);
    expect(drafts.find((d) => d.key === 'mljeveno meso')!.qty).toEqual([{ amount: 1500, unit: 'g' }]);
  });

  it('skips leftovers and entries already added', () => {
    expect(planToDrafts([entry('a', { leftover: true }), entry('b', { inList: true })], meals, catalog)).toEqual([]);
  });

  it('counts a meal cooked twice twice', () => {
    const luk = planToDrafts([entry('a'), entry('a')], meals, catalog).find((d) => d.key === 'luk')!;
    expect(luk.qty).toEqual([{ amount: 4, unit: 'kom' }]);
    expect(luk.sources).toEqual(['Sarma']);
  });

  it('marks staples from the catalog', () => {
    expect(planToDrafts([entry('a')], meals, catalog).find((d) => d.key === 'so')!.staple).toBe(true);
  });
});

describe('mergeDrafts', () => {
  const item = (extra: Partial<ListItem>): ListItem => ({
    id: 1, name: 'Luk', key: 'luk', category: 'povrce', qty: [{ amount: 1, unit: 'kom' }], sources: [],
    checked: false, staple: false, createdAt: 0, ...extra,
  });

  it('adds to an open item with the same name', () => {
    const drafts = planToDrafts([entry('a')], meals, catalog);
    const { updated, created } = mergeDrafts([item({})], drafts, 5);
    expect(updated).toHaveLength(1);
    expect(updated[0]!.qty).toEqual([{ amount: 3, unit: 'kom' }]);
    expect(created.map((c) => c.key).sort()).toEqual(['mljeveno meso', 'so']);
  });

  it('does not touch checked items', () => {
    const drafts = planToDrafts([entry('a')], meals, catalog);
    const { updated, created } = mergeDrafts([item({ checked: true })], drafts, 5);
    expect(updated).toHaveLength(0);
    expect(created).toHaveLength(3);
  });
});

describe('grouping and text', () => {
  const items: ListItem[] = [
    { name: 'Sapun', key: 'sapun', category: 'higijena', qty: [], sources: [], checked: false, staple: false, createdAt: 0 },
    { name: 'Luk', key: 'luk', category: 'povrce', qty: [{ amount: 3, unit: 'kom' }], sources: [], checked: false, staple: false, createdAt: 0 },
    { name: 'Hljeb', key: 'hljeb', category: 'pekara', qty: [], sources: [], checked: true, staple: false, createdAt: 0 },
  ];

  it('groups in store order', () => {
    expect(groupByCategory(items, STARTER_CATEGORIES).map((g) => g.category.id)).toEqual(['povrce', 'pekara', 'higijena']);
  });

  it('shares only open items', () => {
    expect(listToText(items, STARTER_CATEGORIES, 'Lista')).toBe('Lista\n\nPovrće:\n- Luk (3 kom)\n\nHigijena:\n- Sapun');
  });
});
