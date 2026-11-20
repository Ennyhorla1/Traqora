# Wallet and Payment Feature

## PaymentRequestModal

Displays the exact server-validated quote (asset and amount) to the traveler for explicit wallet authorization before executing transactions. 

### Validation & Failure Paths
- Returns `null` if closed or if the quote is missing/invalid.
- Supports cancellation via the Cancel button.
- Requires explicit user authorization action via the Authorize Payment button.
