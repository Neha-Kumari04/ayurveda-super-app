import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { BookingsScreen } from '@/modules/consultation/screens/BookingsScreen';
import { DoctorDetailScreen } from '@/modules/consultation/screens/DoctorDetailScreen';
import { DoctorListScreen } from '@/modules/consultation/screens/DoctorListScreen';
import { ProductDetailScreen } from '@/modules/shop/screens/ProductDetailScreen';
import { ProductListScreen } from '@/modules/shop/screens/ProductListScreen';
import { CartScreen } from '@/modules/shop/screens/CartScreen';
import { CheckoutScreen } from '@/modules/shop/screens/CheckoutScreen';
import { WishlistScreen } from '@/modules/shop/screens/WishlistScreen';
import { AddRecordScreen } from '@/modules/health/screens/AddRecordScreen';
import { RecordDetailScreen } from '@/modules/health/screens/RecordDetailScreen';
import { TimelineScreen } from '@/modules/health/screens/TimelineScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

import type {
  ConsultStackParamList,
  HealthStackParamList,
  MainTabParamList,
  ShopStackParamList,
} from './types';

const ConsultStack = createNativeStackNavigator<ConsultStackParamList>();
const ShopStack = createNativeStackNavigator<ShopStackParamList>();
const HealthStack = createNativeStackNavigator<HealthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const screenOptions = { headerShown: false } as const;

function ConsultStackNavigator() {
  return (
    <ConsultStack.Navigator screenOptions={screenOptions}>
      <ConsultStack.Screen name="DoctorList" component={DoctorListScreen} />
      <ConsultStack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
      <ConsultStack.Screen name="Bookings" component={BookingsScreen} />
    </ConsultStack.Navigator>
  );
}

function ShopStackNavigator() {
  return (
    <ShopStack.Navigator screenOptions={screenOptions}>
      <ShopStack.Screen name="ProductList" component={ProductListScreen} />
      <ShopStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <ShopStack.Screen name="Cart" component={CartScreen} />
      <ShopStack.Screen name="Checkout" component={CheckoutScreen} />
      <ShopStack.Screen name="Wishlist" component={WishlistScreen} />
    </ShopStack.Navigator>
  );
}

function HealthStackNavigator() {
  return (
    <HealthStack.Navigator screenOptions={screenOptions}>
      <HealthStack.Screen name="Timeline" component={TimelineScreen} />
      <HealthStack.Screen name="RecordDetail" component={RecordDetailScreen} />
      <HealthStack.Screen name="AddRecord" component={AddRecordScreen} />
    </HealthStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  ConsultTab: '🩺',
  ShopTab: '🛒',
  HealthTab: '📋',
  SettingsTab: '⚙️',
};

export function MainTabs() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{TAB_ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="ConsultTab" component={ConsultStackNavigator} options={{ title: t('tabs.consult') }} />
      <Tab.Screen name="ShopTab" component={ShopStackNavigator} options={{ title: t('tabs.shop') }} />
      <Tab.Screen name="HealthTab" component={HealthStackNavigator} options={{ title: t('tabs.health') }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: t('tabs.more') }} />
    </Tab.Navigator>
  );
}
