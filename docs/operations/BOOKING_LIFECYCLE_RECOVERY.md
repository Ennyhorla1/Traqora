# Booking Lifecycle and Atomic Persistence Failure Recovery

## Overview
Booking and passenger records are persisted atomically within the Soroban smart contract layer (`BookingStorage::set_atomic`). This ensures that partial booking entries or orphaned traveler data cannot be left behind if a write operation fails partway.

## Failure Recovery
- **Atomic Writes**: Soroban ledger transactions execute all storage modifications within a single atomic boundary. If any step fails, the entire transaction reverts.
- **Orphan Prevention**: Passenger index records and core booking records are updated together. Verify booking IDs using `get_booking` and associated passenger records via `get_passenger_record`.
