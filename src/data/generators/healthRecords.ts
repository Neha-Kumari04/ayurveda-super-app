import { buildSearchText } from '@/utils/search';
import { createRng, pick, pickMany, randomInt } from '@/utils/rng';

import type { Attachment, HealthRecord, RecordType } from '@/modules/health/types';

const TYPES: RecordType[] = ['lab_report', 'prescription', 'consultation', 'vaccination', 'allergy'];

const PROVIDERS = [
  'Apollo Ayurveda', 'Kottakkal Arya Vaidya Sala', 'Dhanwanthari Hospital', 'Aster Medcity',
  'Sanjeevani Clinic', 'Kerala Ayurveda Centre', 'Ayush Wellness Trust', 'Manipal Hospitals',
  'NIMHANS Ayurveda Wing', 'Government Ayurveda College', 'Jiva Ayurveda', 'Dr. Mehta\'s Clinic',
];

const TAG_POOL = [
  'routine', 'urgent', 'follow-up', 'chronic', 'seasonal', 'pre-surgery', 'post-op',
  'wellness', 'diagnostic', 'preventive', 'pediatric', 'maternity', 'allergy-season',
];

const LAB_PANELS = [
  'Complete Blood Count', 'Lipid Profile', 'Liver Function Test', 'Kidney Function Test',
  'Thyroid Profile', 'Vitamin D', 'Vitamin B12', 'HbA1c', 'Fasting Blood Sugar',
  'Urinalysis', 'CRP', 'ESR',
];

const MEDICINES = [
  'Ashwagandha Churna', 'Triphala Churna', 'Avipattikar Churna', 'Chandraprabha Vati',
  'Kaishore Guggulu', 'Yogaraj Guggulu', 'Brahmi Vati', 'Shankhpushpi Syrup',
  'Arogyavardhini Vati', 'Punarnavadi Kashayam', 'Dasamoola Kashayam', 'Guduchi Satva',
];

const VACCINES = [
  'Hepatitis B', 'Tetanus Toxoid', 'Typhoid Vi', 'Influenza (Flu)', 'COVID-19 Booster',
  'Pneumococcal', 'Japanese Encephalitis', 'Rabies',
];

const ALLERGENS = [
  'Peanuts', 'Shellfish', 'Pollen', 'Dust mites', 'Latex', 'Penicillin', 'Sulfa drugs',
  'Asafoetida (Hing)', 'Tree nuts', 'Milk', 'Sesame', 'Mustard',
];

const REACTIONS = [
  'Mild rash', 'Anaphylaxis', 'Hives', 'Swelling of lips', 'Itching', 'Gastric upset',
  'Shortness of breath', 'Headache',
];

const PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const IMAGE_URL = 'https://picsum.photos/seed';

export const RECORD_COUNT = 10000;
const SEED = 777777;

function makeAttachments(rng: () => number, index: number): Attachment[] {
  const count = randomInt(rng, 0, 2);
  const attachments: Attachment[] = [];
  for (let i = 0; i < count; i++) {
    const useImage = rng() > 0.4;
    attachments.push({
      id: `att_${index}_${i}`,
      name: useImage ? `scan_${index}_${i}.jpg` : `report_${index}_${i}.pdf`,
      kind: useImage ? 'image' : 'pdf',
      url: useImage ? `${IMAGE_URL}/rec${index}${i}/400/300` : PDF_URL,
      sizeKb: randomInt(rng, 40, 4000),
    });
  }
  return attachments;
}

function buildMeta(rng: () => number, type: RecordType, index: number): Record<string, string | number | boolean | string[]> {
  switch (type) {
    case 'lab_report': {
      const panel = pick(rng, LAB_PANELS);
      return {
        panel,
        result: rng() > 0.25 ? 'Normal' : 'Abnormal',
        value: randomInt(rng, 2, 220),
        unit: pick(rng, ['mg/dL', 'cells/uL', 'ng/mL', 'IU/L', '%']),
        fasting: rng() > 0.5,
        referenceRange: 'Within normal limits',
      };
    }
    case 'prescription': {
      const meds = pickMany(rng, MEDICINES, randomInt(rng, 1, 3));
      return {
        medicines: meds,
        dosage: pick(rng, ['1 tsp twice daily', '2 tablets BD', '1 capsule TDS', '5ml with warm water']),
        durationDays: randomInt(rng, 7, 90),
        refills: randomInt(rng, 0, 3),
      };
    }
    case 'consultation':
      return {
        diagnosis: pick(rng, ['Sandhivata', 'Amlapitta', 'Pandu', 'Kasa', 'Shwasa', 'Ama Vata']),
        followUpDays: randomInt(rng, 7, 60),
        pulseTaken: rng() > 0.3,
        panchakarma: pick(rng, ['Abhyanga', 'Shirodhara', 'Virechana', 'Basti', 'None']),
      };
    case 'vaccination':
      return {
        vaccine: pick(rng, VACCINES),
        dose: `${randomInt(rng, 1, 3)} of ${randomInt(rng, 1, 3)}`,
        batchNo: `B${randomInt(rng, 10000, 99999)}`,
        nextDueDays: randomInt(rng, 90, 1460),
      };
    case 'allergy':
      return {
        allergen: pick(rng, ALLERGENS),
        severity: pick(rng, ['mild', 'moderate', 'severe']),
        reaction: pick(rng, REACTIONS),
        verifiedBySkinTest: rng() > 0.5,
      };
    default:
      return { note: `record ${index}` };
  }
}

function titleFor(type: RecordType, meta: Record<string, unknown>, index: number): string {
  switch (type) {
    case 'lab_report': return `${String(meta.panel)} — Lab Report`;
    case 'prescription': return `Prescription #${index}`;
    case 'consultation': return `Consultation — ${String(meta.diagnosis)}`;
    case 'vaccination': return `${String(meta.vaccine)} Vaccination`;
    case 'allergy': return `Allergy: ${String(meta.allergen)}`;
    default: return `Record ${index}`;
  }
}

function descriptionFor(type: RecordType, meta: Record<string, string | number | boolean | string[]>): string {
  switch (type) {
    case 'lab_report': return `Result: ${meta.result} (${meta.value} ${meta.unit}). Reference: ${meta.referenceRange}.`;
    case 'prescription': return `${(meta.medicines as string[]).join(', ')} — ${meta.dosage} for ${meta.durationDays} days.`;
    case 'consultation': return `Diagnosed ${meta.diagnosis}. Follow-up in ${meta.followUpDays} days. Panchakarma: ${meta.panchakarma}.`;
    case 'vaccination': return `${meta.vaccine}, dose ${meta.dose}. Batch ${meta.batchNo}. Next due in ${meta.nextDueDays} days.`;
    case 'allergy': return `${meta.allergen} (${meta.severity}) — ${meta.reaction}.`;
    default: return '';
  }
}

function generateRecords(): HealthRecord[] {
  const rng = createRng(SEED);
  const records: HealthRecord[] = [];
  const now = new Date();

  for (let i = 0; i < RECORD_COUNT; i++) {
    const id = `rec_${i + 1}`;
    const type = pick(rng, TYPES);
    // Spread across the past 6 years.
    const daysAgo = randomInt(rng, 0, 2190);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const provider = pick(rng, PROVIDERS);
    const tags = pickMany(rng, TAG_POOL, randomInt(rng, 0, 3));
    const attachments = makeAttachments(rng, i);
    const meta = buildMeta(rng, type, i);
    const title = titleFor(type, meta, i);
    const description = descriptionFor(type, meta);

    const primaryText = title.toLowerCase();
    const searchText = buildSearchText(title, description, provider, tags, type, Object.values(meta).flat());

    records.push({
      id,
      type,
      title,
      description,
      date: date.toISOString(),
      provider,
      tags,
      attachments,
      meta,
      searchText: `${primaryText} ${searchText}`,
    });
  }

  // Chronological desc — matches the default timeline order.
  records.sort((a, b) => b.date.localeCompare(a.date));
  return records;
}

let cached: HealthRecord[] | null = null;

/** Lazily generated, memoised singleton dataset (generated once per app run). */
export function getRecords(): HealthRecord[] {
  if (!cached) cached = generateRecords();
  return cached;
}

let byIdCache: Map<string, HealthRecord> | null = null;

export function getRecordById(id: string): HealthRecord | undefined {
  if (!byIdCache) {
    byIdCache = new Map(getRecords().map((r) => [r.id, r]));
  }
  return byIdCache.get(id);
}
