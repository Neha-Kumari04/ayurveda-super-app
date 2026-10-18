import {
  EMPTY_PROFILE,
  isAddressComplete,
  isIdentityComplete,
  isPatientComplete,
  useProfileStore,
} from '@/store/profileStore';

describe('profile store', () => {
  beforeEach(() => {
    useProfileStore.getState().resetProfile();
  });

  it('starts from an empty profile', () => {
    expect(useProfileStore.getState().profile).toEqual(EMPTY_PROFILE);
  });

  it('merges saved patches without dropping existing fields', () => {
    const { saveProfile } = useProfileStore.getState();
    saveProfile({ fullName: 'Asha Sharma' });
    useProfileStore.getState().saveProfile({ phone: '9876543210' });
    expect(useProfileStore.getState().profile).toMatchObject({
      fullName: 'Asha Sharma',
      phone: '9876543210',
    });
  });

  it('resets back to the empty profile', () => {
    useProfileStore.getState().saveProfile({ fullName: 'Asha', phone: '9876543210' });
    useProfileStore.getState().resetProfile();
    expect(useProfileStore.getState().profile.fullName).toBe('');
  });

  describe('completeness helpers', () => {
    it('isIdentityComplete needs a name and a 10-digit phone', () => {
      expect(isIdentityComplete({ ...EMPTY_PROFILE, fullName: 'Asha Sharma' })).toBe(false);
      expect(isIdentityComplete({ ...EMPTY_PROFILE, fullName: 'Asha Sharma', phone: '98765' })).toBe(false);
      expect(isIdentityComplete({ ...EMPTY_PROFILE, fullName: 'Asha Sharma', phone: '9876543210' })).toBe(true);
    });

    it('isAddressComplete needs address, city and a 6-digit pincode', () => {
      expect(isAddressComplete({ ...EMPTY_PROFILE, address: 'Flat 12', city: 'Pune', pincode: '411001' })).toBe(true);
      expect(isAddressComplete({ ...EMPTY_PROFILE, address: 'Flat 12', city: 'Pune', pincode: '41100' })).toBe(false);
    });

    it('isPatientComplete needs name, age and gender', () => {
      expect(isPatientComplete({ ...EMPTY_PROFILE, fullName: 'Asha', age: '32', gender: 'female' })).toBe(true);
      expect(isPatientComplete({ ...EMPTY_PROFILE, fullName: 'Asha', age: '', gender: 'female' })).toBe(false);
    });
  });
});