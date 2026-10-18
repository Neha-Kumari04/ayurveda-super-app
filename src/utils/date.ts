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
  const d = new Date(iso);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
}

/** "2026" — year grouping key. */
export function yearKey(iso: string): string {
  return `${new Date(iso).getFullYear()}`;
}

/** Human label for a month key, e.g. "October 2026". */
export function monthLabel(key: string, locale = 'en-US'): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
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
