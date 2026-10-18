# Ayurveda Super App

Production-shaped React Native (Expo SDK 58, TypeScript) app with three modules:

1. **Consultations** — search 5,000+ Ayurvedic doctors, view slots, book/cancel appointments with conflict detection.
2. **Shop** — browse 20,000+ Ayurvedic products, search/filter/sort, cart, coupons, wishlist, checkout.
3. **Health Records** — a 10,000+ record medical timeline with filters, attachments, and offline record creation.

Ships with an in-app **mock API** (chaos engineering included), an **offline-first sync queue**, **deep linking**, **i18n (English + Hindi)**, **biometric lock**, **remote feature flags**, a token-based **design system**, and a **full test suite**.

## Quick start

```bash
npm install
npm start          # Expo dev server (press i / a for simulator/emulator)
```

Demo mode: any email + password (4+ characters) signs you in — the login form is pre-filled.

### Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run lint` / `lint:fix` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` (strict mode) |
| `npm test` | Jest — 87 tests (unit, hooks, e2e) |
| `npm run test:coverage` | Coverage report |
| `npm run doctor` | `expo-doctor` (20/20 checks pass) |

## Architecture

```
src/
├── core/                  # Cross-cutting infrastructure
│   ├── api/               # HTTP client, mock backend, errors, query client
│   ├── config/            # Typed env config (EXPO_PUBLIC_*)
│   ├── hooks/             # useBiometric
│   ├── logger/            # Logger + pluggable CrashReporter
│   ├── storage/           # Namespaced AsyncStorage + SecureStore wrappers
│   └── sync/              # Offline mutation queue + network monitor
├── data/generators/       # Seeded PRNG datasets (5k / 20k / 10k)
├── modules/
│   ├── consultation/      # doctors, slots, bookings
│   ├── shop/              # products, cart, checkout, wishlist
│   └── health/            # timeline, records, attachments
│   └── (each: types, api, hooks, utils, components, screens, store)
├── components/
│   ├── ui/                # Design system (Button, Card, Input, …)
│   └── toast/             # ToastProvider + viewport
├── i18n/                  # en + hi dictionaries, `t()` / `useTranslation()`
├── navigation/            # React Navigation stacks/tabs, deep-link config
├── screens/               # Login, Settings
├── store/                 # App-level Zustand stores (auth, settings)
├── theme/                 # Design tokens + ThemeProvider (light/dark)
└── utils/                 # date, format, search, debounce
```

**Layering rule:** screens → hooks → api → core/api client → mock server (or real HTTP). Domain `utils.ts` files hold pure functions (booking validation, cart maths, timeline grouping) so they are unit-testable without React.

### State management

| Kind | Tool | Notes |
| --- | --- | --- |
| Server state | TanStack Query v5 | Infinite queries for lists, stale-while-revalidate cache, retry policy |
| Client state | Zustand | `cart` (persisted), `auth` (session in SecureStore), `settings` (theme/locale/flags, persisted) |
| Ephemeral UI state | `useState` | Filters, form fields, modals |

Selectors that return derived arrays are referentially memoised (see `selectCartProductIds`) — required by React 19's `useSyncExternalStore`.

## Performance at scale

The datasets are generated once by seeded PRNG singletons (`src/data/generators/*`) and memoised, so 5k doctors / 20k products / 10k records cost ~0 to re-access:

- **Virtualised lists** — `FlatList`/`SectionList` with tuned `initialNumToRender`, `windowSize`, `removeClippedSubviews`; doctors and products paginate through **infinite queries** (server-side pages of 20–30).
- **Precomputed `searchText`** — every entity gets a lowercased haystack at generation time; search is a pure client/mock-side filter with term scoring (primary field matches rank higher).
- **Memoisation everywhere it matters** — `memo()` on every list-row component, `useCallback` for render props, `useMemo` for derived data.
- **Stable identities** — key extractors, memoised selectors, and memoised data generators keep re-renders minimal during fast scrolls.
- No layout thrash: fixed grid cells, hairline borders, no expensive shadow work in list rows.

## Offline-first & sync queue

- **Optimistic local actions** — booking a slot while offline (or after a network failure) enqueues a `booking.create` / `booking.cancel` / `record.create` mutation in `core/sync/syncQueue`.
- **Persisted queue** — survives restarts (AsyncStorage); restored and flushed on launch and whenever connectivity returns (`networkMonitor` subscribes to `expo-network` state changes).
- **Retry with backoff** — the API client retries timeout/5xx errors with exponential backoff; queue mutations retry up to 5 attempts before being dropped with an error log.
- **Offline UI** — an `OfflineBanner` sits on every list screen; health records saved offline show a "will sync automatically" notice.
- **Stale-while-revalidate** — cached GET responses (TTL-based) are served instantly when the network fails, so the UI never blanks out.

## Reliability (chaos-tested)

The mock backend (`core/api/mockServer.ts`) simulates: latency with jitter, random 5xx/timeouts, invalid JSON, partial & empty payloads, session expiry (401), slot conflicts, and double-booking. The client handles all of them:

- **Typed errors** — `ApiError` with kinds (`network`, `timeout`, `http`, `parse`, `conflict`, `not_found`, `session_expired`) and a `isRetryable` flag; `humanizeApiError` maps them to user-facing copy.
- **Session expiry** — a 401 clears the session, signs the user out, and shows "please sign in again" on the login screen.
- **Booking conflicts** — client-side guard rails (expired slot, overlapping booking, double booking) run before the network call; the server stays authoritative and 409s are surfaced as friendly messages.
- **Crash reporting** — a `CrashReporter` interface with a console implementation; drop in Sentry/Bugsnag via `setCrashReporter()`.

Chaos is configured through `.env` and **disabled automatically under Jest** so the suite is deterministic:

```
EXPO_PUBLIC_MOCK_FAILURE_RATE=0.05   # 0 disables all injected chaos
EXPO_PUBLIC_MOCK_LATENCY_MS=400
EXPO_PUBLIC_USE_MOCK_API=true        # false → real HTTP via EXPO_PUBLIC_API_URL
```

## Module highlights

### Consultations
Search by name/city/specialty with sort options (rating, fee, experience, next available); doctor detail with generated slot grids; booking with conflict detection; upcoming/past bookings with cancellation.

### Shop
2-column product grid with infinite scroll, debounced search, sort + filter sheet (category, form, price, rating, stock); product detail with ingredients/tags; persisted cart with quantity caps, coupons (`AYUR10`, `VEDA15`, `SHIPFREE`), free-delivery threshold maths; wishlist; checkout form with validation.

### Health records
Month/year-grouped timeline (SectionList), filter by type/tag/provider/date, record detail with image/PDF attachment previews, and a validated "add record" form that works offline.

## Bonuses

- **Feature flags** — remote config (`/config/remote`) with local fallbacks, visible in Settings; gated features can be flipped per release.
- **Deep linking** — `ayurveda://doctor/doc_42`, `ayurveda://product/prod_17`, `ayurveda://record/rec_9`, `ayurveda://cart`, `ayurveda://bookings`, … (see `src/navigation/linking.ts`).
- **Localization** — English + Hindi, runtime switchable in Settings; `t('key', { vars })` interpolation.
- **Biometric lock** — `expo-local-authentication` gate on the login screen (enrolled devices only).
- **Design system** — 15+ primitives with light/dark tokens, accessible roles/labels, and haptics.

## AI features

- **Voice search** — animated mic button in the product & doctor search bars (`src/core/ai/voice/`). Tap → pulsing listen state → returns recognized text into the query. Ships with a **pluggable recognizer** (`VoiceRecognizer` interface + `createRecognizer()` factory); the default mock simulates latency + Ayurvedic-domain sample phrases. Swap in `@react-native-voice/voice`, Whisper, or `expo-speech-recognition` by implementing the same interface.
- **Recommendation engine** (`src/core/ai/recs/`) — pure, fully unit-tested scoring:
  - **For You** — content-based personalisation (category/tag/brand/search affinity, seen-item penalty, popularity blend); cold-start falls back to top-rated.
  - **Top Rated** — rating × log-scaled review volume.
  - **Similar items** — item-to-item cosine similarity on a 5-dim vector (category, tag-Jaccard, price, rating, brand).
  - **Trending** — popularity boosted by wishlist/cart/view engagement.
  - Interaction tracking is a persisted Zustand store (`ai:interactions`), so recommendations improve as the user browses.
- **UI** — `RecommendationRail` (horizontal rails above product grids), `SimilarSection` ("You might also like" on product detail), `VoiceSearchButton` (animated mic with pulse rings + a11y announcements).

## Testing

```
__tests__/
├── unit/      # date, search, booking validation, cart maths, timeline, sync queue, API/chaos, recommendation engine
├── hooks/     # debounce hooks (RNTL v14 async renderHook)
└── e2e/       # full user journey: sign in → shop → product → cart → checkout → order
```

- **99 tests / 11 suites**, all green.
- React Native Testing Library v14 (async `render`/`userEvent`); Jest preset `jest-expo`; in-memory AsyncStorage and official safe-area mock in `jest.setup.ts`.
- The e2e test renders the real `App` tree — real navigation, stores, query client, and mock backend.

## Swapping in a real backend

1. Set `EXPO_PUBLIC_USE_MOCK_API=false` and point `EXPO_PUBLIC_API_URL` at your server.
2. The client already speaks JSON with auth headers, pagination params, and error envelopes — implement the routes in `src/modules/*/api.ts`'s expected shape (`/doctors`, `/bookings`, `/products`, `/records`, `/auth/login`, `/config/remote`).
3. Remove `core/api/mockServer.ts` when no longer needed.

## Known trade-offs

- **Classic React Navigation, not Expo Router** — chosen to match the "use React Navigation" requirement; deep linking is configured via the `linking` option instead of file-based routes.
- **Mock-first** — offline queue mutations replay against the mock server, which resets on app restart; a real backend makes the queue end-to-end.
- **Client-side search/scoring** — fine for the mock; a real backend would move ranking into SQL/Meilisearch/Elasticsearch.
- **Cart checkout is simulated** — no payment integration; `Place order` clears the cart after a simulated round-trip.

## Requirements

- Node 20+, Expo SDK 58 (React Native 0.88, React 19.3).
- iOS/Android simulator or Expo Go / dev build.
