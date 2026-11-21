# Booking Lifecycle and State Transitions

This document describes the v1 booking lifecycle, legal state transitions, and concurrency safeguards enforced by the booking smart contract.

## States
- `pending`: Created, awaiting payment from passenger.
- `processing`: Temporary intermediate state during execution of state-changing operations.
- `confirmed`: Payment received and held in escrow.
- `completed`: Funds released to airline post-flight.
- `cancelled` / `refunded`: Booking cancelled and funds returned according to refund rules.

## State Transition Validation
- Out-of-order transitions (e.g., releasing payment on a `pending` booking without prior payment) are rejected.
- Concurrent or duplicate transition attempts (such as paying twice or processing a locked booking) are prevented using transient `processing` status guards.
