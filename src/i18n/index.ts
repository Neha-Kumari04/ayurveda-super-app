import { useSettingsStore, type Locale } from '@/store/settingsStore';

/**
 * Lightweight i18n. Two languages at launch (English + Hindi).
 * Strings are plain nested objects; `t` interpolates `{placeholders}`.
 */
const en = {
  common: {
    search: 'Search',
    cancel: 'Cancel',
    save: 'Save',
    apply: 'Apply',
    clear: 'Clear',
    retry: 'Retry',
    loading: 'Loading…',
    empty: 'Nothing here yet',
    error: 'Something went wrong',
    offline: "You're offline — showing saved data",
    seeAll: 'See all',
    done: 'Done',
    back: 'Back',
    next: 'Next',
    results: '{count} results',
    pendingSync: 'Pending sync',
  },
  tabs: {
    consult: 'Consult',
    shop: 'Shop',
    health: 'Health',
    more: 'More',
  },
  consult: {
    title: 'Consultations',
    findDoctor: 'Find your Ayurvedic doctor',
    specialties: 'Specialties',
    city: 'City',
    experience: 'Experience',
    rating: 'Rating',
    fee: 'Fee',
    gender: 'Gender',
    availableOnly: 'Available today',
    sort: 'Sort by',
    sortRating: 'Top rated',
    sortFeeLow: 'Fee: low to high',
    sortFeeHigh: 'Fee: high to low',
    sortExperience: 'Most experienced',
    sortNext: 'Next available',
    bookNow: 'Book consultation',
    bookSlot: 'Select a slot',
    noSlots: 'No slots available for this date',
    upcoming: 'Upcoming',
    past: 'Past',
    cancelBooking: 'Cancel booking',
    cancelled: 'Booking cancelled',
    reason: 'Reason (optional)',
    conflict: 'That slot was just taken — pick another.',
    expired: 'That slot has expired. Please choose a future slot.',
    doubleBooked: 'You already have a booking for this slot.',
    perSession: 'per session',
    yearsExp: '{count} yrs exp',
    reviews: '{count} reviews',
  },
  shop: {
    title: 'Shop',
    subtitle: 'Authentic Ayurvedic essentials',
    cart: 'Cart',
    wishlist: 'Wishlist',
    addToCart: 'Add to cart',
    inCart: 'In cart ({qty})',
    outOfStock: 'Out of stock',
    checkout: 'Checkout',
    placeOrder: 'Place order',
    orderPlaced: 'Order placed! (demo)',
    subtotal: 'Subtotal',
    discount: 'Discount',
    delivery: 'Delivery',
    total: 'Total',
    emptyCart: 'Your cart is empty',
    emptyWishlist: 'No favourites yet',
    remove: 'Remove',
    category: 'Category',
    form: 'Form',
    price: 'Price',
    brand: 'Brand',
    sort: 'Sort by',
    sortRelevance: 'Relevance',
    sortPriceAsc: 'Price: low to high',
    sortPriceDesc: 'Price: high to low',
    sortRating: 'Top rated',
    inStockOnly: 'In stock only',
    ingredients: 'Key ingredients',
    tags: 'Tags',
  },
  health: {
    title: 'Health Records',
    subtitle: 'Your complete Ayurvedic health timeline',
    addRecord: 'Add record',
    lab_report: 'Lab Report',
    prescription: 'Prescription',
    consultation: 'Consultation',
    vaccination: 'Vaccination',
    allergy: 'Allergy',
    groupBy: 'Group by',
    groupMonth: 'Month',
    groupYear: 'Year',
    groupNone: 'None',
    provider: 'Provider',
    tags: 'Tags',
    attachments: 'Attachments',
    noAttachments: 'No attachments',
    savedOffline: 'Saved offline — will sync automatically',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    language: 'Language',
    security: 'Security',
    biometric: 'Biometric lock',
    about: 'About',
    version: 'Version',
    featureFlags: 'Feature flags',
    syncQueue: 'Sync queue',
    syncNow: 'Sync now',
  },
  errors: {
    notFound: 'Not found',
    timeout: 'Request timed out',
    network: 'Network error',
  },
};

type Dict = typeof en;

const hi: Dict = {
  common: {
    search: 'खोजें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    apply: 'लागू करें',
    clear: 'साफ़ करें',
    retry: 'पुनः प्रयास करें',
    loading: 'लोड हो रहा है…',
    empty: 'यहाँ अभी कुछ नहीं है',
    error: 'कुछ गलत हो गया',
    offline: 'आप ऑफ़लाइन हैं — सहेजा गया डेटा दिख रहा है',
    seeAll: 'सभी देखें',
    done: 'हो गया',
    back: 'वापस',
    next: 'आगे',
    results: '{count} परिणाम',
    pendingSync: 'सिंक बाकी है',
  },
  tabs: {
    consult: 'परामर्श',
    shop: 'दुकान',
    health: 'स्वास्थ्य',
    more: 'और',
  },
  consult: {
    title: 'परामर्श',
    findDoctor: 'अपने आयुर्वेदिक डॉक्टर को खोजें',
    specialties: 'विशेषताएँ',
    city: 'शहर',
    experience: 'अनुभव',
    rating: 'रेटिंग',
    fee: 'शुल्क',
    gender: 'लिंग',
    availableOnly: 'आज उपलब्ध',
    sort: 'क्रमबद्ध करें',
    sortRating: 'सर्वोच्च रेटेड',
    sortFeeLow: 'शुल्क: कम से अधिक',
    sortFeeHigh: 'शुल्क: अधिक से कम',
    sortExperience: 'सबसे अनुभवी',
    sortNext: 'अगली उपलब्धता',
    bookNow: 'परामर्श बुक करें',
    bookSlot: 'एक स्लॉट चुनें',
    noSlots: 'इस तिथि के लिए कोई स्लॉट उपलब्ध नहीं',
    upcoming: 'आगामी',
    past: 'अतीत',
    cancelBooking: 'बुकिंग रद्द करें',
    cancelled: 'बुकिंग रद्द कर दी गई',
    reason: 'कारण (वैकल्पिक)',
    conflict: 'यह स्लॉट अभी लिया गया — कृपया दूसरा चुनें।',
    expired: 'यह स्लॉट समाप्त हो गया है। कृपया भविष्य का स्लॉट चुनें।',
    doubleBooked: 'इस स्लॉट के लिए आपकी पहले से बुकिंग है।',
    perSession: 'प्रति सत्र',
    yearsExp: '{count} वर्ष अनुभव',
    reviews: '{count} समीक्षाएँ',
  },
  shop: {
    title: 'दुकान',
    subtitle: 'प्रामाणिक आयुर्वेदिक सामग्री',
    cart: 'कार्ट',
    wishlist: 'पसंदीदा',
    addToCart: 'कार्ट में डालें',
    inCart: 'कार्ट में ({qty})',
    outOfStock: 'स्टॉक ख़त्म',
    checkout: 'चेकआउट',
    placeOrder: 'ऑर्डर करें',
    orderPlaced: 'ऑर्डर हो गया! (डेमो)',
    subtotal: 'उप-योग',
    discount: 'छूट',
    delivery: 'डिलीवरी',
    total: 'कुल',
    emptyCart: 'आपका कार्ट खाली है',
    emptyWishlist: 'अभी तक कोई पसंदीदा नहीं',
    remove: 'हटाएँ',
    category: 'श्रेणी',
    form: 'रूप',
    price: 'मूल्य',
    brand: 'ब्रांड',
    sort: 'क्रमबद्ध करें',
    sortRelevance: 'प्रासंगिकता',
    sortPriceAsc: 'मूल्य: कम से अधिक',
    sortPriceDesc: 'मूल्य: अधिक से कम',
    sortRating: 'सर्वोच्च रेटेड',
    inStockOnly: 'केवल स्टॉक में',
    ingredients: 'मुख्य सामग्री',
    tags: 'टैग',
  },
  health: {
    title: 'स्वास्थ्य रिकॉर्ड',
    subtitle: 'आपकी संपूर्ण आयुर्वेदिक स्वास्थ्य टाइमलाइन',
    addRecord: 'रिकॉर्ड जोड़ें',
    lab_report: 'लैब रिपोर्ट',
    prescription: 'नुस्खा',
    consultation: 'परामर्श',
    vaccination: 'टीकाकरण',
    allergy: 'एलर्जी',
    groupBy: 'समूह',
    groupMonth: 'माह',
    groupYear: 'वर्ष',
    groupNone: 'कोई नहीं',
    provider: 'प्रदाता',
    tags: 'टैग',
    attachments: 'अनुलग्नक',
    noAttachments: 'कोई अनुलग्नक नहीं',
    savedOffline: 'ऑफ़लाइन सहेजा गया — स्वतः सिंक होगा',
  },
  settings: {
    title: 'सेटिंग्स',
    appearance: 'दिखावट',
    theme: 'थीम',
    themeLight: 'हल्का',
    themeDark: 'गहरा',
    themeSystem: 'सिस्टम',
    language: 'भाषा',
    security: 'सुरक्षा',
    biometric: 'बायोमेट्रिक लॉक',
    about: 'परिचय',
    version: 'संस्करण',
    featureFlags: 'फ़ीचर फ़्लैग',
    syncQueue: 'सिंक कतार',
    syncNow: 'अभी सिंक करें',
  },
  errors: {
    notFound: 'नहीं मिला',
    timeout: 'अनुरोध समय सीमा समाप्त',
    network: 'नेटवर्क त्रुटि',
  },
};

const dictionaries: Record<Locale, Dict> = { en, hi };

export function translate(locale: Locale, path: string, vars?: Record<string, string | number>): string {
  const segments = path.split('.');
  let node: unknown = dictionaries[locale];
  for (const segment of segments) {
    if (typeof node !== 'object' || node === null || !(segment in node)) {
      // Fallback to English, then to the path itself.
      node = dictionaries.en;
      for (const fallbackSegment of segments) {
        if (typeof node !== 'object' || node === null || !(fallbackSegment in node)) return path;
        node = (node as Record<string, unknown>)[fallbackSegment];
      }
      break;
    }
    node = (node as Record<string, unknown>)[segment];
  }
  if (typeof node !== 'string') return path;
  if (!vars) return node;
  return node.replace(/\{(\w+)\}/g, (match, key) => String(vars[key] ?? match));
}

/** Non-hook translation for use outside React (e.g. formatting labels). */
export function t(path: string, vars?: Record<string, string | number>): string {
  return translate(useSettingsStore.getState().locale, path, vars);
}

/** Hook form — re-renders when the locale changes. */
export function useTranslation() {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  return {
    locale,
    setLocale,
    t: (path: string, vars?: Record<string, string | number>) => translate(locale, path, vars),
  };
}
