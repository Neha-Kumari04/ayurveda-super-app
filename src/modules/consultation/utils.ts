import { ApiError } from '@/core/api/errors';
import { isPast } from '@/utils/date';

import type { TimeSlot, Booking, Doctor } from './types';

export interface BookingValidation {
  ok: boolean;
  reason?: 'expired' | 'conflict' | 'double_booked';
  message?: string;
}

/**
 * Pure client-side guard rails that run before the network call.
 * The server remains authoritative — these just give instant feedback and
 * save a pointless round-trip when we already know the answer.
 */
export function validateBookingRequest(options: {
  slot: TimeSlot;
  now?: Date;
  existingBookings?: Booking[];
  doctor?: Doctor;
}): BookingValidation {
  const { slot, now = new Date(), existingBookings = [], doctor } = options;

  if (slot.isBooked) {
    const ownedByMe = existingBookings.some(
      (b) => b.status === 'confirmed' && b.start === slot.start && b.doctorId === slot.doctorId,
    );
    return ownedByMe
      ? { ok: false, reason: 'double_booked', message: 'You already have a booking for this slot.' }
      : { ok: false, reason: 'conflict', message: 'This slot was just booked by another patient.' };
  }

  if (isPast(slot.start, now)) {
    return { ok: false, reason: 'expired', message: 'That slot has expired. Please choose a future slot.' };
  }

  if (doctor && !doctor.isAvailable) {
    return { ok: false, reason: 'conflict', message: 'This doctor is not accepting bookings right now.' };
  }

  // Overlap with any other confirmed booking of mine.
  const overlap = existingBookings.find(
    (b) => b.status === 'confirmed' && !(slot.end <= b.start || slot.start >= b.end),
  );
  if (overlap) {
    return {
      ok: false,
      reason: 'conflict',
      message: `You already have a consultation with ${overlap.doctorName} that overlaps this time.`,
    };
  }

  return { ok: true };
}

/** Maps API errors onto the domain-specific conflict messages. */
export function bookingErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === 'conflict') {
    const message = typeof error.body === 'object' && error.body !== null && 'message' in error.body
      ? String((error.body as { message: unknown }).message)
      : error.message;
    if (message.toLowerCase().includes('already')) return 'You already booked this slot.';
    if (message.toLowerCase().includes('expired')) return 'That slot has expired. Please choose a future slot.';
    return message ? `${message} Please pick another time.` : 'That slot was just taken — pick another.';
  }
  if (error instanceof ApiError && error.kind === 'network') {
    return 'You’re offline. Your booking will be saved and synced when you reconnect.';
  }
  return 'Could not complete the booking. Please try again.';
}

/** Upcoming = confirmed and not yet finished. */
export function isUpcoming(booking: Booking, now = new Date()): boolean {
  return booking.status === 'confirmed' && new Date(booking.end).getTime() > now.getTime();
}

export function isCancellable(booking: Booking, now = new Date()): boolean {
  return booking.status === 'confirmed' && new Date(booking.start).getTime() > now.getTime();
}
