import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type ConsultStackParamList = {
  DoctorList: undefined;
  DoctorDetail: { doctorId: string };
  Bookings: undefined;
  VideoCall: { bookingId: string; doctorName: string; specialty: string };
};

export type ShopStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  Wishlist: undefined;
};

export type HealthStackParamList = {
  Timeline: undefined;
  RecordDetail: { recordId: string };
  AddRecord: undefined;
};

export type MainTabParamList = {
  ConsultTab: NavigatorScreenParams<ConsultStackParamList>;
  ShopTab: NavigatorScreenParams<ShopStackParamList>;
  HealthTab: NavigatorScreenParams<HealthStackParamList>;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type ConsultStackScreenProps<T extends keyof ConsultStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ConsultStackParamList, T>,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'ConsultTab'>, NativeStackScreenProps<RootStackParamList>>
>;

export type ShopStackScreenProps<T extends keyof ShopStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ShopStackParamList, T>,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'ShopTab'>, NativeStackScreenProps<RootStackParamList>>
>;

export type HealthStackScreenProps<T extends keyof HealthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HealthStackParamList, T>,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'HealthTab'>, NativeStackScreenProps<RootStackParamList>>
>;

// React Navigation's typed-links convention requires this global augmentation.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
