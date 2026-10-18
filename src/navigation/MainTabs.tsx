import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { BookingsScreen } from '@/modules/consultation/screens/BookingsScreen';
import { DoctorDetailScreen } from '@/modules/consultation/screens/DoctorDetailScreen';
import { DoctorListScreen } from '@/modules/consultation/screens/DoctorListScreen';
import { VideoCallScreen } from '@/modules/consultation/screens/VideoCallScreen';
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
      <ConsultStack.Screen name="VideoCall" component={VideoCallScreen} options={{ presentation: 'fullScreenModal' }} />
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

const TAB_ICONS: Record<
  keyof MainTabParamList,
  { focused: React.ComponentProps<typeof Ionicons>['name']; unfocused: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  ConsultTab: { focused: 'medical', unfocused: 'medical-outline' },
  ShopTab: { focused: 'flask', unfocused: 'flask-outline' },
  HealthTab: { focused: 'fitness', unfocused: 'fitness-outline' },
  SettingsTab: { focused: 'person-circle', unfocused: 'person-circle-outline' },
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceElevated,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
          ...theme.shadows.card,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconPair = TAB_ICONS[route.name];
          const iconName = focused ? iconPair.focused : iconPair.unfocused;
          return <Ionicons name={iconName} size={size + (focused ? 2 : 0)} color={color} />;
        },
      })}
    >
      <Tab.Screen name="ConsultTab" component={ConsultStackNavigator} options={{ title: t('tabs.consult') }} />
      <Tab.Screen name="ShopTab" component={ShopStackNavigator} options={{ title: t('tabs.shop') }} />
      <Tab.Screen name="HealthTab" component={HealthStackNavigator} options={{ title: t('tabs.health') }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: t('tabs.more') }} />
    </Tab.Navigator>
  );
}
