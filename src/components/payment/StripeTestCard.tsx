"use client";

import { useState } from 'react';

export default function StripeTestCard() {
  const [isVisible, setIsVisible] = useState(false);

  const testCards = [
    {
      name: 'Visa',
      number: '4242424242424242',
      description: 'Successful payment'
    },
    {
      name: 'Visa (debit)',
      number: '4000056655665556',
      description: 'Successful payment'
    },
    {
      name: 'Mastercard',
      number: '5555555555554444',
      description: 'Successful payment'
    },
    {
      name: 'American Express',
      number: '378282246310005',
      description: 'Successful payment'
    },
    {
      name: 'Declined Card',
      number: '4000000000000002',
      description: 'Card declined'
    }
  ];

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Show Test Cards
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Stripe Test Cards</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        {testCards.map((card) => (
          <div key={card.number} className="border border-gray-200 rounded p-2">
            <div className="font-medium text-gray-900">{card.name}</div>
            <div className="font-mono text-gray-600">{card.number}</div>
            <div className="text-gray-500 text-xs">{card.description}</div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>• Use any future expiry date</p>
        <p>• Use any 3-digit CVC (4 for Amex)</p>
        <p>• Use any billing address</p>
      </div>
    </div>
  );
} 