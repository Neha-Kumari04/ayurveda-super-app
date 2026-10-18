import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { logger } from '@/core/logger/logger';
import { storage } from '@/core/storage/storage';

export type Gender = 'male' | 'female' | 'other';

/**
 * User details captured by the details forms — shown after sign-in,
 * during checkout and during appointment booking.
 */
export interface UserProfile {
  fullName: string;
  phone: string;
  email: string;
  gender: Gender | '';
  age: string;
  address: string;
  city: string;
  pincode: string;
}

export const EMPTY_PROFILE: UserProfile = {
  fullName: '',
  phone: '',
  email: '',
  gender: '',
  age: '',
  address: '',
  city: '',
  pincode: '',
};

interface ProfileState {
  profile: UserProfile;
  isHydrated: boolean;

  /** Merges the given fields into the saved profile. */
  saveProfile: (patch: Partial<UserProfile>) => void;
  resetProfile: () => void;
  setHydrated: (value: boolean) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: { ...EMPTY_PROFILE },
      isHydrated: false,

      saveProfile: (patch) => {
        set({ profile: { ...get().profile, ...patch } });
        logger.info('Profile details saved', { fields: Object.keys(patch) });
      },

      resetProfile: () => set({ profile: { ...EMPTY_PROFILE } }),
      setHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: 'profile',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ profile: state.profile }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Identity fields captured right after sign-in. */
export function isIdentityComplete(profile: UserProfile): boolean {
  return profile.fullName.trim().length >= 2 && /^\d{10}$/.test(profile.phone);
}

/** Delivery address captured during checkout. */
export function isAddressComplete(profile: UserProfile): boolean {
  return Boolean(profile.address.trim() && profile.city.trim() && /^\d{6}$/.test(profile.pincode));
}

/** Patient details confirmed during appointment booking. */
export function isPatientComplete(profile: UserProfile): boolean {
  return profile.fullName.trim().length >= 2 && profile.age !== '' && profile.gender !== '';
}
