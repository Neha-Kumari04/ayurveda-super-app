import React from 'react';

import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { isIdentityComplete, useProfileStore } from '@/store/profileStore';

import { UserDetailsFormModal } from './UserDetailsFormModal';

/**
 * Mounted above the root stack while signed in — shows the user details form
 * until the identity fields (name, phone, gender, age) have been captured.
 */
export function ProfileGate() {
  const { t } = useTranslation();
  const isHydrated = useProfileStore((s) => s.isHydrated);
  const profile = useProfileStore((s) => s.profile);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const user = useAuthStore((s) => s.user);

  if (!isHydrated || isIdentityComplete(profile)) return null;

  return (
    <UserDetailsFormModal
      visible
      title={t('profile.completeTitle')}
      description={t('profile.completeDescription')}
      fields={['fullName', 'phone', 'email', 'gender', 'age']}
      defaults={user?.email ? { email: user.email } : undefined}
      submitLabel={t('profile.saveContinue')}
      onSubmit={saveProfile}
    />
  );
}
