import { buildTimelineSections, collectProviders, collectTags, countByType, validateRecordDraft } from '@/modules/health/utils';

import type { HealthRecord } from '@/modules/health/types';

function makeRecord(overrides: Partial<HealthRecord> = {}): HealthRecord {
  return {
    id: 'rec_1',
    type: 'lab_report',
    title: 'Test record',
    description: '',
    date: '2026-05-10T10:00:00.000Z',
    provider: 'Apollo',
    tags: [],
    attachments: [],
    meta: {},
    searchText: '',
    ...overrides,
  };
}

describe('buildTimelineSections', () => {
  const records = [
    makeRecord({ id: 'a', date: '2026-05-10T10:00:00.000Z' }),
    makeRecord({ id: 'b', date: '2026-05-20T10:00:00.000Z' }),
    makeRecord({ id: 'c', date: '2025-12-01T10:00:00.000Z' }),
  ];

  it('groups by month with human labels', () => {
    const sections = buildTimelineSections(records, 'month');
    expect(sections.map((s) => s.key)).toEqual(['2026-05', '2025-12']);
    expect(sections[0].title).toBe('May 2026');
    expect(sections[0].data.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('groups by year', () => {
    const sections = buildTimelineSections(records, 'year');
    expect(sections.map((s) => s.key)).toEqual(['2026', '2025']);
  });

  it('returns a single ungrouped section when groupBy is none', () => {
    const sections = buildTimelineSections(records, 'none');
    expect(sections).toHaveLength(1);
    expect(sections[0].data).toHaveLength(3);
  });

  it('returns no sections for an empty list', () => {
    expect(buildTimelineSections([], 'month')).toEqual([]);
  });
});

describe('collectors', () => {
  const records = [
    makeRecord({ id: 'a', tags: ['routine', 'urgent'], provider: 'Apollo' }),
    makeRecord({ id: 'b', tags: ['routine'], provider: 'Kottakkal' }),
  ];

  it('collects unique sorted tags', () => {
    expect(collectTags(records)).toEqual(['routine', 'urgent']);
  });

  it('collects unique sorted providers', () => {
    expect(collectProviders(records)).toEqual(['Apollo', 'Kottakkal']);
  });

  it('counts records by type', () => {
    const counts = countByType([makeRecord({ type: 'allergy' }), makeRecord({ type: 'allergy' }), makeRecord()]);
    expect(counts.allergy).toBe(2);
    expect(counts.lab_report).toBe(1);
    expect(counts.vaccination).toBe(0);
  });
});

describe('validateRecordDraft', () => {
  const tomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  it('accepts a complete draft', () => {
    const result = validateRecordDraft({
      title: 'CBC',
      date: new Date().toISOString().slice(0, 10),
      provider: 'Apollo',
    });
    expect(result.ok).toBe(true);
  });

  it('requires title, date and provider', () => {
    const result = validateRecordDraft({ title: '', date: '', provider: '' });
    expect(result.ok).toBe(false);
    expect(result.errors.title).toBeTruthy();
    expect(result.errors.date).toBeTruthy();
    expect(result.errors.provider).toBeTruthy();
  });

  it('rejects future dates', () => {
    const result = validateRecordDraft({ title: 'x', date: tomorrow, provider: 'y' });
    expect(result.errors.date).toContain('future');
  });

  it('rejects malformed dates', () => {
    const result = validateRecordDraft({ title: 'x', date: 'not-a-date', provider: 'y' });
    expect(result.errors.date).toBe('Invalid date');
  });
});
