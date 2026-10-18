import * as Linking from 'expo-linking';

import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep linking configuration.
 *
 * URL scheme: ayurveda://
 *   ayurveda://doctor/doc_42        → DoctorDetail
 *   ayurveda://product/prod_17      → ProductDetail
 *   ayurveda://record/rec_9         → RecordDetail
 *   ayurveda://cart                 → Cart
 *   ayurveda://bookings             → Bookings
 *
 * Universal links can be added later by extending `config.prefixes` with the
 * https domain — the path mapping stays identical.
 */
/**
 * `Linking.createURL` needs an Expo manifest (absent in plain Jest / non-Expo
 * hosts) — fall back to the app scheme from app.json so linking config can
 * always be constructed.
 */
function safeCreateURL(path: string): string {
  try {
    return Linking.createURL(path);
  } catch {
    return `ayurveda://${path}`;
  }
}

const prefixes = [safeCreateURL('/')];

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes,
  config: {
    screens: {
      Login: 'login',
      Main: {
        screens: {
          ConsultTab: {
            screens: {
              DoctorList: '',
              DoctorDetail: 'doctor/:doctorId',
              Bookings: 'bookings',
            },
          },
          ShopTab: {
            screens: {
              ProductList: 'shop',
              ProductDetail: 'product/:productId',
              Cart: 'cart',
              Checkout: 'checkout',
              Wishlist: 'wishlist',
            },
          },
          HealthTab: {
            screens: {
              Timeline: 'health',
              RecordDetail: 'record/:recordId',
              AddRecord: 'health/new',
            },
          },
          SettingsTab: 'settings',
        },
      },
    },
  },
};
