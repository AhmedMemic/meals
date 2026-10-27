import { describe, expect, it } from 'vitest';
import { MEAL_KINDS, UNITS } from '../types';
import { normalizeKey } from '../lib/units';
import { STARTER_CATALOG } from './catalog';
import { STARTER_CATEGORIES } from './categories';
import { STARTER_MEALS } from './meals';

const categoryIds = new Set(STARTER_CATEGORIES.map((c) => c.id));
const catalogKeys = new Map(STARTER_CATALOG.map((c) => [normalizeKey(c.name), c]));

describe('starter data', () => {
  it('has unique ids and names', () => {
    expect(new Set(STARTER_MEALS.map((m) => m.id)).size).toBe(STARTER_MEALS.length);
    expect(new Set(STARTER_MEALS.map((m) => normalizeKey(m.name))).size).toBe(STARTER_MEALS.length);
    expect(catalogKeys.size).toBe(STARTER_CATALOG.length);
    expect(categoryIds.size).toBe(STARTER_CATEGORIES.length);
  });

  it('every catalog item has a valid category and unit', () => {
    for (const c of STARTER_CATALOG) {
      expect(categoryIds, c.name).toContain(c.category);
      if (c.unit) expect(UNITS, c.name).toContain(c.unit);
    }
  });

  it('every meal is valid', () => {
    for (const m of STARTER_MEALS) {
      expect(m.id).toMatch(/^s-[a-z0-9-]+$/);
      expect(MEAL_KINDS).toContain(m.kind);
      expect(m.days).toBeGreaterThanOrEqual(1);
      expect(m.ingredients.length, m.name).toBeGreaterThan(0);
      expect(new Set(m.ingredients.map((i) => normalizeKey(i.name))).size, `${m.name}: duplicate ingredient`).toBe(
        m.ingredients.length,
      );
      for (const i of m.ingredients) {
        const where = `${m.name}: ${i.name}`;
        expect(UNITS, where).toContain(i.unit);
        expect(categoryIds, where).toContain(i.category);
        expect(i.amount === null || i.amount > 0, where).toBe(true);
        // Same name as a catalog item, so the list merges and categories match.
        expect(catalogKeys.get(normalizeKey(i.name))?.category, where).toBe(i.category);
      }
    }
  });

  it('has enough meals to start with', () => {
    expect(STARTER_MEALS.length).toBeGreaterThanOrEqual(40);
    expect(STARTER_MEALS.some((m) => m.forBaby)).toBe(true);
  });
});
