import type { PlanEntry, SavedWeekEntry, Slot } from '../types';
import { addDays, dayIndex, daysBetween } from './dates';

/** The cooked entry plus leftover entries on the following days. */
export function entriesForMeal(date: string, slot: Slot, mealId: string, days: number): PlanEntry[] {
  return Array.from({ length: Math.max(1, days) }, (_, i) => ({
    date: addDays(date, i),
    slot,
    mealId,
    leftover: i > 0,
    inList: false,
  }));
}

/** Copies a week's entries to another week (same weekdays). */
export function shiftEntries(entries: PlanEntry[], fromStart: string, toStart: string): PlanEntry[] {
  const offset = daysBetween(fromStart, toStart);
  return entries.map((e) => ({
    date: addDays(e.date, offset),
    slot: e.slot,
    mealId: e.mealId,
    leftover: e.leftover,
    inList: false,
  }));
}

export function toSavedEntries(entries: PlanEntry[]): SavedWeekEntry[] {
  return entries.map((e) => ({ day: dayIndex(e.date), slot: e.slot, mealId: e.mealId, leftover: e.leftover }));
}

export function fromSavedEntries(saved: SavedWeekEntry[], weekStart: string): PlanEntry[] {
  return saved.map((s) => ({
    date: addDays(weekStart, s.day),
    slot: s.slot,
    mealId: s.mealId,
    leftover: s.leftover,
    inList: false,
  }));
}

/** Last date each meal was cooked (leftovers ignored), up to and including `until`. */
export function lastCooked(entries: PlanEntry[], until: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of entries) {
    if (e.leftover || e.date > until) continue;
    const cur = out.get(e.mealId);
    if (!cur || e.date > cur) out.set(e.mealId, e.date);
  }
  return out;
}
