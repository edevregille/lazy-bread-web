"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createSetupIntent, createOrFindCustomer } from '@/lib/stripeApi';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import StripeTestCard from '@/components/payment/StripeTestCard';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function AddPaymentMethodForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-methods?success=true`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || 'An error occurred');
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/payment-methods');
      }, 2000);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Method Added!</h2>
        <p className="text-gray-600">Redirecting you back to payment methods...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Payment Method</h3>
        <PaymentElement />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-bakery-primary text-white py-3 px-4 rounded-md hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Payment Method'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/payment-methods')}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddPaymentMethodPage() {
  const { currentUser, loading, userProfile } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/');
      return;
    }

    if (currentUser) {
      if (userProfile?.stripeCustomerId) {
        // User has a Stripe customer, create setup intent
        createSetupIntent(userProfile.stripeCustomerId)
          .then(({ clientSecret }) => {
            setClientSecret(clientSecret);
          })
          .catch((error) => {
            console.error('Error creating setup intent:', error);
            setSetupError('Failed to initialize payment form. Please try again.');
          })
          .finally(() => {
            setSetupLoading(false);
          });
      } else {
        // User doesn't have a Stripe customer yet, create one first
        createStripeCustomerForUser();
      }
    }
  }, [currentUser, loading, userProfile, router]);

  const createStripeCustomerForUser = async () => {
    if (!currentUser?.email) return;

    try {
      const customerResponse = await createOrFindCustomer(currentUser.email);

      // Now create setup intent with the customer
      const { clientSecret } = await createSetupIntent(customerResponse.customer.id);
      setClientSecret(clientSecret);
    } catch (error) {
      console.error('Error ensuring Stripe customer:', error);
      setSetupError('Failed to set up payment system. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading || setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-bakery-primary">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to home
  }

  if (setupError) {
    return (
      <div className="min-h-screen py-20 bg-gradient-to-br from-bakery-cream via-bakery-warm to-bakery-butter">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-bakery">
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Error</h2>
              <p className="text-gray-600 mb-4">{setupError}</p>
              <button
                onClick={() => router.push('/payment-methods')}
                className="bg-bakery-primary text-white px-4 py-2 rounded-md hover:bg-bakery-primary-dark transition-colors"
              >
                Back to Payment Methods
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 bg-gradient-to-br from-bakery-cream via-bakery-warm to-bakery-butter">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-bakery">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bakery font-bold text-bakery-primary">
              Add Payment Method
            </h1>
            <button
              onClick={() => router.push('/payment-methods')}
              className="bg-bakery-primary text-white px-4 py-2 rounded-md hover:bg-bakery-primary-dark transition-colors"
            >
              Back to Payment Methods
            </button>
          </div>

          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#8B4513', // bakery-primary color
                  },
                },
              }}
            >
              <AddPaymentMethodForm />
            </Elements>
          )}
        </div>
      </div>
      
      {/* Test card helper for development */}
      {process.env.NODE_ENV === 'development' && <StripeTestCard />}
    </div>
  );
} 