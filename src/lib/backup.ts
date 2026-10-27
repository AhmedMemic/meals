import { db, type MealsDb } from '../db/db';
import type { CatalogItem, Category, ListItem, Meal, PlanEntry, SavedWeek } from '../types';
import { daysBetween, today } from './dates';
import { getItem, setItem } from './storage';

export interface Backup {
  app: 'meals';
  version: 1;
  exportedAt: string;
  data: {
    meals: Meal[];
    plan: PlanEntry[];
    weeks: SavedWeek[];
    list: ListItem[];
    catalog: CatalogItem[];
    categories: Category[];
  };
}

const TABLES = ['meals', 'plan', 'weeks', 'list', 'catalog', 'categories'] as const;

export async function createBackup(d: MealsDb = db): Promise<Backup> {
  const [meals, plan, weeks, list, catalog, categories] = await Promise.all([
    d.meals.toArray(),
    d.plan.toArray(),
    d.weeks.toArray(),
    d.list.toArray(),
    d.catalog.toArray(),
    d.categories.toArray(),
  ]);
  return {
    app: 'meals',
    version: 1,
    exportedAt: new Date().toString(),
    data: { meals, plan, weeks, list, catalog, categories },
  };
}

/** Accepts the contents of a .json or .txt backup. Throws if it is not ours. */
export function parseBackup(text: string): Backup {
  const b = JSON.parse(text.replace(/^﻿/, '')) as Partial<Backup>;
  if (b?.app !== 'meals' || typeof b.data !== 'object' || b.data === null) throw new Error('not a meals backup');
  for (const t of TABLES) if (!Array.isArray(b.data[t])) throw new Error(`missing ${t}`);
  return b as Backup;
}

/** Replaces all data with the backup. */
export async function restoreBackup(b: Backup, d: MealsDb = db) {
  await d.transaction('rw', [d.meals, d.plan, d.weeks, d.list, d.catalog, d.categories], async () => {
    await Promise.all(TABLES.map((t) => d.table(t).clear()));
    await d.meals.bulkAdd(b.data.meals);
    await d.plan.bulkAdd(b.data.plan);
    await d.weeks.bulkAdd(b.data.weeks);
    await d.list.bulkAdd(b.data.list);
    await d.catalog.bulkAdd(b.data.catalog);
    await d.categories.bulkAdd(b.data.categories);
  });
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Sends the backup to the share sheet (e.g. Google Drive). Android does not
 * always accept .json, so it falls back to .txt, then to a plain download.
 */
export async function shareBackup(b: Backup): Promise<ShareResult> {
  const text = JSON.stringify(b);
  const base = `jela-backup-${today()}`;
  const candidates = [
    new File([text], `${base}.json`, { type: 'application/json' }),
    new File([text], `${base}.txt`, { type: 'text/plain' }),
  ];
  for (const file of candidates) {
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: base });
        markBackedUp();
        return 'shared';
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      }
    }
  }
  const url = URL.createObjectURL(candidates[0]!);
  const a = document.createElement('a');
  a.href = url;
  a.download = candidates[0]!.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markBackedUp();
  return 'downloaded';
}

export function markBackedUp() {
  setItem('lastBackup', today());
}

export function lastBackup(): string | null {
  return getItem('lastBackup');
}

/** True if there was never a backup or the last one is 7+ days old. */
export function backupDue(now = today()): boolean {
  const last = lastBackup();
  return !last || daysBetween(last, now) >= 7;
}
