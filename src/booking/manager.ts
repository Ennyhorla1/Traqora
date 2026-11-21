import { BookingStatus, isValidTransition } from './state';

export interface Booking {
  id: string;
  status: BookingStatus;
}

export class BookingManager {
  private bookings = new Map<string, Booking>();
  private locks = new Map<string, Promise<void>>();

  public createBooking(id: string, status: BookingStatus = 'pending'): Booking {
    const booking: Booking = { id, status };
    this.bookings.set(id, booking);
    return booking;
  }

  public getBooking(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  public async transitionBooking(id: string, targetStatus: BookingStatus): Promise<Booking> {
    // Simple concurrency locking per booking id
    let releaseLock = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    const existingLock = this.locks.get(id) || Promise.resolve();
    this.locks.set(id, existingLock.then(() => lockPromise));

    await existingLock;

    try {
      const booking = this.bookings.get(id);
      if (!booking) {
        throw new Error(`Booking not found: ${id}`);
      }

      if (!isValidTransition(booking.status, targetStatus)) {
        throw new Error(`Invalid state transition from ${booking.status} to ${targetStatus}`);
      }

      booking.status = targetStatus;
      this.bookings.set(id, booking);
      return { ...booking };
    } finally {
      releaseLock();
    }
  }
}
