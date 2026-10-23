const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function isPast(iso: string, now = new Date()): boolean {
  return new Date(iso).getTime() <= now.getTime();
}

/** "2026-10" — the grouping key used by the health timeline. */
export function monthKey(iso: string): string {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
}

/** "2026" — year grouping key. */
export function yearKey(iso: string): string {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return `${d.getFullYear()}`;
}

/** Human label for a month key, e.g. "October 2026". */
export function monthLabel(key: string, locale = 'en-US'): string {
  if (!key || key === 'Unknown') return 'Other Records';
  try {
    const parts = key.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (!year || !month || Number.isNaN(year) || Number.isNaN(month)) return key;
    const d = new Date(year, month - 1, 1);
    const validLocale = locale === 'hi' ? 'hi-IN' : locale || 'en-US';
    return d.toLocaleDateString(validLocale, { month: 'long', year: 'numeric' });
  } catch {
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = key.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    return `${MONTHS[(month - 1) % 12] || ''} ${year || ''}`.trim() || key;
  }
}

/** Groups items by a derived key while preserving chronological ordering. */
export function groupBySortedKeys<T>(
  items: readonly T[],
  keyFn: (item: T) => string,
  descending = true,
): Array<{ key: string; data: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (descending ? b.localeCompare(a) : a.localeCompare(b)))
    .map(([key, data]) => ({ key, data }));
}
