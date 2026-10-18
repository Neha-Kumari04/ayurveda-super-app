import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import App from '../../App';

/**
 * Full user journey through the real app tree:
 * sign in → open shop → open product → add to cart → cart → checkout → place order.
 */
describe('checkout flow (e2e)', () => {
  it('completes sign-in to order placement', async () => {
    const user = userEvent.setup();
    await render(<App />);

    // --- Authentication ---
    await waitFor(() => expect(screen.getByText('Ayurveda Super App')).toBeTruthy());
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    // Main tabs appear once the session is established.
    await waitFor(() => expect(screen.getByText('Consult')).toBeTruthy());

    // --- Open the shop tab ---
    await user.press(screen.getByText('Shop'));
    await waitFor(() => expect(screen.getByText('Authentic Ayurvedic essentials')).toBeTruthy());

    // Product grid loads from the generated 20k dataset.
    const cards = await screen.findAllByLabelText(/, ₹/);
    expect(cards.length).toBeGreaterThan(0);
    const productLabel = cards[0].props.accessibilityLabel as string;
    const productName = productLabel.split(', ₹')[0];

    // --- Product detail → add to cart ---
    await user.press(cards[0]);
    await waitFor(() => expect(screen.getByText('Key ingredients')).toBeTruthy());

    await user.press(screen.getByRole('button', { name: 'Add to cart' }));
    await waitFor(() => expect(screen.getByText(new RegExp(`${escapeRegExp(productName)} added to cart`))).toBeTruthy());

    // --- Buy now → cart ---
    await user.press(screen.getByRole('button', { name: 'Checkout' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Checkout · \d+ items/ })).toBeTruthy());

    // --- Cart → checkout form ---
    await user.press(screen.getByRole('button', { name: /Checkout · \d+ items/ }));
    await waitFor(() => expect(screen.getByText('Delivery address')).toBeTruthy());

    await user.type(screen.getByLabelText('Full name'), 'Asha Sharma');
    await user.type(screen.getByLabelText('Address'), 'Flat 12, MG Road');
    await user.type(screen.getByLabelText('City'), 'Pune');
    await user.type(screen.getByLabelText('Pincode'), '411001');
    await user.type(screen.getByLabelText('Phone'), '9876543210');

    const placeOrder = screen.getByRole('button', { name: /^Place order/ });
    await user.press(placeOrder);

    // --- Confirmation: order toast + cart cleared + back at the product list ---
    await waitFor(() => expect(screen.getByText('Order placed! (demo)')).toBeTruthy(), { timeout: 4000 });
    await waitFor(() => expect(screen.getByText('Cart (0)')).toBeTruthy(), { timeout: 4000 });
  }, 20_000);
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
