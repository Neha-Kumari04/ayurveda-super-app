import {
  COUPONS,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  buildCartLines,
  computeCheckoutSummary,
  couponLabel,
  describeOrder,
  validateCoupon,
} from '@/modules/shop/utils';

import type { CartItem, Product } from '@/modules/shop/types';

function makeProduct(id: string, price: number, mrp = price): Product {
  return {
    id,
    name: `Product ${id}`,
    brand: 'Test',
    category: 'Ashwagandha',
    form: 'capsule',
    price,
    mrp,
    rating: 4.2,
    reviewCount: 10,
    stock: 5,
    tags: [],
    ingredients: [],
    description: '',
    imageUrl: '',
    inStock: true,
    searchText: '',
  };
}

function makeItem(productId: string, quantity: number, addedAt = 1): CartItem {
  return { productId, quantity, addedAt };
}

describe('buildCartLines', () => {
  it('joins items with products sorted by addedAt', () => {
    const products = new Map([
      ['p1', makeProduct('p1', 100)],
      ['p2', makeProduct('p2', 200)],
    ]);
    const lines = buildCartLines(
      { p2: makeItem('p2', 1, 2), p1: makeItem('p1', 3, 1) },
      products,
    );
    expect(lines.map((l) => l.product.id)).toEqual(['p1', 'p2']);
    expect(lines[0].lineTotal).toBe(300);
  });

  it('skips items whose product no longer exists', () => {
    const lines = buildCartLines({ ghost: makeItem('ghost', 1) }, new Map());
    expect(lines).toEqual([]);
  });
});

describe('computeCheckoutSummary', () => {
  const products = new Map([
    ['p1', makeProduct('p1', 500)],
    ['p2', makeProduct('p2', 300)],
  ]);
  const lines = buildCartLines({ p1: makeItem('p1', 2), p2: makeItem('p2', 1) }, products);

  it('computes subtotal, delivery and total', () => {
    const summary = computeCheckoutSummary(lines, null);
    expect(summary.subtotal).toBe(1300);
    expect(summary.discount).toBe(0);
    expect(summary.deliveryFee).toBe(0); // above free threshold
    expect(summary.total).toBe(1300);
    expect(summary.itemCount).toBe(3);
  });

  it('charges delivery below the free threshold', () => {
    const smallLines = buildCartLines({ p2: makeItem('p2', 1) }, products);
    const summary = computeCheckoutSummary(smallLines, null);
    expect(summary.deliveryFee).toBe(DELIVERY_FEE);
    expect(summary.total).toBe(300 + DELIVERY_FEE);
    expect(300).toBeLessThan(FREE_DELIVERY_THRESHOLD);
  });

  it('applies percentage coupons', () => {
    const summary = computeCheckoutSummary(lines, 'AYUR10');
    expect(summary.discount).toBe(Math.round(1300 * (COUPONS.AYUR10 / 100)));
    expect(summary.total).toBe(1300 - summary.discount);
  });

  it('ignores unknown coupon codes', () => {
    const summary = computeCheckoutSummary(lines, 'NOPE');
    expect(summary.discount).toBe(0);
  });

  it('returns an empty summary for an empty cart', () => {
    const summary = computeCheckoutSummary([], null);
    expect(summary.total).toBe(0);
    expect(summary.itemCount).toBe(0);
    expect(summary.deliveryFee).toBe(0);
  });
});

describe('validateCoupon', () => {
  it('accepts known coupons case-insensitively', () => {
    expect(validateCoupon('ayur10').ok).toBe(true);
  });

  it('rejects empty and unknown codes', () => {
    expect(validateCoupon('').ok).toBe(false);
    expect(validateCoupon('UNKNOWN').ok).toBe(false);
  });
});

describe('couponLabel / describeOrder', () => {
  it('formats coupon labels', () => {
    expect(couponLabel('veda15')).toBe('VEDA15 · 15% off');
  });

  it('describes an order for confirmations', () => {
    const products = new Map([['p1', makeProduct('p1', 100)]]);
    const lines = buildCartLines({ p1: makeItem('p1', 2) }, products);
    const summary = computeCheckoutSummary(lines, null);
    expect(describeOrder(summary)).toContain('2 items');
  });
});
