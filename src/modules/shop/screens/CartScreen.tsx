import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInDownView } from '@/components/ui/FadeInDownView';
import { Input } from '@/components/ui/Input';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useToast } from '@/components/toast/ToastProvider';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

import { CartItemRow } from '../components/CartItemRow';
import { useProductsByIds } from '../hooks';
import { selectCartProductIds, useCartStore } from '../store';
import { COUPONS, buildCartLines, computeCheckoutSummary, couponLabel, validateCoupon } from '../utils';

import type { ShopStackScreenProps } from '@/navigation/types';

type Props = ShopStackScreenProps<'Cart'>;

export function CartScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const couponCode = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const [couponInput, setCouponInput] = useState('');

  const productIds = useCartStore(selectCartProductIds);
  const products = useProductsByIds(productIds);
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const lines = useMemo(() => buildCartLines(items, productsById), [items, productsById]);
  const summary = useMemo(() => computeCheckoutSummary(lines, couponCode), [lines, couponCode]);

  const onIncrement = useCallback((id: string) => updateQuantity(id, (items[id]?.quantity ?? 1) + 1), [items, updateQuantity]);
  const onDecrement = useCallback((id: string) => updateQuantity(id, (items[id]?.quantity ?? 2) - 1), [items, updateQuantity]);

  const onApplyCoupon = useCallback(() => {
    const result = validateCoupon(couponInput);
    if (!result.ok) {
      toast.error(result.message ?? 'Invalid coupon');
      return;
    }
    setCoupon(couponInput.trim().toUpperCase());
    setCouponInput('');
    toast.success(`Coupon applied: ${couponLabel(couponInput)}`);
  }, [couponInput, setCoupon, toast]);

  const renderItem = useCallback(
    ({ item }: { item: ReturnType<typeof buildCartLines>[number] }) => (
      <CartItemRow
        product={item.product}
        quantity={item.quantity}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={removeItem}
      />
    ),
    [onIncrement, onDecrement, removeItem],
  );

  const keyExtractor = useCallback((item: ReturnType<typeof buildCartLines>[number]) => item.product.id, []);

  const header = (
    <FadeInDownView duration={350} style={styles.header}>
      <OfflineBanner />
      <View style={styles.titleRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
            {t('shop.cart')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Ayurvedic Dispensary Checkout
          </Text>
        </View>
        <View style={[styles.trustBadge, { backgroundColor: theme.colors.primaryMuted }]}>
          <Ionicons name="shield-checkmark" size={14} color={theme.colors.primary} />
          <Text style={[styles.trustBadgeText, { color: theme.colors.primary }]}>Ayush Verified</Text>
        </View>
      </View>

      {couponCode ? <Chip label={couponLabel(couponCode)} selected onRemove={() => setCoupon(null)} /> : null}
      {!couponCode ? (
        <View style={styles.couponRow}>
          <Input
            value={couponInput}
            onChangeText={setCouponInput}
            placeholder={`Try ${Object.keys(COUPONS).join(' / ')}`}
            containerStyle={styles.couponInput}
            autoCapitalize="characters"
            accessibilityLabel="Coupon code"
          />
          <Button label={t('common.apply')} variant="secondary" onPress={onApplyCoupon} />
        </View>
      ) : null}
    </FadeInDownView>
  );

  const footer = lines.length > 0 ? (
    <FadeInDownView delay={150} duration={400}>
      <Card style={[styles.summaryCard, { borderColor: theme.colors.border }]}>
        <View style={styles.summaryTitleRow}>
          <Ionicons name="receipt-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>Order Summary</Text>
        </View>
        <Row label={t('shop.subtotal')} value={formatCurrency(summary.subtotal)} />
        {summary.discount > 0 ? (
          <Row label={`${t('shop.discount')} (${couponCode})`} value={`− ${formatCurrency(summary.discount)}`} positive />
        ) : null}
        <Row
          label={t('shop.delivery')}
          value={summary.deliveryFee === 0 ? 'FREE' : formatCurrency(summary.deliveryFee)}
          positive={summary.deliveryFee === 0}
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Row label={t('shop.total')} value={formatCurrency(summary.total)} bold />
        <Button
          label={`${t('shop.checkout')} · ${summary.itemCount} items`}
          onPress={() => navigation.navigate('Checkout')}
          fullWidth
          variant="primary"
          style={styles.checkoutBtn}
        />
      </Card>
    </FadeInDownView>
  ) : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8 }]}>
      <FlatList
        data={lines}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={header}
        ListFooterComponent={footer ?? undefined}
        ListEmptyComponent={
          <EmptyState
            title={t('shop.emptyCart')}
            description="Browse the shop and add Ayurvedic essentials to your cart."
            actionLabel="Browse products"
            onAction={() => navigation.goBack()}
          />
        }
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

function Row({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={{ color: theme.colors.textSecondary, fontSize: bold ? 15 : 13.5, fontWeight: bold ? '700' : '400' }}>
        {label}
      </Text>
      <Text
        style={{
          color: positive ? theme.colors.success : theme.colors.text,
          fontSize: bold ? 17 : 14,
          fontWeight: bold ? '800' : '600',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { gap: 10, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  couponRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  couponInput: { flex: 1 },
  summaryCard: { marginTop: 8, gap: 10 },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  summaryTitle: { fontSize: 15, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  titleWrap: { flex: 1 },
  subtitle: { fontSize: 13, marginTop: 2 },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trustBadgeText: { fontSize: 11, fontWeight: '700' },
  checkoutBtn: { marginTop: 4 },
});
