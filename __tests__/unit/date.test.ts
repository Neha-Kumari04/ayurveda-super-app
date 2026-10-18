import { addDays, groupBySortedKeys, isPast, monthKey, monthLabel, startOfDay, yearKey } from '@/utils/date';

describe('date utils', () => {
  it('monthKey formats a date as YYYY-MM', () => {
    expect(monthKey('2026-10-18T10:00:00.000Z')).toMatch(/^2026-\d{2}$/);
    expect(monthKey(new Date(2026, 0, 5).toISOString())).toBe('2026-01');
  });

  it('yearKey extracts the year', () => {
    expect(yearKey(new Date(2024, 5, 1).toISOString())).toBe('2024');
  });

  it('monthLabel renders a human month label', () => {
    expect(monthLabel('2026-10')).toBe('October 2026');
  });

  it('isPast compares against a clock', () => {
    const now = new Date('2026-01-10T12:00:00.000Z');
    expect(isPast('2026-01-10T11:00:00.000Z', now)).toBe(true);
    expect(isPast('2026-01-10T13:00:00.000Z', now)).toBe(false);
  });

  it('startOfDay zeroes the time', () => {
    const day = startOfDay(new Date('2026-03-15T18:42:00'));
    expect(day.getHours()).toBe(0);
    expect(day.getMinutes()).toBe(0);
  });

  it('addDays rolls over month boundaries', () => {
    const result = addDays(new Date(2026, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(1);
  });

  it('groupBySortedKeys groups and sorts descending by default', () => {
    const items = [
      { date: '2026-01-05', id: 'a' },
      { date: '2026-03-01', id: 'b' },
      { date: '2026-01-20', id: 'c' },
    ];
    const groups = groupBySortedKeys(items, (item) => monthKey(item.date));
    expect(groups.map((g) => g.key)).toEqual(['2026-03', '2026-01']);
    expect(groups[1].data.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('groupBySortedKeys supports ascending order', () => {
    const groups = groupBySortedKeys(['b', 'a', 'c'], (k) => k, false);
    expect(groups.map((g) => g.key)).toEqual(['a', 'b', 'c']);
  });
});
