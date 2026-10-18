import { formatCurrency } from '@/utils/format';

import type { CartItem, CheckoutSummary, Product } from './types';

export const DELIVERY_FEE = 49;
export const FREE_DELIVERY_THRESHOLD = 999;
export const COUPONS: Record<string, number> = { AYUR10: 10, VEDA15: 15, FIRST20: 20 };

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
  addedAt: number;
}

/** Joins cart items with their products, skipping products that no longer exist. */
export function buildCartLines(items: Record<string, CartItem>, productsById: Map<string, Product>): CartLine[] {
  const lines: CartLine[] = [];
  for (const item of Object.values(items)) {
    const product = productsById.get(item.productId);
    if (!product) continue;
    lines.push({ product, quantity: item.quantity, lineTotal: product.price * item.quantity, addedAt: item.addedAt });
  }
  return lines.sort((a, b) => a.addedAt - b.addedAt);
}

export function computeCheckoutSummary(lines: CartLine[], couponCode: string | null): CheckoutSummary {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discountPct = couponCode ? (COUPONS[couponCode.toUpperCase()] ?? 0) : 0;
  const discount = Math.round((subtotal * discountPct) / 100);
  const deliveryFee = subtotal === 0 || subtotal - discount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return {
    items: lines.map((line) => ({ product: line.product, quantity: line.quantity, lineTotal: line.lineTotal })),
    subtotal,
    discount,
    deliveryFee,
    total,
    itemCount,
  };
}

export function validateCoupon(code: string): { ok: boolean; message?: string } {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, message: 'Enter a coupon code' };
  if (!(normalized in COUPONS)) return { ok: false, message: 'Invalid coupon code' };
  return { ok: true };
}

export function couponLabel(code: string): string {
  const pct = COUPONS[code.toUpperCase()] ?? 0;
  return `${code.toUpperCase()} · ${pct}% off`;
}

/** Human summary of what will be ordered — used by the checkout confirmation. */
export function describeOrder(summary: CheckoutSummary): string {
  return `${summary.itemCount} item${summary.itemCount === 1 ? '' : 's'} · ${formatCurrency(summary.total)}`;
}
