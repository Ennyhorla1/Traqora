use booking::{BookingContract, BookingContractClient};
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol};

#[test]
fn test_legal_booking_state_transitions() {
    let env = Env::default();
    env.mock_all_auths();

    let passenger = Address::generate(&env);
    let airline = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register(BookingContract, ());
    let client = BookingContractClient::new(&env, &contract_id);

    let flight = Symbol::new(&env, "FL123");
    let from = Symbol::new(&env, "JFK");
    let to = Symbol::new(&env, "LAX");

    let booking_id = client.create_booking(
        &passenger,
        &airline,
        &flight,
        &from,
        &to,
        &10_000,
        &1000,
        &token,
    );

    let booking = client.get_booking(&booking_id).unwrap();
    assert_eq!(booking.status, Symbol::new(&env, "pending"));

    // Pay for booking transitions pending -> confirmed
    client.pay_for_booking(&booking_id);
    let booking = client.get_booking(&booking_id).unwrap();
    assert_eq!(booking.status, Symbol::new(&env, "confirmed"));

    // Complete booking transitions confirmed -> completed
    client.complete_booking(&airline, &booking_id);
    let booking = client.get_booking(&booking_id).unwrap();
    assert_eq!(booking.status, Symbol::new(&env, "completed"));
}

#[test]
#[should_panic(expected = "Invalid booking status")]
fn test_invalid_out_of_order_transition_completed_to_confirmed() {
    let env = Env::default();
    env.mock_all_auths();

    let passenger = Address::generate(&env);
    let airline = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register(BookingContract, ());
    let client = BookingContractClient::new(&env, &contract_id);

    let flight = Symbol::new(&env, "FL124");
    let from = Symbol::new(&env, "JFK");
    let to = Symbol::new(&env, "LAX");

    let booking_id = client.create_booking(
        &passenger,
        &airline,
        &flight,
        &from,
        &to,
        &10_000,
        &1000,
        &token,
    );

    client.pay_for_booking(&booking_id);
    client.complete_booking(&airline, &booking_id);

    // Trying to release payment again from completed status should fail
    client.complete_booking(&airline, &booking_id);
}

#[test]
#[should_panic(expected = "Already paid or cancelled")]
fn test_concurrent_or_double_payment_attempt() {
    let env = Env::default();
    env.mock_all_auths();

    let passenger = Address::generate(&env);
    let airline = Address::generate(&env);
    let token = Address::generate(&env);

    let contract_id = env.register(BookingContract, ());
    let client = BookingContractClient::new(&env, &contract_id);

    let flight = Symbol::new(&env, "FL125");
    let from = Symbol::new(&env, "JFK");
    let to = Symbol::new(&env, "LAX");

    let booking_id = client.create_booking(
        &passenger,
        &airline,
        &flight,
        &from,
        &to,
        &10_000,
        &1000,
        &token,
    );

    client.pay_for_booking(&booking_id);
    // Second payment attempt simulating concurrent/repeated transition
    client.pay_for_booking(&booking_id);
}
