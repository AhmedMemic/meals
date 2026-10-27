// Dates are local YYYY-MM-DD strings. Never use toISOString() (it shifts to UTC).

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

export function today(): string {
  return toYmd(new Date());
}

export function addDays(ymd: string, n: number): string {
  const d = fromYmd(ymd);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

/** Monday of the week containing ymd. */
export function weekStart(ymd: string): string {
  const d = fromYmd(ymd);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  return addDays(ymd, -dow);
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Day index within its week: 0 = Monday … 6 = Sunday. */
export function dayIndex(ymd: string): number {
  return (fromYmd(ymd).getDay() + 6) % 7;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromYmd(b).getTime() - fromYmd(a).getTime()) / 86_400_000);
}

/** "27.10." */
export function shortDate(ymd: string): string {
  const d = fromYmd(ymd);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}
