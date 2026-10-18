import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/toast/ToastProvider';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';

import { ProductImage } from '../components/ProductCard';
import { useProductsByIds } from '../hooks';
import { selectCartProductIds, useCartStore } from '../store';
import { buildCartLines, computeCheckoutSummary } from '../utils';

import type { ShopStackScreenProps } from '@/navigation/types';

type Props = ShopStackScreenProps<'Checkout'>;

interface AddressForm {
  name: string;
  line1: string;
  city: string;
  pincode: string;
  phone: string;
}

export function CheckoutScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const clearCart = useCartStore((s) => s.clearCart);
  const productIds = useCartStore(selectCartProductIds);
  const products = useProductsByIds(productIds);
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const lines = useMemo(() => buildCartLines(items, productsById), [items, productsById]);
  const summary = useMemo(() => computeCheckoutSummary(lines, couponCode), [lines, couponCode]);

  const [form, setForm] = useState<AddressForm>({ name: '', line1: '', city: '', pincode: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback(
    (key: keyof AddressForm) => (value: string) => setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  const isValid = form.name && form.line1 && form.city && /^\d{6}$/.test(form.pincode) && /^\d{10}$/.test(form.phone);

  const onPlaceOrder = useCallback(async () => {
    if (!isValid || lines.length === 0) return;
    setSubmitting(true);
    // Simulated network call — real apps would POST /orders here.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmitting(false);
    clearCart();
    toast.success(t('shop.orderPlaced'));
    navigation.popToTop();
  }, [isValid, lines.length, clearCart, toast, t, navigation]);

  if (lines.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 8 }]}>
        <EmptyState
          title={t('shop.emptyCart')}
          description="Add items before checking out."
          actionLabel="Browse products"
          onAction={() => navigation.popToTop()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
          {t('shop.checkout')}
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order summary</Text>
          {summary.items.map((item) => (
            <View key={item.product.id} style={styles.lineItem}>
              <ProductImage uri={item.product.imageUrl} size={44} borderRadius={8} />
              <View style={styles.lineInfo}>
                <Text style={[styles.lineName, { color: theme.colors.text }]} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={[styles.lineMeta, { color: theme.colors.textMuted }]}>
                  {item.quantity} × {formatCurrency(item.product.price)}
                </Text>
              </View>
              <Text style={[styles.lineTotal, { color: theme.colors.text }]}>{formatCurrency(item.lineTotal)}</Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={{ color: theme.colors.textSecondary }}>{t('shop.total')}</Text>
            <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800' }}>
              {formatCurrency(summary.total)}
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery address</Text>
          <Input label="Full name" value={form.name} onChangeText={setField('name')} placeholder="Asha Sharma" />
          <Input label="Address" value={form.line1} onChangeText={setField('line1')} placeholder="Flat / street / landmark" />
          <View style={styles.rowInputs}>
            <Input
              label="City"
              value={form.city}
              onChangeText={setField('city')}
              placeholder="Pune"
              containerStyle={styles.flex}
            />
            <Input
              label="Pincode"
              value={form.pincode}
              onChangeText={(v) => setField('pincode')(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="411001"
              keyboardType="number-pad"
              containerStyle={styles.flex}
              error={form.pincode.length > 0 && form.pincode.length !== 6 ? '6 digits' : undefined}
            />
          </View>
          <Input
            label="Phone"
            value={form.phone}
            onChangeText={(v) => setField('phone')(v.replace(/\D/g, '').slice(0, 10))}
            placeholder="9876543210"
            keyboardType="phone-pad"
            error={form.phone.length > 0 && form.phone.length !== 10 ? '10 digits' : undefined}
          />
        </Card>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <Button
          label={`${t('shop.placeOrder')} · ${formatCurrency(summary.total)}`}
          onPress={() => void onPlaceOrder()}
          loading={submitting}
          disabled={!isValid}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  card: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  lineItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineInfo: { flex: 1, gap: 2 },
  lineName: { fontSize: 13.5, fontWeight: '600' },
  lineMeta: { fontSize: 12 },
  lineTotal: { fontSize: 14, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowInputs: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
