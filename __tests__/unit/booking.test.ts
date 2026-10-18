import { bookingErrorMessage, isCancellable, isUpcoming, validateBookingRequest } from '@/modules/consultation/utils';
import { ApiError } from '@/core/api/errors';

import type { Booking, Doctor, TimeSlot } from '@/modules/consultation/types';

const now = new Date('2026-06-15T10:00:00.000Z');

function makeSlot(overrides: Partial<TimeSlot> = {}): TimeSlot {
  return {
    id: 'slot_1',
    doctorId: 'doc_1',
    start: new Date('2026-06-15T14:00:00.000Z').toISOString(),
    end: new Date('2026-06-15T14:30:00.000Z').toISOString(),
    isBooked: false,
    ...overrides,
  };
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'bk_1',
    doctorId: 'doc_1',
    doctorName: 'Dr. Test',
    specialty: 'Kayachikitsa',
    start: new Date('2026-06-15T09:00:00.000Z').toISOString(),
    end: new Date('2026-06-15T09:30:00.000Z').toISOString(),
    fee: 1000,
    status: 'confirmed',
    createdAt: now.toISOString(),
    ...overrides,
  };
}

const doctor = { isAvailable: true } as Doctor;

describe('validateBookingRequest', () => {
  it('accepts a free future slot', () => {
    expect(validateBookingRequest({ slot: makeSlot(), now, existingBookings: [], doctor })).toEqual({ ok: true });
  });

  it('rejects an already-booked slot with conflict', () => {
    const result = validateBookingRequest({
      slot: makeSlot({ isBooked: true }),
      now,
      existingBookings: [],
      doctor,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('conflict');
  });

  it('flags double booking when the confirmed slot is mine', () => {
    const slot = makeSlot({ isBooked: true });
    const mine = makeBooking({ start: slot.start, end: slot.end });
    const result = validateBookingRequest({ slot, now, existingBookings: [mine], doctor });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('double_booked');
  });

  it('rejects expired slots', () => {
    const result = validateBookingRequest({
      slot: makeSlot({ start: new Date('2026-06-15T09:30:00.000Z').toISOString() }),
      now,
      existingBookings: [],
      doctor,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('expired');
  });

  it('rejects when the doctor is unavailable', () => {
    const result = validateBookingRequest({
      slot: makeSlot(),
      now,
      existingBookings: [],
      doctor: { isAvailable: false } as Doctor,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('conflict');
  });

  it('rejects overlapping bookings with another doctor', () => {
    const overlap = makeBooking({
      doctorId: 'doc_2',
      start: new Date('2026-06-15T13:45:00.000Z').toISOString(),
      end: new Date('2026-06-15T14:15:00.000Z').toISOString(),
    });
    const result = validateBookingRequest({ slot: makeSlot(), now, existingBookings: [overlap], doctor });
    expect(result.ok).toBe(false);
    expect(result.message).toContain('overlaps');
  });

  it('allows booking when the only existing booking is cancelled', () => {
    const cancelled = makeBooking({
      start: makeSlot().start,
      end: makeSlot().end,
      status: 'cancelled',
    });
    expect(validateBookingRequest({ slot: makeSlot(), now, existingBookings: [cancelled], doctor }).ok).toBe(true);
  });
});

describe('bookingErrorMessage', () => {
  it('maps 409 conflict bodies', () => {
    const error = new ApiError('conflict', 'HTTP 409', 409, { message: 'This slot was just booked by another patient' });
    expect(bookingErrorMessage(error)).toContain('pick another');
  });

  it('maps double-booking messages', () => {
    const error = new ApiError('conflict', 'HTTP 409', 409, { message: 'You have already booked this slot' });
    expect(bookingErrorMessage(error)).toContain('already booked');
  });

  it('maps network errors to the offline message', () => {
    expect(bookingErrorMessage(ApiError.network())).toContain('offline');
  });
});

describe('isUpcoming / isCancellable', () => {
  it('treats future confirmed bookings as upcoming', () => {
    const future = makeBooking({
      start: new Date('2026-06-15T12:00:00.000Z').toISOString(),
      end: new Date('2026-06-15T12:30:00.000Z').toISOString(),
    });
    expect(isUpcoming(future, now)).toBe(true);
    expect(isCancellable(future, now)).toBe(true);
  });

  it('treats cancelled bookings as not upcoming', () => {
    expect(isUpcoming(makeBooking({ status: 'cancelled' }), now)).toBe(false);
  });

  it('past bookings are not cancellable', () => {
    expect(isCancellable(makeBooking(), now)).toBe(false);
  });
});
