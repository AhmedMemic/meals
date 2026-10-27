import { describe, expect, it } from 'vitest';
import { addDays, dayIndex, daysBetween, toYmd, weekDays, weekStart } from './dates';

describe('dates', () => {
  it('formats local dates', () => {
    expect(toYmd(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('weeks start on Monday', () => {
    expect(weekStart('2026-10-27')).toBe('2026-10-26'); // Tuesday
    expect(weekStart('2026-11-01')).toBe('2026-10-26'); // Sunday
    expect(weekStart('2026-10-26')).toBe('2026-10-26'); // Monday
    expect(weekDays('2026-10-26')).toHaveLength(7);
    expect(dayIndex('2026-11-01')).toBe(6);
  });

  it('crosses months and DST', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(daysBetween('2026-10-20', '2026-10-27')).toBe(7);
  });
});
