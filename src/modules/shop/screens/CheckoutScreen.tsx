import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeInDownView } from '@/components/ui/FadeInDownView';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { useToast } from '@/components/toast/ToastProvider';
import { useTranslation } from '@/i18n';
import { useProfileStore } from '@/store/profileStore';
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

  const profile = useProfileStore((s) => s.profile);
  const saveProfile = useProfileStore((s) => s.saveProfile);

  const lines = useMemo(() => buildCartLines(items, productsById), [items, productsById]);
  const summary = useMemo(() => computeCheckoutSummary(lines, couponCode), [lines, couponCode]);

  const [form, setForm] = useState<AddressForm>(() => ({
    name: profile.fullName,
    line1: profile.address,
    city: profile.city,
    pincode: profile.pincode,
    phone: profile.phone,
  }));
  const [submitting, setSubmitting] = useState(false);

  // Fill any still-empty fields once the saved profile hydrates or updates.
  useEffect(() => {
    setForm((f) => ({
      name: f.name || profile.fullName,
      line1: f.line1 || profile.address,
      city: f.city || profile.city,
      pincode: f.pincode || profile.pincode,
      phone: f.phone || profile.phone,
    }));
  }, [profile]);

  const setField = useCallback(
    (key: keyof AddressForm) => (value: string) => setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  const isValid = form.name && form.line1 && form.city && /^\d{6}$/.test(form.pincode) && /^\d{10}$/.test(form.phone);

  const onPlaceOrder = useCallback(async () => {
    if (!isValid || lines.length === 0) return;
    setSubmitting(true);
    // Persist the delivery details so the next order is prefilled.
    saveProfile({
      fullName: form.name,
      address: form.line1,
      city: form.city,
      pincode: form.pincode,
      phone: form.phone,
    });
    // Simulated network call — real apps would POST /orders here.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmitting(false);
    clearCart();
    toast.success(t('shop.orderPlaced'));
    navigation.popToTop();
  }, [isValid, lines.length, form, saveProfile, clearCart, toast, t, navigation]);

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
        <FadeInDownView duration={350} style={styles.topNavRow}>
          <PressableScale
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </PressableScale>
          <View style={styles.titleWrap}>
            <Text style={[styles.title, { color: theme.colors.text }]} accessibilityRole="header">
              {t('shop.checkout')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Verified Pharmacy Dispatch
            </Text>
          </View>
          <View style={[styles.trustBadge, { backgroundColor: theme.colors.primaryMuted }]}>
            <Ionicons name="shield-checkmark" size={14} color={theme.colors.primary} />
            <Text style={[styles.trustBadgeText, { color: theme.colors.primary }]}>Ayush Standard</Text>
          </View>
        </FadeInDownView>

        <FadeInDownView delay={60} duration={400}>
          <Card style={[styles.card, { borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="bag-check-outline" size={17} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order summary</Text>
            </View>
            {summary.items.map((item) => (
              <View key={item.product.id} style={styles.lineItem}>
                <ProductImage uri={item.product.imageUrl} size={48} borderRadius={10} />
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
              <Text style={{ color: theme.colors.primary, fontSize: 19, fontWeight: '800' }}>
                {formatCurrency(summary.total)}
              </Text>
            </View>
          </Card>
        </FadeInDownView>

        <FadeInDownView delay={120} duration={400}>
          <Card style={[styles.card, { borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="location-outline" size={17} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Delivery address</Text>
            </View>
            <Input label={t('profile.fullName')} value={form.name} onChangeText={setField('name')} placeholder="Asha Sharma" />
            <Input label={t('profile.address')} value={form.line1} onChangeText={setField('line1')} placeholder="Flat / street / landmark" />
            <View style={styles.rowInputs}>
              <Input
                label={t('profile.city')}
                value={form.city}
                onChangeText={setField('city')}
                placeholder="Pune"
                containerStyle={styles.flex}
              />
              <Input
                label={t('profile.pincode')}
                value={form.pincode}
                onChangeText={(v) => setField('pincode')(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="411001"
                keyboardType="number-pad"
                containerStyle={styles.flex}
                error={form.pincode.length > 0 && form.pincode.length !== 6 ? '6 digits' : undefined}
              />
            </View>
            <Input
              label={t('profile.phone')}
              value={form.phone}
              onChangeText={(v) => setField('phone')(v.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              keyboardType="phone-pad"
              error={form.phone.length > 0 && form.phone.length !== 10 ? '10 digits' : undefined}
            />
          </Card>
        </FadeInDownView>
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
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  card: { gap: 10 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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
