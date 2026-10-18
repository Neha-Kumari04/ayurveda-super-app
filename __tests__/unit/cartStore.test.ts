import { useCartStore, selectCartCount, selectCartProductIds } from '@/modules/shop/store';

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: {}, wishlist: [], couponCode: null });
  });

  it('adds items and accumulates quantity', () => {
    useCartStore.getState().addItem('p1', 1);
    useCartStore.getState().addItem('p1', 2);
    expect(useCartStore.getState().items.p1.quantity).toBe(3);
  });

  it('caps quantity at 10', () => {
    useCartStore.getState().addItem('p1', 8);
    useCartStore.getState().addItem('p1', 5);
    expect(useCartStore.getState().items.p1.quantity).toBe(10);
  });

  it('updates quantity and removes at zero', () => {
    useCartStore.getState().addItem('p1', 2);
    useCartStore.getState().updateQuantity('p1', 1);
    expect(useCartStore.getState().items.p1.quantity).toBe(1);
    useCartStore.getState().updateQuantity('p1', 0);
    expect(useCartStore.getState().items.p1).toBeUndefined();
  });

  it('removes a single item', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().addItem('p2');
    useCartStore.getState().removeItem('p1');
    expect(Object.keys(useCartStore.getState().items)).toEqual(['p2']);
  });

  it('clears the cart', () => {
    useCartStore.getState().addItem('p1');
    useCartStore.getState().setCoupon('AYUR10');
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual({});
    expect(useCartStore.getState().couponCode).toBeNull();
  });

  it('toggles wishlist entries', () => {
    useCartStore.getState().toggleWishlist('p1');
    expect(useCartStore.getState().isInWishlist('p1')).toBe(true);
    useCartStore.getState().toggleWishlist('p1');
    expect(useCartStore.getState().isInWishlist('p1')).toBe(false);
  });

  it('selectors derive count and ids', () => {
    useCartStore.getState().addItem('p1', 2);
    useCartStore.getState().addItem('p2', 3);
    const state = useCartStore.getState();
    expect(selectCartCount(state)).toBe(5);
    expect(selectCartProductIds(state).sort()).toEqual(['p1', 'p2']);
  });
});
