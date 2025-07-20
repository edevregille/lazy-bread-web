"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCustomerPaymentMethods, 
  deletePaymentMethod,
  createSetupIntent,
  ensureStripeCustomer,
  PaymentMethod 
} from '@/lib/stripeService';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import StripeTestCard from './StripeTestCard';

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethodsProps {
  onClose?: () => void;
}

function AddPaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-methods?success=true`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'An error occurred');
      setLoading(false);
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      // Payment method added successfully
      onSuccess();
    } else {
      setError('Payment method setup was not completed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-[750px] mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Add New Payment Method</h3>
          <p className="text-gray-600 text-sm">Enter your payment information below</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <PaymentElement />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 bg-bakery-primary text-white py-3 px-6 rounded-md hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Adding...' : 'Add Payment Method'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PaymentMethods({ onClose }: PaymentMethodsProps) {
  const { userProfile } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
    if (!userProfile?.stripeCustomerId) return;

    try {
      setLoading(true);
      const methods = await getCustomerPaymentMethods(userProfile.stripeCustomerId);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.stripeCustomerId]);

  useEffect(() => {
    if (userProfile?.stripeCustomerId) {
      fetchPaymentMethods();
    } else {
      setLoading(false);
    }
  }, [userProfile?.stripeCustomerId, fetchPaymentMethods]);

  const handleAddPaymentMethod = async () => {
    if (!userProfile?.stripeCustomerId) {
      // Create Stripe customer first
      await createStripeCustomerForUser();
      return;
    }

    // If there's already a payment method, delete it first
    if (paymentMethods.length > 0) {
      try {
        await deletePaymentMethod(paymentMethods[0].id);
      } catch (error) {
        console.error('Error deleting existing payment method:', error);
        // Continue anyway, the new payment method will replace it
      }
    }

    try {
      setAddingPaymentMethod(true);
      setError('');

      const { clientSecret: secret } = await createSetupIntent(userProfile.stripeCustomerId);
      setClientSecret(secret);
    } catch (error: unknown) {
      console.error('Error creating setup intent:', error);
      setError('Failed to initialize payment form');
      setAddingPaymentMethod(false);
    }
  };

  const createStripeCustomerForUser = async () => {
    try {
      setError('');
      
      // Ensure user has a Stripe customer
      const customer = await ensureStripeCustomer(
        userProfile?.email || '',
        userProfile?.displayName || '',
        userProfile?.uid
      );

      // Now create setup intent with the customer
      const { clientSecret: secret } = await createSetupIntent(customer.id);
      setClientSecret(secret);
    } catch (error) {
      console.error('Error ensuring Stripe customer:', error);
      setError('Failed to set up payment system. Please try again.');
      setAddingPaymentMethod(false);
    }
  };

  const handlePaymentMethodAdded = () => {
    setAddingPaymentMethod(false);
    setClientSecret('');
    setShowSuccess(true);
    fetchPaymentMethods();
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  const handleCancelAdd = () => {
    setAddingPaymentMethod(false);
    setClientSecret('');
    setError('');
  };



  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      await deletePaymentMethod(paymentMethodId);
      await fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Failed to delete payment method');
    }
  };

  const formatCardNumber = (last4: string) => `•••• •••• •••• ${last4}`;

  const formatExpiry = (month: number, year: number) => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-bakery-primary">Loading payment methods...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-bakery-primary">Payment Methods</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                {paymentMethods.length > 0 ? 'Payment Method Updated!' : 'Payment Method Added!'}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {paymentMethods.length > 0 
                  ? 'Your payment method has been updated successfully and is now set as your default payment method.'
                  : 'Your payment method has been added successfully and is now set as your default payment method.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {addingPaymentMethod && clientSecret ? (
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
          <AddPaymentMethodForm 
            onSuccess={handlePaymentMethodAdded}
            onCancel={handleCancelAdd}
          />
        </Elements>
      ) : (
        <>
          {!userProfile?.stripeCustomerId ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Set Up Payment System</h3>
                <p className="text-gray-600 mb-4">Your payment system needs to be configured.</p>
                <p className="text-sm text-gray-500 mb-6">This will only take a moment and is required to add payment methods.</p>
                <button
                  onClick={handleAddPaymentMethod}
                  disabled={addingPaymentMethod}
                  className="bg-bakery-primary text-white py-3 px-6 rounded-md hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {addingPaymentMethod ? 'Setting up...' : 'Set Up Payment Methods'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Method</h3>
                    <p className="text-gray-600 mb-4">You haven&apos;t added a payment method yet.</p>
                    <p className="text-sm text-gray-500 mb-6">Add a payment method to make checkout faster and more convenient.</p>
                    <button
                      onClick={handleAddPaymentMethod}
                      disabled={addingPaymentMethod}
                      className="bg-bakery-primary text-white py-3 px-6 rounded-md hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {addingPaymentMethod ? 'Adding...' : 'Add Payment Method'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                {paymentMethods.slice(0, 1).map((method) => (
                  <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-600 font-semibold text-sm">
                            {method.card?.brand?.toUpperCase() || 'CARD'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            {formatCardNumber(method.card?.last4 || '')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {formatExpiry(method.card?.exp_month || 0, method.card?.exp_year || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          Default
                        </span>
                        
                        <button
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="text-center py-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">Want to use a different payment method?</p>
                  <button
                    onClick={handleAddPaymentMethod}
                    disabled={addingPaymentMethod}
                    className="bg-bakery-primary text-white py-3 px-6 rounded-md hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {addingPaymentMethod ? 'Adding...' : 'Update Payment Method'}
                  </button>
                </div>
              </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* Test card helper for development */}
      {process.env.NODE_ENV === 'development' && <StripeTestCard />}
    </div>
  );
} 