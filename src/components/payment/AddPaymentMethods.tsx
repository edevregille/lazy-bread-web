import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddPaymentMethodFormProps {
  onClose?: () => void;
}

function AddPaymentMethodForm({ onClose }: AddPaymentMethodFormProps) {
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
        return_url: `${window.location.origin}/dashboard`,
      },
      redirect: 'if_required'
    });

    if (confirmError) {
      setError(confirmError.message || 'An error occurred');
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose?.();
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Method Saved!</h2>
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
        <PaymentElement />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 bg-bakery-primary text-white py-3 px-4 rounded-md hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save'}
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

interface AddPaymentMethodPageProps {
  onClose?: () => void;
}

export default function AddPaymentMethodPage({ onClose }: AddPaymentMethodPageProps) {
  const { currentUser, loading, userProfile } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const initializeSetup = async () => {
      if (!loading && !currentUser) {
        router.push('/');
        return;
      }

      if (currentUser) {
        if (userProfile?.stripeCustomerId && !clientSecret) {
          // User has a Stripe customer, create setup intent
          try {
            const response = await fetch('/api/stripe/setup-intent/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                customerId: userProfile.stripeCustomerId
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to create setup intent');
            }
            
            const data = await response.json();
            if (data.clientSecret) {
              setClientSecret(data.clientSecret);
            }
            setSetupLoading(false);
          } catch (error) {
            console.error('Error creating setup intent:', error);
            setSetupError('Failed to initialize payment form. Please try again.');
            setSetupLoading(false);
          }
        } else {
          // User doesn't have a Stripe customer
        
        }
      }
    };

    initializeSetup();
  }, [currentUser, loading, userProfile, router]);

 

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
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="card-bakery">
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
              <AddPaymentMethodForm onClose={onClose} />
            </Elements>
          )}
        </div>
      </div>
  );
} 