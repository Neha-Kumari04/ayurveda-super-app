import { env } from '@/core/config/env';
import { ApiError } from './errors';
import { getDoctors, getSlotsForDate, DOCTOR_COUNT } from '@/data/generators/doctors';
import { getProductById, getProducts, PRODUCT_COUNT } from '@/data/generators/products';
import { getRecordById, getRecords, RECORD_COUNT } from '@/data/generators/healthRecords';
import { matchesQuery, normalizeQuery, scoreMatch } from '@/utils/search';
import { isPast } from '@/utils/date';

import type { Booking, Doctor, DoctorSearchParams, SortOption, TimeSlot } from '@/modules/consultation/types';
import type { Product, ProductSearchParams, ProductSortOption } from '@/modules/shop/types';
import type { HealthRecord, RecordSearchParams } from '@/modules/health/types';
import type { Paginated, QueryParams } from '@/types';

/**
 * In-app mock backend.
 *
 * Serves deterministic generated data with realistic network behaviour:
 * latency, random failures, timeouts, invalid payloads, empty and partial
 * responses, session expiry and booking conflicts. Swap `USE_MOCK_API=false`
 * to point the client at a real HTTP backend instead — nothing else changes.
 */

export interface MockResponse {
  status: number;
  /** Objects are returned as-is; strings exercise the client's JSON parser. */
  body: unknown;
}

interface Session {
  token: string;
  expiresAt: number;
}

const sessions = new Set<string>();
const bookedSlots = new Map<string, string>(); // slotId -> bookingId
const userBookings = new Map<string, Booking[]>();
let bookingSeq = 0;

// ---------------------------------------------------------------------------
// Chaos engineering knobs
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chaosRoll(): number {
  return Math.random();
}

/** Chaos (random empties/failures) only runs when a failure rate is configured. */
const chaosEnabled = env.mockFailureRate > 0;

async function simulateNetwork(): Promise<void> {
  if (env.mockLatencyMs <= 0) return;
  // ±50% jitter around the configured latency.
  const jitter = env.mockLatencyMs * (0.5 + Math.random());
  await sleep(jitter);
}

function maybeFail(method: string): void {
  if (chaosRoll() >= env.mockFailureRate) return;
  const roll = chaosRoll();
  if (roll < 0.4) throw ApiError.network('Simulated connection drop');
  if (roll < 0.7) throw new ApiError('http', 'Simulated server error', 500);
  if (method === 'GET' && roll < 0.85) return; // handled by caller as invalid/partial payload
  throw ApiError.timeout(env.apiTimeoutMs);
}

/** Occasionally corrupts a GET payload to exercise client-side parse guards. */
function maybeCorruptGet<T>(body: T): MockResponse {
  const roll = chaosRoll();
  if (roll < env.mockFailureRate * 0.5) {
    return { status: 200, body: '{"items": [invalid json' };
  }
  if (roll < env.mockFailureRate * 0.75) {
    // Partial response: valid JSON but missing collection keys.
    return { status: 200, body: { unexpected: true } };
  }
  return { status: 200, body };
}

function requireAuth(params: QueryParams | undefined, headers?: Record<string, string>): Session {
  const token = headers?.Authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    throw ApiError.http(401);
  }
  const expiresAt = Number.parseInt(token.split('.')[1] ?? '0', 10);
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    sessions.delete(token);
    throw ApiError.http(401);
  }
  void params;
  return { token, expiresAt };
}

// ---------------------------------------------------------------------------
// Doctors
// ---------------------------------------------------------------------------

const DOCTOR_SORTS: Record<SortOption, (a: Doctor, b: Doctor) => number> = {
  rating: (a, b) => b.rating - a.rating || a.id.localeCompare(b.id),
  fee_low: (a, b) => a.fee - b.fee,
  fee_high: (a, b) => b.fee - a.fee,
  experience: (a, b) => b.experienceYears - a.experienceYears,
  next_available: (a, b) => a.nextAvailableAt.localeCompare(b.nextAvailableAt),
};

function filterDoctors(params: DoctorSearchParams): Doctor[] {
  const query = normalizeQuery(params.q ?? '');
  let list = getDoctors();

  if (params.specialties?.length) {
    const set = new Set(params.specialties);
    list = list.filter((d) => set.has(d.specialty));
  }
  if (params.cities?.length) {
    const set = new Set(params.cities);
    list = list.filter((d) => set.has(d.city));
  }
  if (params.genders?.length) {
    const set = new Set(params.genders);
    list = list.filter((d) => set.has(d.gender));
  }
  if (params.minRating) list = list.filter((d) => d.rating >= (params.minRating as number));
  if (params.maxFee) list = list.filter((d) => d.fee <= (params.maxFee as number));
  if (params.minExperience) list = list.filter((d) => d.experienceYears >= (params.minExperience as number));
  if (params.availableOnly) list = list.filter((d) => d.isAvailable);

  if (query) {
    list = list.filter((d) => matchesQuery(d.searchText, query));
    if (params.sort === undefined || params.sort === 'rating') {
      list = [...list].sort((a, b) => {
        const scoreDiff = scoreMatch({ searchText: a.searchText, primaryText: a.name.toLowerCase() }, query) -
          scoreMatch({ searchText: b.searchText, primaryText: b.name.toLowerCase() }, query);
        return scoreDiff !== 0 ? scoreDiff : b.rating - a.rating;
      });
      return list;
    }
  }

  const sort = DOCTOR_SORTS[params.sort ?? 'rating'];
  return [...list].sort(sort);
}

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    page,
    pageSize,
    total: items.length,
    hasMore: start + slice.length < items.length,
  };
}

type Paged<T> = T & { page?: number; pageSize?: number };

function handleDoctors(params: QueryParams): MockResponse {
  const search: Paged<DoctorSearchParams> = {
    q: params.q as string | undefined,
    page: Number(params.page ?? 1),
    pageSize: Math.min(Number(params.pageSize ?? 20), 50),
    specialties: (params.specialties as string[] | undefined) as DoctorSearchParams['specialties'],
    cities: params.cities as string[] | undefined,
    genders: (params.genders as string[] | undefined) as DoctorSearchParams['genders'],
    minRating: params.minRating ? Number(params.minRating) : undefined,
    maxFee: params.maxFee ? Number(params.maxFee) : undefined,
    minExperience: params.minExperience ? Number(params.minExperience) : undefined,
    availableOnly: params.availableOnly === 'true' || params.availableOnly === true,
    sort: (params.sort as SortOption | undefined) ?? 'rating',
  };

  if (chaosEnabled && !search.q && !search.specialties?.length && chaosRoll() < 0.02) {
    return { status: 200, body: { items: [], page: 1, pageSize: search.pageSize, total: 0, hasMore: false } };
  }

  const filtered = filterDoctors(search);
  const page = paginate(filtered, search.page ?? 1, search.pageSize ?? 20);
  return maybeCorruptGet(page);
}

function handleDoctorDetail(id: string): MockResponse {
  const doctor = getDoctors().find((d) => d.id === id);
  if (!doctor) throw ApiError.http(404);
  return { status: 200, body: doctor };
}

function handleSlots(doctorId: string, params: QueryParams): MockResponse {
  const doctor = getDoctors().find((d) => d.id === doctorId);
  if (!doctor) throw ApiError.http(404);

  const dateParam = typeof params.date === 'string' ? params.date : new Date().toISOString();
  const date = new Date(dateParam);
  if (Number.isNaN(date.getTime())) throw ApiError.http(400);

  const slots: TimeSlot[] = getSlotsForDate(doctorId, date).map((slot) => ({
    ...slot,
    isBooked: slot.isBooked || bookedSlots.has(slot.id),
  }));

  // Occasionally return a partial payload for the slot list.
  if (chaosRoll() < env.mockFailureRate * 0.5) {
    return { status: 200, body: { doctorId, date: dateParam, slots: slots.slice(0, 3), partial: true } };
  }
  return { status: 200, body: { doctorId, date: dateParam, slots, partial: false } };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

interface CreateBookingBody {
  doctorId: string;
  slotId: string;
  start: string;
  end: string;
  reason?: string;
}

function handleCreateBooking(body: CreateBookingBody, params: QueryParams, headers: Record<string, string>): MockResponse {
  const session = requireAuth(params, headers);
  const userId = session.token;

  const doctor = getDoctors().find((d) => d.id === body.doctorId);
  if (!doctor) throw ApiError.http(404);

  // Expired slot.
  if (isPast(body.start)) {
    throw new ApiError('conflict', 'This slot has already started and can no longer be booked', 409);
  }

  // Slot conflict — booked by someone else (or a previous attempt).
  if (bookedSlots.has(body.slotId)) {
    const existing = userBookings.get(userId)?.find((b) => b.id === bookedSlots.get(body.slotId));
    if (existing) {
      // Double booking attempt by the same user.
      throw new ApiError('conflict', 'You have already booked this slot', 409);
    }
    throw new ApiError('conflict', 'This slot was just booked by another patient', 409);
  }

  // Doctor-level conflict: overlapping time with an existing confirmed booking.
  const existingBookings = userBookings.get(userId) ?? [];
  const overlap = existingBookings.find(
    (b) => b.status === 'confirmed' && !(body.end <= b.start || body.start >= b.end),
  );
  if (overlap) {
    throw new ApiError('conflict', 'You already have a consultation that overlaps this time', 409);
  }

  bookingSeq += 1;
  const booking: Booking = {
    id: `bk_${Date.now()}_${bookingSeq}`,
    doctorId: doctor.id,
    doctorName: doctor.name,
    specialty: doctor.specialty,
    start: body.start,
    end: body.end,
    fee: doctor.fee,
    status: 'confirmed',
    reason: body.reason,
    createdAt: new Date().toISOString(),
  };

  bookedSlots.set(body.slotId, booking.id);
  userBookings.set(userId, [booking, ...existingBookings]);

  return { status: 201, body: booking };
}

function handleListBookings(params: QueryParams, headers: Record<string, string>): MockResponse {
  const session = requireAuth(params, headers);
  const all = userBookings.get(session.token) ?? [];
  const status = params.status as string | undefined;
  const items = status ? all.filter((b) => b.status === status) : all;
  return { status: 200, body: { items, total: items.length } };
}

function handleCancelBooking(id: string, params: QueryParams, headers: Record<string, string>): MockResponse {
  const session = requireAuth(params, headers);
  const list = userBookings.get(session.token) ?? [];
  const booking = list.find((b) => b.id === id);
  if (!booking) throw ApiError.http(404);
  if (booking.status === 'cancelled') throw ApiError.http(409, { message: 'Already cancelled' });
  if (isPast(booking.start)) throw new ApiError('conflict', 'Past consultations cannot be cancelled', 409);

  booking.status = 'cancelled';
  booking.cancelledAt = new Date().toISOString();
  for (const [slotId, bookingId] of bookedSlots) {
    if (bookingId === id) bookedSlots.delete(slotId);
  }
  return { status: 200, body: booking };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const PRODUCT_SORTS: Record<ProductSortOption, (a: Product, b: Product) => number> = {
  relevance: () => 0,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => b.id.localeCompare(a.id),
};

function filterProducts(params: ProductSearchParams): Product[] {
  const query = normalizeQuery(params.q ?? '');
  let list = getProducts();

  if (params.categories?.length) {
    const set = new Set(params.categories);
    list = list.filter((p) => set.has(p.category));
  }
  if (params.forms?.length) {
    const set = new Set(params.forms);
    list = list.filter((p) => set.has(p.form));
  }
  if (params.tags?.length) {
    const set = new Set(params.tags);
    list = list.filter((p) => p.tags.some((t) => set.has(t)));
  }
  if (params.minPrice !== undefined) list = list.filter((p) => p.price >= (params.minPrice as number));
  if (params.maxPrice !== undefined) list = list.filter((p) => p.price <= (params.maxPrice as number));
  if (params.minRating) list = list.filter((p) => p.rating >= (params.minRating as number));
  if (params.inStockOnly) list = list.filter((p) => p.inStock);

  if (query) {
    list = list.filter((p) => matchesQuery(p.searchText, query));
    if (!params.sort || params.sort === 'relevance') {
      return [...list].sort((a, b) => {
        const scoreDiff =
          scoreMatch({ searchText: a.searchText, primaryText: a.name.toLowerCase() }, query) -
          scoreMatch({ searchText: b.searchText, primaryText: b.name.toLowerCase() }, query);
        return scoreDiff !== 0 ? scoreDiff : b.rating - a.rating;
      });
    }
  }

  const sort = PRODUCT_SORTS[params.sort ?? 'relevance'];
  return [...list].sort(sort);
}

function handleProducts(params: QueryParams): MockResponse {
  const search: Paged<ProductSearchParams> = {
    q: params.q as string | undefined,
    page: Number(params.page ?? 1),
    pageSize: Math.min(Number(params.pageSize ?? 20), 50),
    categories: (params.categories as string[] | undefined) as ProductSearchParams['categories'],
    forms: (params.forms as string[] | undefined) as ProductSearchParams['forms'],
    tags: params.tags as string[] | undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    inStockOnly: params.inStockOnly === 'true' || params.inStockOnly === true,
    sort: (params.sort as ProductSortOption | undefined) ?? 'relevance',
  };

  if (chaosEnabled && !search.q && !search.categories?.length && chaosRoll() < 0.01) {
    return { status: 200, body: { items: [], page: 1, pageSize: search.pageSize ?? 20, total: 0, hasMore: false } };
  }

  const filtered = filterProducts(search);
  const page = paginate(filtered, search.page ?? 1, search.pageSize ?? 20);
  return maybeCorruptGet(page);
}

function handleProductDetail(id: string): MockResponse {
  const product = getProductById(id);
  if (!product) throw ApiError.http(404);
  return { status: 200, body: product };
}

// ---------------------------------------------------------------------------
// Health records
// ---------------------------------------------------------------------------

function filterRecords(params: RecordSearchParams): HealthRecord[] {
  const query = normalizeQuery(params.q ?? '');
  let list = getRecords();

  if (params.types?.length) {
    const set = new Set(params.types);
    list = list.filter((r) => set.has(r.type));
  }
  if (params.tags?.length) {
    const set = new Set(params.tags);
    list = list.filter((r) => r.tags.some((t) => set.has(t)));
  }
  if (params.providers?.length) {
    const set = new Set(params.providers);
    list = list.filter((r) => set.has(r.provider));
  }
  if (params.fromDate) list = list.filter((r) => r.date >= (params.fromDate as string));
  if (params.toDate) list = list.filter((r) => r.date <= (params.toDate as string));

  if (query) list = list.filter((r) => matchesQuery(r.searchText, query));
  return list;
}

function handleRecords(params: QueryParams): MockResponse {
  const search: Paged<RecordSearchParams> = {
    q: params.q as string | undefined,
    page: Number(params.page ?? 1),
    pageSize: Math.min(Number(params.pageSize ?? 30), 60),
    types: params.types as string[] | undefined as RecordSearchParams['types'],
    tags: params.tags as string[] | undefined,
    providers: params.providers as string[] | undefined,
    fromDate: params.fromDate as string | undefined,
    toDate: params.toDate as string | undefined,
  };

  if (chaosEnabled && !search.q && !search.types?.length && chaosRoll() < 0.01) {
    return { status: 200, body: { items: [], page: 1, pageSize: search.pageSize ?? 30, total: 0, hasMore: false } };
  }

  const filtered = filterRecords(search);
  const page = paginate(filtered, search.page ?? 1, search.pageSize ?? 30);
  return maybeCorruptGet(page);
}

function handleRecordDetail(id: string): MockResponse {
  const record = getRecordById(id);
  if (!record) throw ApiError.http(404);
  return { status: 200, body: record };
}

interface CreateRecordBody {
  type: string;
  title: string;
  description: string;
  date: string;
  provider: string;
  tags: string[];
}

function handleCreateRecord(body: CreateRecordBody, params: QueryParams, headers: Record<string, string>): MockResponse {
  requireAuth(params, headers);
  const record: HealthRecord = {
    id: `rec_local_${Date.now()}`,
    type: body.type as HealthRecord['type'],
    title: body.title,
    description: body.description,
    date: body.date,
    provider: body.provider,
    tags: body.tags ?? [],
    attachments: [],
    meta: {},
    searchText: `${body.title} ${body.description} ${body.provider}`.toLowerCase(),
    syncStatus: 'synced',
  };
  getRecords().unshift(record);
  return { status: 201, body: record };
}

// ---------------------------------------------------------------------------
// Auth & remote config
// ---------------------------------------------------------------------------

function handleLogin(body: { email?: string; password?: string }): MockResponse {
  if (!body.email || !body.password) {
    return { status: 400, body: { message: 'Email and password are required' } };
  }
  if (body.password.length < 4) {
    return { status: 401, body: { message: 'Invalid credentials' } };
  }
  const expiresAt = Date.now() + env.sessionTtlMs;
  const token = `tok.${expiresAt}.${Math.random().toString(36).slice(2)}`;
  sessions.add(token);
  return {
    status: 201,
    body: {
      token,
      expiresAt,
      user: { id: 'usr_1', name: 'Asha Sharma', email: body.email, avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Asha%20Sharma' },
    },
  };
}

function handleRemoteConfig(): MockResponse {
  return {
    status: 200,
    body: {
      flags: {
        'shop.checkout_v2': true,
        'consultation.video_enabled': false,
        'health.timeline_redesign': chaosEnabled ? chaosRoll() > 0.5 : true,
        'sync.background_enabled': true,
      },
      minSupportedVersion: '1.0.0',
      updatedAt: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const doctors = getDoctors();
const products = getProducts();
const records = getRecords();

export async function mockRequest(
  method: string,
  path: string,
  options: { params?: QueryParams; body?: unknown; headers?: Record<string, string> } = {},
): Promise<MockResponse> {
  await simulateNetwork();
  maybeFail(method);

  const params = options.params ?? {};
  const headers = options.headers ?? {};
  const segments = path.split('?')[0].split('/').filter(Boolean);

  // --- auth ---
  if (segments[0] === 'auth' && segments[1] === 'login' && method === 'POST') {
    return handleLogin(options.body as { email?: string; password?: string });
  }

  // --- remote config (public) ---
  if (segments[0] === 'config' && segments[1] === 'remote') {
    return handleRemoteConfig();
  }

  // --- doctors ---
  if (segments[0] === 'doctors') {
    if (segments.length === 1 && method === 'GET') return handleDoctors(params);
    if (segments.length === 2 && method === 'GET') return handleDoctorDetail(segments[1]);
    if (segments.length === 3 && segments[2] === 'slots' && method === 'GET') {
      return handleSlots(segments[1], params);
    }
  }

  // --- bookings ---
  if (segments[0] === 'bookings') {
    if (segments.length === 1 && method === 'POST') {
      return handleCreateBooking(options.body as CreateBookingBody, params, headers);
    }
    if (segments.length === 1 && method === 'GET') return handleListBookings(params, headers);
    if (segments.length === 2 && method === 'DELETE') return handleCancelBooking(segments[1], params, headers);
  }

  // --- products ---
  if (segments[0] === 'products') {
    if (segments.length === 1 && method === 'GET') return handleProducts(params);
    if (segments.length === 2 && method === 'GET') return handleProductDetail(segments[1]);
  }

  // --- health records ---
  if (segments[0] === 'records') {
    if (segments.length === 1 && method === 'GET') return handleRecords(params);
    if (segments.length === 1 && method === 'POST') {
      return handleCreateRecord(options.body as CreateRecordBody, params, headers);
    }
    if (segments.length === 2 && method === 'GET') return handleRecordDetail(segments[1]);
  }

  void doctors;
  void products;
  void records;
  void DOCTOR_COUNT;
  void PRODUCT_COUNT;
  void RECORD_COUNT;

  throw ApiError.http(404, { message: `No mock route for ${method} ${path}` });
}
