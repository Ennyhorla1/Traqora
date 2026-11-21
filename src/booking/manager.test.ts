import { BookingManager } from './manager';

describe('BookingManager State Transitions', () => {
  test('allows valid transitions (pending -> confirmed -> completed)', async () => {
    const manager = new BookingManager();
    manager.createBooking('b1', 'pending');

    const confirmed = await manager.transitionBooking('b1', 'confirmed');
    expect(confirmed.status).toBe('confirmed');

    const completed = await manager.transitionBooking('b1', 'completed');
    expect(completed.status).toBe('completed');
  });

  test('rejects invalid transitions (pending -> completed)', async () => {
    const manager = new BookingManager();
    manager.createBooking('b2', 'pending');

    await expect(manager.transitionBooking('b2', 'completed')).rejects.toThrow(
      /Invalid state transition/
    );
  });

  test('handles concurrent transition attempts correctly', async () => {
    const manager = new BookingManager();
    manager.createBooking('b3', 'pending');

    // Attempt two conflicting transitions concurrently
    const p1 = manager.transitionBooking('b3', 'confirmed');
    const p2 = manager.transitionBooking('b3', 'cancelled');

    const results = await Promise.allSettled([p1, p2]);
    
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const finalBooking = manager.getBooking('b3');
    expect(finalBooking?.status).toBe('confirmed');
  });
});
