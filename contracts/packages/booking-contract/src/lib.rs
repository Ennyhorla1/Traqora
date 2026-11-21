pub enum BookingState {
    Pending,
    Confirmed,
    Cancelled,
    Completed,
}

impl BookingState {
    pub fn can_transition_to(&self, next: &BookingState) -> bool {
        match (self, next) {
            (BookingState::Pending, BookingState::Confirmed) => true,
            (BookingState::Pending, BookingState::Cancelled) => true,
            (BookingState::Confirmed, BookingState::Completed) => true,
            (BookingState::Confirmed, BookingState::Cancelled) => true,
            _ => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_transitions() {
        assert!(BookingState::Pending.can_transition_to(&BookingState::Confirmed));
        assert!(BookingState::Pending.can_transition_to(&BookingState::Cancelled));
        assert!(BookingState::Confirmed.can_transition_to(&BookingState::Completed));
        assert!(BookingState::Confirmed.can_transition_to(&BookingState::Cancelled));
    }

    #[test]
    fn test_invalid_transitions() {
        assert!(!BookingState::Completed.can_transition_to(&BookingState::Pending));
        assert!(!BookingState::Cancelled.can_transition_to(&BookingState::Confirmed));
        assert!(!BookingState::Pending.can_transition_to(&BookingState::Completed));
    }
}
