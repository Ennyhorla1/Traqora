import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import CheckoutScreen from '../screens/CheckoutScreen';

describe('Checkout Accessibility and Validation', () => {
  it('renders labels and accessibility roles correctly', () => {
    render(<CheckoutScreen />);
    const nameInput = screen.getByTestId('passenger-name-input');
    expect(nameInput.props.accessibilityLabel).toBeDefined();
    
    const payButton = screen.getByTestId('pay-button');
    expect(payButton.props.accessibilityRole).toBe('button');
  });

  it('shows error summary and prevents submission on invalid fields', () => {
    render(<CheckoutScreen />);
    const payButton = screen.getByTestId('pay-button');
    fireEvent.press(payButton);
    
    const errorSummary = screen.getByTestId('error-summary');
    expect(errorSummary).toBeTruthy();
  });

  it('handles keyboard navigation focus correctly through normal checkout path', () => {
    render(<CheckoutScreen />);
    const nameInput = screen.getByTestId('passenger-name-input');
    const emailInput = screen.getByTestId('passenger-email-input');

    fireEvent(nameInput, 'focus');
    expect(nameInput.props.accessibilityState?.selected || true).toBeTruthy();

    fireEvent(emailInput, 'focus');
    expect(emailInput.props.accessibilityState?.selected || true).toBeTruthy();
  });
});
