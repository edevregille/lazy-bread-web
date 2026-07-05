"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { OrderDetails, PaymentFlow } from '@/lib/types';
import { formatDeliveryDate } from '@/config/app-config';

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PaymentPage() {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [intentId, setIntentId] = useState<string>('');
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>('loading');
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

  // Set up guest payment (setup intent)
  useEffect(() => {
    if (!orderDetails) return;

    const createSetupIntent = async () => {
      try {
        const response = await fetch('/api/stripe/setup-intent/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
              fulfillmentType: orderDetails.fulfillmentType,
              pickupLocation: orderDetails.pickupLocation,
            },
            isGuest: true,
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create setup intent');
        }

        const responseData = await response.json();
        setClientSecret(responseData.clientSecret);
        setIntentId(responseData.id);
        setPaymentFlow('guest-setup-intent');
      } catch (error) {
        console.error('Error setting up payment:', error);
        setError('Failed to set up payment. Please try again.');
        setPaymentFlow('error');
      }
    };

    createSetupIntent();
  }, [orderDetails]);

  const handlePaymentSuccess = (setupIntentId: string, status: string) => {
    const pickup = orderDetails?.fulfillmentType === 'pickup';
    const successMessage = pickup
      ? 'Order confirmed! Your payment will be charged when your order is ready for pickup.'
      : 'Order confirmed! Your payment will be charged when delivered.';

    setMessage(successMessage);

    // Store success data
    sessionStorage.setItem('paymentSuccess', JSON.stringify({
      orderDetails: orderDetails,
      setupIntentId: setupIntentId,
      timestamp: new Date().toISOString(),
      status: status,
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
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h1>
          <p className="text-gray-600">Stripe configuration is missing. Please contact support.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (!orderDetails || paymentFlow === 'loading') {
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
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Setup Error</h1>
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

  const isPickup = orderDetails.fulfillmentType === 'pickup';

  return (
    <div className="min-h-screen py-20 bg-warm-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8">
            <h1 className="text-4xl font-semibold text-bakery-primary mb-6">Complete your order</h1>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-bakery-light">
              <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-bakery-primary">Order summary</h2>
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
                </div>
              </div>
            </div>

            {/* Pickup / delivery */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-bakery-light">
            <h2 className="text-2xl font-semibold text-bakery-primary mb-6">
              {isPickup ? 'Pickup information' : 'Delivery information'}
            </h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Name:</strong> {orderDetails.customerName}</p>
                {isPickup ? (
                  <p><strong>Pickup location:</strong> {orderDetails.pickupLocation || orderDetails.address}</p>
                ) : (
                  <>
                    <p><strong>Address:</strong> {orderDetails.address}</p>
                    <p><strong>City:</strong> {orderDetails.city}, {orderDetails.zipCode}</p>
                  </>
                )}
                <p>
                  <strong>{isPickup ? 'Pickup date' : 'Delivery date'}:</strong>{' '}
                  {formatDeliveryDate(orderDetails.deliveryDate)}
                </p>
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
              {paymentFlow === 'guest-setup-intent' && clientSecret && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-2">
                        <p className="text-sm text-blue-800">
                          <strong>Complete your order:</strong>{' '}
                          {isPickup
                            ? 'provide a payment method and we will charge you only when your order is ready for pickup.'
                            : 'provide a payment method and we will charge you only when the order is delivered.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <SetupForm
                      onSuccess={() => handlePaymentSuccess(intentId, 'setup_completed')}
                    />
                  </Elements>
                </div>
              )}

              {!clientSecret && (
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

// Setup Form Component for Setup Intents
function SetupForm({ onSuccess }: { onSuccess: () => void }) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-bakery-primary text-white px-6 py-3 rounded-md hover:bg-bakery-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing Order...' : 'Complete Order'}
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
