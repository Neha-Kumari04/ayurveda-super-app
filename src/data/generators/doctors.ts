import { buildSearchText } from '@/utils/search';
import { createRng, pick, pickMany, randomFloat, randomInt } from '@/utils/rng';
import { addDays } from '@/utils/date';

import type {
  Doctor,
  DoctorGender,
  DoctorSpecialty,
  TimeSlot,
} from '@/modules/consultation/types';

const SPECIALTIES: DoctorSpecialty[] = [
  'Panchakarma',
  'Kayachikitsa',
  'Shalya Tantra',
  'Shalakya Tantra',
  'Prasuti Tantra',
  'Kaumarbhritya',
  'Agada Tantra',
];

const CITIES = [
  'Pune',
  'Kerala',
  'Bengaluru',
  'Mysuru',
  'Varanasi',
  'Hyderabad',
  'Chennai',
  'Delhi',
  'Jaipur',
  'Kolkata',
  'Nagpur',
  'Indore',
  'Kochi',
  'Thrissur',
  'Coimbatore',
];

const LANGUAGES = ['Hindi', 'English', 'Sanskrit', 'Marathi', 'Tamil', 'Malayalam', 'Kannada', 'Bengali'];

const GENDERS: DoctorGender[] = ['male', 'female', 'other'];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Kabir', 'Ishaan', 'Shaurya', 'Atharv', 'Advait',
  'Ananya', 'Diya', 'Ira', 'Kavya', 'Meera', 'Nisha', 'Priya', 'Riya', 'Saanvi', 'Tanvi',
  'Acharya', 'Vaidya', 'Ojha', 'Mishra', 'Sharma', 'Verma', 'Nair', 'Iyer', 'Gupta', 'Reddy',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Nair', 'Iyer', 'Gupta', 'Reddy', 'Patil', 'Joshi', 'Menon', 'Pillai',
  'Bhat', 'Kulkarni', 'Desai', 'Chatterjee', 'Banerjee', 'Rao', 'Shetty', 'Mishra', 'Pandey', 'Singh',
];

const QUALIFICATIONS = [
  'BAMS', 'MD (Ayurveda)', 'MS (Shalya Tantra)', 'BUMS', 'BHMS', 'PhD (Ayurveda)',
  'MD (Panchakarma)', 'MD (Kayachikitsa)', 'PG Dip. Panchakarma',
];

const CLINIC_NAMES = [
  'Sanjeevani Ayurvedic Clinic', 'Dhanvantari Wellness', 'Ayush Healing Centre', 'Prakriti Ayurveda',
  'Veda Wellness Clinic', 'Amrita Ayurvedic Hospital', 'Jeevaniya Health', 'Nirvana Ayurveda',
  'Kaya Chikitsa Centre', 'Ojas Wellness', 'Swasthya Ayurved', 'Charaka Clinic',
];

const AVATAR_COLORS = ['4A90D9', '7B61FF', '50C878', 'E8A838', 'E4572E', '17BEBB', 'FF6F91', '6C5CE7'];

export const DOCTOR_COUNT = 5000;
const SEED = 20261018;

function avatarUrl(id: string, color: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${id}&backgroundColor=${color}`;
}

function generateDoctors(): Doctor[] {
  const rng = createRng(SEED);
  const now = new Date();
  const doctors: Doctor[] = [];

  for (let i = 0; i < DOCTOR_COUNT; i++) {
    const id = `doc_${i + 1}`;
    const gender = pick(rng, GENDERS);
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const name = `Dr. ${first} ${last}`;
    const specialty = pick(rng, SPECIALTIES);
    const city = pick(rng, CITIES);
    const experienceYears = randomInt(rng, 1, 35);
    const rating = randomFloat(rng, 3.0, 5.0, 1);
    const reviewCount = randomInt(rng, 0, 2500);
    const fee = randomInt(rng, 300, 2500) * 10;
    const languages = pickMany(rng, LANGUAGES, randomInt(rng, 1, 3));
    const qualifications = pickMany(rng, QUALIFICATIONS, randomInt(rng, 1, 2));
    const specializations = pickMany(rng, SPECIALTIES, randomInt(rng, 1, 2));
    const clinicName = pick(rng, CLINIC_NAMES);
    const isAvailable = rng() > 0.12;
    const nextAvailableAt = addDays(now, randomInt(rng, 0, 14)).toISOString();
    const bio = `${name} is a ${experienceYears}-year experienced Ayurvedic physician practising ${specialty} at ${clinicName}, ${city}. Trained in classical Panchakarma and herbal formulations.`;

    const primaryText = `${name} ${clinicName}`.toLowerCase();
    const searchText = buildSearchText(name, specialty, city, languages, qualifications, clinicName, bio);

    doctors.push({
      id,
      name,
      specialty,
      experienceYears,
      rating,
      reviewCount,
      fee,
      gender,
      languages,
      city,
      clinicName,
      avatarUrl: avatarUrl(name, AVATAR_COLORS[i % AVATAR_COLORS.length]),
      bio,
      qualifications,
      specializations,
      nextAvailableAt,
      isAvailable,
      searchText: `${primaryText} ${searchText}`,
    });
  }

  // Stable pre-sorted by rating desc for the default listing order.
  doctors.sort((a, b) => b.rating - a.rating);
  return doctors;
}

let cached: Doctor[] | null = null;

/** Lazily generated, memoised singleton dataset (generated once per app run). */
export function getDoctors(): Doctor[] {
  if (!cached) cached = generateDoctors();
  return cached;
}

const SLOT_CACHE = new Map<string, TimeSlot[]>();

/**
 * Deterministic slots for a doctor on a given date, generated on demand.
 * Slots are 30 minutes between 09:00 and 17:00 local time.
 */
export function getSlotsForDate(doctorId: string, date: Date): TimeSlot[] {
  const key = `${doctorId}:${date.toDateString()}`;
  const hit = SLOT_CACHE.get(key);
  if (hit) return hit;

  const rng = createRng(hashCode(key));
  const slots: TimeSlot[] = [];
  const day = new Date(date);
  day.setHours(9, 0, 0, 0);

  for (let i = 0; i < 16; i++) {
    const start = new Date(day.getTime() + i * 30 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    slots.push({
      id: `${doctorId}_${start.toISOString()}`,
      doctorId,
      start: start.toISOString(),
      end: end.toISOString(),
      isBooked: rng() < 0.35,
    });
  }

  SLOT_CACHE.set(key, slots);
  return slots;
}

/** Marks a slot booked so the in-memory backend reflects confirmed bookings. */
export function markSlotBooked(slotId: string): void {
  for (const slots of SLOT_CACHE.values()) {
    const slot = slots.find((s) => s.id === slotId);
    if (slot) {
      slot.isBooked = true;
      return;
    }
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
