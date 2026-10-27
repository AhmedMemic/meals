import Dexie, { type Table, type Transaction } from 'dexie';
import type { CatalogItem, Category, ListItem, Meal, PlanEntry, SavedWeek } from '../types';
import { STARTER_CATEGORIES } from '../data/categories';
import { STARTER_CATALOG } from '../data/catalog';
import { STARTER_MEALS } from '../data/meals';
import { normalizeKey } from '../lib/units';

// Shared origin with other apps (e.g. "corner" from /workout/): never reuse that name.
export const DB_NAME = 'meals';

export class MealsDb extends Dexie {
  meals!: Table<Meal, string>;
  plan!: Table<PlanEntry, number>;
  weeks!: Table<SavedWeek, number>;
  list!: Table<ListItem, number>;
  catalog!: Table<CatalogItem, string>;
  categories!: Table<Category, string>;

  constructor(name = DB_NAME) {
    super(name);
    // Schema changes: add a new version(n). Never edit an existing version.
    this.version(1).stores({
      meals: 'id, name',
      plan: '++id, date, mealId, sourceId',
      weeks: '++id, name',
      list: '++id, key',
      catalog: 'key, useCount',
      categories: 'id, order',
    });
    this.on('populate', (tx) => seed(tx));
  }
}

export function starterCatalog(): CatalogItem[] {
  return STARTER_CATALOG.map((s) => ({
    key: normalizeKey(s.name),
    name: s.name,
    category: s.category,
    unit: s.unit,
    staple: s.staple ?? false,
    groups: s.groups ?? [],
    useCount: 0,
    lastUsed: 0,
  }));
}

function seed(tx: Transaction) {
  void tx.table('categories').bulkAdd(STARTER_CATEGORIES);
  void tx.table('catalog').bulkAdd(starterCatalog());
  void tx.table('meals').bulkAdd(STARTER_MEALS);
}

export const db = new MealsDb();
