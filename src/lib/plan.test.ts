import { describe, expect, it } from 'vitest';
import type { PlanEntry } from '../types';
import { entriesForMeal, fromSavedEntries, lastCooked, shiftEntries, toSavedEntries } from './plan';

describe('plan', () => {
  it('creates leftovers for multi-day meals', () => {
    const e = entriesForMeal('2026-10-31', 'vecera', 'pita', 3);
    expect(e.map((x) => [x.date, x.leftover])).toEqual([
      ['2026-10-31', false],
      ['2026-11-01', true],
      ['2026-11-02', true],
    ]);
  });

  it('copies a week to another week', () => {
    const src: PlanEntry[] = [{ id: 7, date: '2026-10-21', slot: 'vecera', mealId: 'x', leftover: false, inList: true, sourceId: 3 }];
    expect(shiftEntries(src, '2026-10-19', '2026-10-26')).toEqual([
      { date: '2026-10-28', slot: 'vecera', mealId: 'x', leftover: false, inList: false },
    ]);
  });

  it('saves and applies a week by weekday', () => {
    const src: PlanEntry[] = [{ date: '2026-10-25', slot: 'rucak', mealId: 'x', leftover: true, inList: false }];
    const saved = toSavedEntries(src);
    expect(saved).toEqual([{ day: 6, slot: 'rucak', mealId: 'x', leftover: true }]);
    expect(fromSavedEntries(saved, '2026-11-02')[0]!.date).toBe('2026-11-08');
  });

  it('finds when a meal was last cooked', () => {
    const e: PlanEntry[] = [
      { date: '2026-10-01', slot: 'vecera', mealId: 'x', leftover: false, inList: false },
      { date: '2026-10-10', slot: 'vecera', mealId: 'x', leftover: false, inList: false },
      { date: '2026-10-11', slot: 'vecera', mealId: 'x', leftover: true, inList: false },
      { date: '2026-12-01', slot: 'vecera', mealId: 'x', leftover: false, inList: false },
    ];
    expect(lastCooked(e, '2026-10-27').get('x')).toBe('2026-10-10');
  });
});
