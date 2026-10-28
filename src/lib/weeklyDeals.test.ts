import { afterEach, describe, expect, it, vi } from 'vitest';
import { MealsDb } from '../db/db';
import { getItem, setItem } from './storage';
import { parseWeeklyDeals, storesToTake, syncWeeklyDeals, type WeeklyDeals } from './weeklyDeals';

const thursday = new Date(2026, 9, 29, 6, 0).getTime();
const deal = (name: string, key: string | null) => ({
  store: 'bingo' as const, name, price: 2, oldPrice: 3, unit: 'kom', validFrom: null, validTo: null, key, category: null, fetchedAt: 0,
});
const file: WeeklyDeals = {
  generatedAt: thursday,
  city: 'Sarajevo',
  stores: { bingo: [deal('Mlijeko 1 l', 'mlijeko'), deal('Nešto novo', 'ne-postoji')], mercator: [] },
};

describe('weekly deals', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects files that are not ours', () => {
    expect(parseWeeklyDeals(null)).toBeNull();
    expect(parseWeeklyDeals({ stores: {} })).toBeNull();
    expect(parseWeeklyDeals(file)?.city).toBe('Sarajevo');
  });

  it('takes new files, but not over a store checked by hand that day or later', () => {
    const checked = { bingo: '2026-10-29', mercator: '2026-10-28' } as Record<string, string>;
    expect(storesToTake(file, 0, (s) => checked[s] ?? null)).toEqual(['mercator']);
    expect(storesToTake(file, thursday, () => null)).toEqual([]);
  });

  it('loads the file into the database once, re-checking keys against the local catalog', async () => {
    const d = new MealsDb('weekly-test');
    await d.open();
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => void storage.set(k, v),
      removeItem: (k: string) => void storage.delete(k),
    });
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(file)));
    vi.stubGlobal('fetch', fetchMock);
    setItem('dealsChecked:mercator', '2026-10-30');

    expect(await syncWeeklyDeals(d)).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/deals\.json$/), { cache: 'no-store' });
    const saved = await d.deals.toArray();
    expect(saved.map((x) => [x.name, x.key])).toEqual([['Mlijeko 1 l', 'mlijeko'], ['Nešto novo', null]]);
    expect(getItem('dealsChecked:bingo')).toBe('2026-10-29');

    expect(await syncWeeklyDeals(d)).toBe(0);
    await d.delete();
  });
});
