import { buildSearchText, matchesQuery, normalizeQuery, scoreMatch } from '@/utils/search';

describe('search utils', () => {
  it('normalizeQuery trims and lowercases', () => {
    expect(normalizeQuery('  Ashwagandha   Capsule ')).toBe('ashwagandha capsule');
  });

  it('matchesQuery requires every term', () => {
    const haystack = 'ashwagandha capsule stress relief';
    expect(matchesQuery(haystack, 'ashwagandha')).toBe(true);
    expect(matchesQuery(haystack, 'ashwagandha capsule')).toBe(true);
    expect(matchesQuery(haystack, 'ashwagandha shilajit')).toBe(false);
  });

  it('matchesQuery is true for empty query', () => {
    expect(matchesQuery('anything', '')).toBe(true);
  });

  it('scoreMatch ranks primary-field matches higher', () => {
    const item = { searchText: 'generic supplement with ashwagandha', primaryText: 'ashwagandha capsule' };
    expect(scoreMatch(item, 'ashwagandha')).toBe(2);
    expect(scoreMatch({ ...item, primaryText: 'triphala churna' }, 'ashwagandha')).toBe(1);
  });

  it('buildSearchText flattens arrays and lowercases', () => {
    expect(buildSearchText('Apple', ['Banana', 'Cherry'], undefined, 42)).toBe('apple banana cherry 42');
  });
});
