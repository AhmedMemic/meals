import { UNITS, type Qty, type Unit } from '../types';

/** Lowercase, trimmed, single spaces. Keeps č ć š ž đ. */
export function normalizeKey(name: string): string {
  return name.trim().toLocaleLowerCase('bs').replace(/\s+/g, ' ');
}

/** For search: also ignores diacritics, so "cevapi" finds "ćevapi". */
export function searchKey(s: string): string {
  return normalizeKey(s)
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// Units that convert into a base unit (g, ml).
const BASE: Partial<Record<Unit, { base: Unit; factor: number }>> = {
  kg: { base: 'g', factor: 1000 },
  l: { base: 'ml', factor: 1000 },
};

function toBase(q: Qty): Qty {
  const conv = BASE[q.unit];
  if (!conv || q.amount === null) return conv ? { amount: null, unit: conv.base } : q;
  return { amount: round(q.amount * conv.factor), unit: conv.base };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Adds q to a list of quantities, combining the same (or convertible) unit. */
export function addQty(list: Qty[], q: Qty): Qty[] {
  const b = toBase(q);
  const out = list.map(toBase);
  const i = out.findIndex((x) => x.unit === b.unit);
  if (i === -1) return [...out, b];
  const cur = out[i]!;
  // Unknown amount ("malo") + known amount: keep the known one.
  const amount = cur.amount === null ? b.amount : b.amount === null ? cur.amount : round(cur.amount + b.amount);
  out[i] = { amount, unit: b.unit };
  return out;
}

export function sumQty(qs: Qty[]): Qty[] {
  return qs.reduce<Qty[]>(addQty, []);
}

export function formatNumber(n: number): string {
  return String(round(n)).replace('.', ',');
}

export function formatQty(q: Qty): string {
  if (q.amount === null) return '';
  if (q.unit === 'g' && q.amount >= 1000) return `${formatNumber(q.amount / 1000)} kg`;
  if (q.unit === 'ml' && q.amount >= 1000) return `${formatNumber(q.amount / 1000)} l`;
  return `${formatNumber(q.amount)} ${q.unit}`;
}

/** "3 kom + 1 glavica" */
export function formatQtyList(qs: Qty[]): string {
  return qs.map(formatQty).filter(Boolean).join(' + ');
}

export function isUnit(s: string): s is Unit {
  return (UNITS as readonly string[]).includes(s);
}

/** Parses quick input like "2 l mlijeko", "mlijeko 2l", "3 jaja", "hljeb". */
export function parseQuickInput(input: string): { name: string; qty: Qty | null } {
  const text = input.trim().replace(/\s+/g, ' ');
  const num = '(\\d+(?:[.,]\\d+)?)';
  const unit = `(${[...UNITS].sort((a, b) => b.length - a.length).join('|')})?`;
  const lead = new RegExp(`^${num}\\s*${unit}\\.?\\s+(.+)$`, 'iu').exec(text);
  const trail = lead ? null : new RegExp(`^(.+?)\\s+${num}\\s*${unit}\\.?$`, 'iu').exec(text);
  if (lead) return make(lead[3]!, lead[1]!, lead[2]);
  if (trail) return make(trail[1]!, trail[2]!, trail[3]);
  return { name: text, qty: null };

  function make(name: string, amount: string, u: string | undefined) {
    const lower = u?.toLocaleLowerCase('bs');
    return {
      name: name.trim(),
      qty: { amount: Number(amount.replace(',', '.')), unit: lower && isUnit(lower) ? lower : 'kom' } as Qty,
    };
  }
}

/** Parses an edited amount like "2 kg" or "3 kom + 1 glavica". Invalid parts are ignored. */
export function parseQtyText(text: string): Qty[] {
  const out: Qty[] = [];
  for (const part of text.split('+')) {
    const m = /^(\d+(?:[.,]\d+)?)\s*(\S+)?$/u.exec(part.trim());
    if (!m) continue;
    const unit = m[2]?.toLocaleLowerCase('bs');
    out.push({ amount: Number(m[1]!.replace(',', '.')), unit: unit && isUnit(unit) ? unit : 'kom' });
  }
  return sumQty(out);
}
