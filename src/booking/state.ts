export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled', 'completed'],
  cancelled: [],
  completed: [],
};

export function isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
  const allowed = allowedTransitions[from];
  return allowed ? allowed.includes(to) : false;
}
