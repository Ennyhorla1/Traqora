import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentRequestModal } from '../PaymentRequestModal';

describe('PaymentRequestModal exact quote authorization', () => {
  it('displays the exact server-validated asset and amount', () => {
    render(
      <PaymentRequestModal
        isOpen={true}
        quote={{ amount: '100.00', asset: 'USDC' }}
        onCancel={() => {}}
        onAuthorize={() => {}}
      />
    );
    expect(screen.getByTestId('payment-amount')).toHaveTextContent('100.00');
    expect(screen.getByTestId('payment-asset')).toHaveTextContent('USDC');
  });

  it('does not render when modal is closed or quote is missing', () => {
    const { container: c1 } = render(
      <PaymentRequestModal
        isOpen={false}
        quote={{ amount: '100.00', asset: 'USDC' }}
        onCancel={() => {}}
        onAuthorize={() => {}}
      />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <PaymentRequestModal
        isOpen={true}
        quote={null}
        onCancel={() => {}}
        onAuthorize={() => {}}
      />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('handles authorization and cancellation failure/callback paths', () => {
    const handleAuthorize = jest.fn();
    const handleCancel = jest.fn();

    render(
      <PaymentRequestModal
        isOpen={true}
        quote={{ amount: '50.00', asset: 'ETH' }}
        onCancel={handleCancel}
        onAuthorize={handleAuthorize}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('authorize-payment-btn'));
    expect(handleAuthorize).toHaveBeenCalledTimes(1);
  });
});
