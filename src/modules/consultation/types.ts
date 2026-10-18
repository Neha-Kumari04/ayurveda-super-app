import type { Syncable } from '@/types';

export type DoctorSpecialty =
  | 'Panchakarma'
  | 'Kayachikitsa'
  | 'Shalya Tantra'
  | 'Shalakya Tantra'
  | 'Prasuti Tantra'
  | 'Kaumarbhritya'
  | 'Agada Tantra';

export type DoctorGender = 'male' | 'female' | 'other';

export interface Doctor {
  id: string;
  name: string;
  specialty: DoctorSpecialty;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  fee: number;
  gender: DoctorGender;
  languages: string[];
  city: string;
  clinicName: string;
  avatarUrl: string;
  bio: string;
  qualifications: string[];
  specializations: string[];
  nextAvailableAt: string;
  isAvailable: boolean;
  searchText: string;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  /** ISO timestamp of the slot start. */
  start: string;
  end: string;
  isBooked: boolean;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'pending';

export interface Booking extends Syncable {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  start: string;
  end: string;
  fee: number;
  status: BookingStatus;
  reason?: string;
  createdAt: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface DoctorFilters {
  specialties?: DoctorSpecialty[];
  cities?: string[];
  genders?: DoctorGender[];
  minRating?: number;
  maxFee?: number;
  minExperience?: number;
  availableOnly?: boolean;
}

export type SortOption = 'rating' | 'fee_low' | 'fee_high' | 'experience' | 'next_available';

export interface DoctorSearchParams extends DoctorFilters {
  q?: string;
  sort?: SortOption;
}
