import React from 'react';

interface Quote {
  asset: string;
  amount: string;
  recipient?: string;
}

interface PaymentRequestModalProps {
  isOpen: boolean;
  quote: Quote | null;
  onAuthorize: () => void;
  onCancel: () => void;
}

export const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
  isOpen,
  quote,
  onAuthorize,
  onCancel,
}) => {
  if (!isOpen || !quote) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 id="payment-modal-title" className="text-xl font-semibold mb-4">
          Authorize Payment
        </h2>
        <p className="text-gray-600 mb-6">
          Please review the exact quote from the server and authorize the payment below.
        </p>
        <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Asset:</span>
            <span className="font-medium text-gray-900" data-testid="payment-asset">{quote.asset}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Amount:</span>
            <span className="font-bold text-lg text-gray-900" data-testid="payment-amount">{quote.amount}</span>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAuthorize}
            className="px-4 py-2 bg-indigo-650 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            data-testid="authorize-payment-btn"
          >
            Authorize Payment
          </button>
        </div>
      </div>
    </div>
  );
};
