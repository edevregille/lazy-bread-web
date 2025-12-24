"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import { OrderDetails, PaymentFlow, PaymentMethod } from '@/lib/types';
import ShowSavedPaymentMethod from '@/components/payment/ShowSavedPaymentMethod';
import { formatDeliveryDate } from '@/config/app-config';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Helper function to format frequency label
const getFrequencyLabel = (frequency?: string): string => {
  switch (frequency) {
    case 'weekly':
      return 'Weekly';
    case 'bi-weekly':
      return 'Bi-weekly';
    case 'every-4-weeks':
      return 'Every 4 weeks';
    default:
      return 'Weekly';
  }
};

export default function PaymentPage() {
  const { currentUser, userProfile, loading } = useAuth();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [intentId, setIntentId] = useState<string>('');
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>('loading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // Load order details from session storage
  useEffect(() => {
    const orderData = sessionStorage.getItem('orderData');
    if (orderData) {
      try {
        const parsedOrder = JSON.parse(orderData);
        
        // Ensure orderItems exists and is properly structured
        if (!parsedOrder.orderItems || !Array.isArray(parsedOrder.orderItems)) {
          if (parsedOrder.items && Array.isArray(parsedOrder.items)) {
            parsedOrder.orderItems = parsedOrder.items;
          } else {
            parsedOrder.orderItems = [];
          }
        }
        
        setOrderDetails(parsedOrder);
      } catch (error) {
        console.error('Error parsing order data:', error);
        setError('Invalid order data. Please try again.');
      }
    } else {
      setError('No order data found. Please start a new order.');
    }
  }, []);

  // Determine payment flow and set up payment
  useEffect(() => {
    if (!orderDetails || loading) return;

    const determinePaymentFlow = async () => {
      try {
        // For signed-in users, check if they have saved payment methods
        let pms: PaymentMethod[] = [];
        if (userProfile?.stripeCustomerId) {
          try {
            const methods = await fetch(`/api/stripe/customers/${userProfile.stripeCustomerId}/payment-methods`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            const data = await methods.json();
            if(data.success) {
              pms = data.paymentMethods;
              setPaymentMethods(data.paymentMethods);
            } else setPaymentMethods([]);
          } catch (error) {
            console.error('Error fetching payment methods:', error);
            setPaymentMethods([]);
          }
        }

        // All scenarios now use setup intent
        const isRecurring = orderDetails.isRecurring || false;
        const isGuest = !currentUser;

        console.log(`Payment Flow: ${isGuest ? 'Guest' : 'Logged-in'} user - ${isRecurring ? 'Recurring' : 'One-time'} order - setup intent`);

        const response = await fetch('/api/stripe/setup-intent/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: isGuest ? null : userProfile?.stripeCustomerId,
            orderDetails: {
              items: orderDetails.orderItems,
              customerInfo: {
                name: orderDetails.customerName,
                email: orderDetails.email,
                address: orderDetails.address,
                city: orderDetails.city,
                zipCode: orderDetails.zipCode,
                phone: orderDetails.phone,
              },
              deliveryDate: orderDetails.deliveryDate,
              comments: orderDetails.comments,
            },
            userId: currentUser?.uid,
            frequency: orderDetails.frequency || 'weekly',
            isRecurring: isRecurring,
            isGuest: isGuest,
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create setup intent');
        }

        const responseData = await response.json();
        setClientSecret(responseData.clientSecret);
        setIntentId(responseData.id);

        // Determine payment flow based on user type, order type, and saved payment methods
        if (isRecurring) {
          if (pms?.length > 0) {
            setPaymentFlow('subscription-setup-intent-saved-method');
          } else {
            setPaymentFlow('subscription-setup-intent');
          }
        } else {
          if (isGuest) {
            setPaymentFlow('guest-setup-intent');
          } else if (pms?.length > 0) {
            setPaymentFlow('one-time-setup-intent-saved-method');
          } else {
            setPaymentFlow('one-time-setup-intent');
          }
        }
        return;
      } catch (error) {
        console.error('Error determining payment flow:', error);
        setError('Failed to set up payment. Please try again.');
        setPaymentFlow('error');
      }
    };

    determinePaymentFlow();
  }, [orderDetails, currentUser, userProfile, loading]);

  const handleConfirmOrder = async () => {
    if (!paymentMethods.length || (!userProfile?.stripeCustomerId && paymentFlow !== 'one-time-setup-intent-saved-method')) return;

    setIsProcessing(true);
    setMessage('');
    let response= null, result = null;

    switch(paymentFlow) {
      // One-time order with saved method
      case 'one-time-setup-intent-saved-method':
      // Subscription order with saved method
      case 'subscription-setup-intent-saved-method':
        response = await fetch(`/api/stripe/setup-intent/${intentId}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethodId: paymentMethods[0].id
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update setup intent');
        }

        result = await fetch(`/api/stripe/setup-intent/${intentId}/confirm`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!result.ok) {
          throw new Error('Failed to confirm setup intent');
        }
        const setupIntent = await result.json();

        if (setupIntent.status === 'succeeded') {
          const isRecurring = paymentFlow === 'subscription-setup-intent-saved-method';
          const successMessage = isRecurring 
            ? 'Subscription confirmed!'
            : 'Order confirmed! Your payment will be charged when delivered.';

          setMessage(successMessage);
        
          // Store success data for the modal on home page
          sessionStorage.setItem('paymentSuccess', JSON.stringify({
            orderDetails: orderDetails,
            setupIntentId: setupIntent.id,
            timestamp: new Date().toISOString(),
            status: 'setup_completed',
            isRecurring: isRecurring
          }));
          
          // Clear order data
          sessionStorage.removeItem('orderData');
          
          // Redirect to home page to show the modal
          router.push('/');
        } else {
          setMessage(`Setup status: ${setupIntent.status}. Please try again.`);
        }
        break;
      default:
        throw new Error('Invalid payment flow');
    }

    setIsProcessing(false);
  };

  const handlePaymentSuccess = (setupIntentId: string, status: string, isRecurring: boolean = false) => {
    const successMessage = isRecurring
      ? 'Subscription confirmed!'
      : 'Order confirmed! Your payment will be charged when delivered.';

    setMessage(successMessage);
    
    // Store success data
    sessionStorage.setItem('paymentSuccess', JSON.stringify({
      orderDetails: orderDetails,
      setupIntentId: setupIntentId,
      timestamp: new Date().toISOString(),
      status: status,
      isRecurring: isRecurring
    }));
    
    // Clear order data
    sessionStorage.removeItem('orderData');
    
    // Redirect to home page to show the modal
    router.push('/');
  };

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

  // Loading state
  if (!orderDetails || loading || paymentFlow === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up payment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || paymentFlow === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Setup Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Failed to set up payment'}</p>
          <button
            onClick={() => router.push('/order')}
            className="w-full btn-primary"
          >
            Back to Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 bg-warm-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8">
            <h2 className="text-4xl font-semibold text-bakery-primary mb-6">
              Complete Your Order
            </h2>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-bakery-light">
              <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-bakery-primary mb-6">Order Summary</h2>
                {orderDetails.isRecurring && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                    🔄 {getFrequencyLabel(orderDetails.frequency)} Delivery
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {orderDetails.orderItems && orderDetails.orderItems.length > 0 ? (
                  orderDetails.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-gray-700">{item.name} × {item.quantity}</span>
                      <span className="font-semibold">${item.total.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">No items in order</div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-indigo-600">${orderDetails.totalAmount.toFixed(2)}</span>
                  </div>
                  {orderDetails.isRecurring && (
                    <div className="mt-2 text-sm text-gray-600">
                      This amount will be charged at delivery time {orderDetails.frequency === 'bi-weekly' ? 'every 2 weeks' : orderDetails.frequency === 'every-4-weeks' ? 'every 4 weeks' : 'every week'}.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-bakery-light">
            <h2 className="text-2xl font-semibold text-bakery-primary mb-6">Delivery Information</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Name:</strong> {orderDetails.customerName}</p>
                <p><strong>Address:</strong> {orderDetails.address}</p>
                <p><strong>City:</strong> {orderDetails.city}, {orderDetails.zipCode}</p>
                {orderDetails.isRecurring && orderDetails.frequency && (
                  <p><strong>Frequency:</strong> {getFrequencyLabel(orderDetails.frequency)}</p>
                )}
                <p><strong>Delivery Date:</strong> {orderDetails.isRecurring ? `Every ${orderDetails.deliveryDate}` : formatDeliveryDate(orderDetails.deliveryDate)}</p>
                <p><strong>Email:</strong> {orderDetails.email}</p>
                <p><strong>Phone:</strong> {orderDetails.phone}</p>
                {orderDetails.comments && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p><strong>Special Instructions:</strong></p>
                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">{orderDetails.comments}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-bakery-light">
            {/* <h2 className="text-2xl font-semibold text-bakery-primary mb-6">Payment Information</h2> */}
              
              {/* Guest user - Setup Intent (one-time) */}
              {paymentFlow === 'guest-setup-intent' && clientSecret && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-2">
                        <p className="text-sm text-blue-800">
                          <strong>Complete your order:</strong> provide a payment method and we will charge you only when the order is delivered.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SetupForm 
                      orderDetails={orderDetails}
                      onSuccess={() => handlePaymentSuccess(intentId, 'setup_completed', false)}
                    />
                  </Elements>
                </div>
              )}

              {/* Signed-in user without saved method - Setup Intent (one-time) */}
              {paymentFlow === 'one-time-setup-intent' && clientSecret && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-2">
                        <p className="text-sm text-blue-800">
                          <strong>Complete your order:</strong> provide a payment method and we will charge you only when the order is delivered.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SetupForm 
                      orderDetails={orderDetails}
                      onSuccess={() => handlePaymentSuccess(intentId, 'setup_completed', false)}
                    />
                  </Elements>
                </div>
              )}

              {/* Signed-in user with saved method - Setup Intent (one-time) */}
              {paymentFlow === 'one-time-setup-intent-saved-method' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-2">
                        <p className="text-sm text-green-800">
                          We will charge your saved payment method only once we have delivered.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Saved Payment Method Display */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <ShowSavedPaymentMethod 
                      paymentMethods={paymentMethods} 
                      onPaymentMethodUpdate={() => {}} 
                    />
                  </div>
                  
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isProcessing}
                    className="w-full btn-primary"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Order'}
                  </button>
                </div>
              )}

              {/* Subscription without saved method - Setup Intent */}
              {paymentFlow === 'subscription-setup-intent' && clientSecret && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-2">
                        <p className="text-sm text-yellow-800">
                          <strong>Set up recurring payment:</strong> Provide a payment method for your weekly subscription: no charge will be made now. <br/> You can pause or cancel your subscription at any time and will be charged only once delivery is made.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SetupForm 
                      orderDetails={orderDetails}
                      onSuccess={() => handlePaymentSuccess(intentId, 'setup_completed', true)}
                    />
                  </Elements>
                </div>
              )}

              {/* Scenario 5: Subscription with saved method - Setup Intent */}
              {paymentFlow === 'subscription-setup-intent-saved-method' && clientSecret && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-2">
                        <p className="text-sm text-green-800">
                          <strong>Set up subscription with saved payment method:</strong> You can pause or cancel your subscription at any time and will be charged only once delivery is made.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Saved Payment Method Display */}
                  <ShowSavedPaymentMethod 
                    paymentMethods={paymentMethods} 
                    onPaymentMethodUpdate={() => {}} 
                  />
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isProcessing}
                    className="w-full btn-primary"
                  >
                    {isProcessing ? 'Processing...' : `Confirm subscription`}
                  </button>
                </div>
              )}

              {/* Loading state for payment form */}
              {!clientSecret && paymentFlow !== 'one-time-setup-intent-saved-method' && paymentFlow !== 'subscription-setup-intent-saved-method' && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Setting up payment form...</p>
                </div>
              )}

              {/* Success/Error Messages */}
              {message && (
                <div className={`mt-6 p-4 rounded-lg ${
                  message.includes('successful') || message.includes('authorized') || message.includes('Redirecting') || message.includes('set up successfully')
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment Form Component removed - all flows now use SetupForm

// Setup Form Component for Setup Intents (used for both one-time and recurring orders)
function SetupForm({ orderDetails, onSuccess }: { orderDetails: OrderDetails; onSuccess: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage('');

    if (!stripe || !elements) {
      setMessage('Stripe is not loaded. Please refresh the page.');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message || 'Setup failed. Please try again.');
        setIsProcessing(false);
      } else if (setupIntent) {
        // Setup successful
        setMessage('Order confirmed! Redirecting...');
        onSuccess();
      }
    } catch (error) {
      console.error('Setup error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const isRecurring = orderDetails.isRecurring || false;
  const buttonText = isRecurring 
    ? (isProcessing ? 'Setting Up Weekly Delivery...' : 'Set Up Weekly Delivery')
    : (isProcessing ? 'Processing Order...' : 'Complete Order');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-bakery-primary text-white px-6 py-3 rounded-md hover:bg-bakery-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText}
      </button>
      
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successful') || message.includes('confirmed') || message.includes('set up')
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
} 