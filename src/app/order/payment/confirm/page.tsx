"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useStripePayment } from '@/hooks/useStripePayment';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentConfirmationForm() {
  const [isReady, setIsReady] = useState(false);
  const { isProcessing, message, handlePayment } = useStripePayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePayment();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement onReady={() => setIsReady(true)} />
      
      <button
        type="submit"
        disabled={!isReady || isProcessing}
        className="w-full bg-bakery-primary text-white px-6 py-3 rounded-md hover:bg-bakery-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isReady ? 'Loading Payment Form...' : isProcessing ? 'Processing Payment...' : 'Complete Payment'}
      </button>
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successful') || message.includes('authorized') || message.includes('Redirecting')
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}

export default function PaymentConfirmationPage() {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Get the client secret from session storage
    const storedClientSecret = sessionStorage.getItem('paymentIntentClientSecret');
    
    if (!storedClientSecret) {
      setError('No payment intent found. Please start your order again.');
      setIsLoading(false);
      return;
    }

    setClientSecret(storedClientSecret);
    setIsLoading(false);
  }, []);

  // Check if Stripe key is available
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600">Stripe configuration is missing. Please contact support.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/order')}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
          >
            Back to Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bakery-cream via-bakery-warm to-bakery-butter py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Complete Your Payment
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-2">
                <p className="text-sm text-blue-800">
                  <strong>Payment method saved!</strong> Your payment method has been saved and will be used for this payment and future orders.
                </p>
              </div>
            </div>
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentConfirmationForm />
          </Elements>
        </div>
      </div>
    </div>
  );
} 