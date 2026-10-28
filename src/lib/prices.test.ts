import { describe, expect, it } from 'vitest';
import type { CatalogItem, Deal, PriceRecord } from '../types';
import {
  activeDeals,
  cleanDeals,
  cleanReceipt,
  dealsByKey,
  discount,
  formatKm,
  groupDeals,
  latestPrices,
  parsePrice,
} from './prices';

const catalog = new Map<string, CatalogItem>(
  ['mlijeko', 'jaja', 'piletina'].map((key) => [
    key,
    { key, name: key, category: key === 'piletina' ? 'meso' : 'mlijecni', staple: false, groups: [], useCount: 0, lastUsed: 0 },
  ]),
);

function deal(name: string, price: number, extra: Partial<Deal> = {}): Deal {
  return { store: 'bingo', name, price, oldPrice: null, unit: 'kom', validFrom: null, validTo: null, key: null, category: null, fetchedAt: 0, ...extra };
}

describe('prices', () => {
  it('parses and formats KM', () => {
    expect(parsePrice('1,85')).toBe(1.85);
    expect(parsePrice('2.5 KM')).toBe(2.5);
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('0')).toBeNull();
    expect(formatKm(1.5)).toBe('1,50 KM');
  });

  it('computes discounts only for a real old price', () => {
    expect(discount({ price: 7, oldPrice: 10 })).toBe(30);
    expect(discount({ price: 7, oldPrice: null })).toBeNull();
    expect(discount({ price: 10, oldPrice: 7 })).toBeNull();
  });

  it('drops ended sales', () => {
    const ds = [deal('a', 1, { validTo: '2026-10-27' }), deal('b', 1, { validTo: '2026-10-28' }), deal('c', 1)];
    expect(activeDeals(ds, '2026-10-28').map((d) => d.name)).toEqual(['b', 'c']);
  });

  it('groups sales: list first, then what we buy, then big discounts', () => {
    const g = groupDeals(
      [
        deal('Mlijeko', 1.5, { key: 'mlijeko' }),
        deal('Jaja', 3, { key: 'jaja' }),
        deal('Čokolada', 1, { oldPrice: 2 }),
        deal('Keks', 1.8, { oldPrice: 2 }),
      ],
      new Set(['mlijeko']),
      new Set(['jaja', 'mlijeko']),
    );
    expect(g.forList.map((d) => d.name)).toEqual(['Mlijeko']);
    expect(g.usual.map((d) => d.name)).toEqual(['Jaja']);
    expect(g.big.map((d) => d.name)).toEqual(['Čokolada']);
    expect(g.other.map((d) => d.name)).toEqual(['Keks']);
  });

  it('picks the cheapest sale per item', () => {
    const m = dealsByKey([deal('a', 2, { key: 'jaja' }), deal('b', 1.5, { key: 'jaja', store: 'mercator' }), deal('c', 1)]);
    expect(m.get('jaja')?.store).toBe('mercator');
    expect(m.size).toBe(1);
  });

  it('keeps the latest price per store, cheapest first', () => {
    const r = (store: PriceRecord['store'], price: number, date: string): PriceRecord => ({
      key: 'jaja', name: 'Jaja', store, price, unit: 'kom', date, source: 'racun',
    });
    const out = latestPrices([r('bingo', 3, '2026-10-01'), r('bingo', 3.5, '2026-10-20'), r('mercator', 3.2, '2026-10-10')]);
    expect(out.map((x) => [x.store, x.price])).toEqual([['mercator', 3.2], ['bingo', 3.5]]);
  });

  it('cleans sales from the AI: bad rows, unknown keys, bad dates, duplicates', () => {
    const out = cleanDeals(
      [
        { name: 'Mlijeko Meggle 1 l', price: 1.79, oldPrice: 2.19, unit: '1 l', validFrom: '2026-10-26', validTo: '28.10.', key: 'Mlijeko' },
        { name: 'Mlijeko Meggle 1 l', price: 1.79 },
        { name: 'Bušilica', price: 99, key: 'bušilica' },
        { name: '', price: 1 },
        { name: 'Nešto', price: 'skupo' },
      ],
      'bingo',
      catalog,
      5,
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ key: 'mlijeko', category: 'mlijecni', validFrom: '2026-10-26', validTo: null, oldPrice: 2.19, fetchedAt: 5 });
    expect(out[1]).toMatchObject({ name: 'Bušilica', key: null, category: null });
  });

  it('cleans a receipt from the AI', () => {
    const r = cleanReceipt(
      {
        store: 'penny',
        date: '2026-10-28',
        items: [
          { name: 'Pileća prsa', price: 12.9, unit: 'kg', key: 'piletina' },
          { name: 'Kesa', price: 0, unit: '', key: null },
        ],
      },
      catalog,
    );
    expect(r.store).toBe('penny');
    expect(r.lines).toEqual([{ name: 'Pileća prsa', price: 12.9, unit: 'kg', key: 'piletina', category: 'meso' }]);
    expect(cleanReceipt({ store: 'lidl', items: [] }, catalog).store).toBe('ostalo');
  });
});
