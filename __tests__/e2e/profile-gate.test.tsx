import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import App from '../../App';

/**
 * The post-sign-in profile gate must give clear feedback when a required
 * field is missing instead of silently doing nothing on submit.
 */
describe('profile gate validation', () => {
  it('blocks submit and shows a banner until all required fields are valid', async () => {
    const user = userEvent.setup();
    await render(<App />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy());
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Complete your profile')).toBeTruthy());
    await user.type(screen.getByLabelText('Full name'), 'Asha Sharma');
    await user.type(screen.getByLabelText('Mobile number'), '9876543210');
    await user.type(screen.getByLabelText('Age'), '32');

    // Gender intentionally left unselected — submitting must not dismiss the gate.
    await user.press(screen.getByRole('button', { name: 'Save & continue' }));
    await waitFor(() =>
      expect(screen.getByText('Please fix the highlighted fields to continue')).toBeTruthy(),
    );
    expect(screen.getByText('Complete your profile')).toBeTruthy();

    // Selecting the missing field unblocks submission.
    await user.press(screen.getByRole('tab', { name: 'Female' }));
    await user.press(screen.getByRole('button', { name: 'Save & continue' }));
    await waitFor(() => expect(screen.queryByText('Complete your profile')).toBeNull());
  }, 20_000);
});
