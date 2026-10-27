import { describe, expect, it } from 'vitest';
import { addQty, formatQty, formatQtyList, normalizeKey, parseQtyText, parseQuickInput, searchKey, sumQty } from './units';

describe('units', () => {
  it('combines the same unit', () => {
    expect(sumQty([{ amount: 2, unit: 'kom' }, { amount: 1, unit: 'kom' }])).toEqual([{ amount: 3, unit: 'kom' }]);
  });

  it('converts kg and g, l and ml', () => {
    const q = sumQty([{ amount: 0.5, unit: 'kg' }, { amount: 700, unit: 'g' }]);
    expect(q).toEqual([{ amount: 1200, unit: 'g' }]);
    expect(formatQtyList(q)).toBe('1,2 kg');
    expect(formatQtyList(sumQty([{ amount: 0.2, unit: 'l' }, { amount: 0.3, unit: 'l' }]))).toBe('500 ml');
  });

  it('keeps different units side by side', () => {
    const q = addQty([{ amount: 3, unit: 'kom' }], { amount: 1, unit: 'glavica' });
    expect(formatQtyList(q)).toBe('3 kom + 1 glavica');
  });

  it('handles unknown amounts', () => {
    expect(sumQty([{ amount: null, unit: 'paket' }, { amount: null, unit: 'paket' }])).toEqual([{ amount: null, unit: 'paket' }]);
    expect(sumQty([{ amount: null, unit: 'kg' }, { amount: 0.5, unit: 'kg' }])).toEqual([{ amount: 500, unit: 'g' }]);
    expect(formatQty({ amount: null, unit: 'kom' })).toBe('');
  });

  it('avoids floating point noise', () => {
    expect(sumQty([{ amount: 0.1, unit: 'kom' }, { amount: 0.2, unit: 'kom' }])).toEqual([{ amount: 0.3, unit: 'kom' }]);
  });

  it('normalises names and search keys', () => {
    expect(normalizeKey('  Bijeli   LUK ')).toBe('bijeli luk');
    expect(normalizeKey('ĆEVAPI')).toBe('ćevapi');
    expect(searchKey('Ćevapi')).toBe('cevapi');
    expect(searchKey('Đuveč')).toBe('djuvec');
  });

  it('parses quick input', () => {
    expect(parseQuickInput('hljeb')).toEqual({ name: 'hljeb', qty: null });
    expect(parseQuickInput('2 l mlijeko')).toEqual({ name: 'mlijeko', qty: { amount: 2, unit: 'l' } });
    expect(parseQuickInput('mlijeko 2l')).toEqual({ name: 'mlijeko', qty: { amount: 2, unit: 'l' } });
    expect(parseQuickInput('3 jaja')).toEqual({ name: 'jaja', qty: { amount: 3, unit: 'kom' } });
    expect(parseQuickInput('1,5 kg krompir')).toEqual({ name: 'krompir', qty: { amount: 1.5, unit: 'kg' } });
    expect(parseQuickInput('2 kašike šećera').qty).toEqual({ amount: 2, unit: 'kom' });
  });
});

describe('parseQtyText', () => {
  it('parses edited amounts', () => {
    expect(parseQtyText('3 kom + 1 glavica')).toEqual([{ amount: 3, unit: 'kom' }, { amount: 1, unit: 'glavica' }]);
    expect(parseQtyText('1,5 kg')).toEqual([{ amount: 1500, unit: 'g' }]);
    expect(parseQtyText('4')).toEqual([{ amount: 4, unit: 'kom' }]);
    expect(parseQtyText('')).toEqual([]);
  });
});
