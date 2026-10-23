import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import App from '../../App';

describe('health tab navigation', () => {
  it('navigates to Health tab without crashing', async () => {
    const user = userEvent.setup();
    await render(<App />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy());
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    // If profile modal shows up, fill it or bypass it
    try {
      const profileModal = await waitFor(() => screen.getByText('Complete your profile'), { timeout: 3000 });
      if (profileModal) {
        await user.type(screen.getByLabelText('Full name'), 'Asha Sharma');
        await user.type(screen.getByLabelText('Mobile number'), '9876543210');
        await user.type(screen.getByLabelText('Age'), '32');
        await user.press(screen.getByRole('tab', { name: 'Female' }));
        await user.press(screen.getByRole('button', { name: 'Save & continue' }));
        await waitFor(() => expect(screen.queryByText('Complete your profile')).toBeNull());
      }
    } catch {
      // already completed
    }

    // Now look for Health tab button
    await waitFor(() => expect(screen.getByText('Health')).toBeTruthy());
    const healthTab = screen.getByText('Health');
    await user.press(healthTab);

    // Check if Health timeline rendered or crashed
    await waitFor(() => {
      expect(screen.getByText('Patient Health Chart')).toBeTruthy();
    }, { timeout: 5000 });
  }, 30_000);
});
