"use client";

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomerPaymentMethods, PaymentMethod , createOrFindCustomer} from '@/lib/stripeApi';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface OrderDetails {
  breadQuantities: Record<string, number>;
  deliveryDate: string;
  address: string;
  city: string;
  zipCode: string;
  customerName: string;
  email: string;
  phone: string;
  comments: string;
  orderItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  totalAmount: number;
  clientSecret?: string;
  isRecurring?: boolean;
}

interface PaymentFormProps {
  orderDetails: OrderDetails;
  onSavePaymentMethodChange?: (save: boolean) => void;
}

function PaymentForm({ orderDetails }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isReady) {
      setMessage('Payment form is not ready. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message || 'An error occurred during payment.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Payment successful! Redirecting to home page...');
        // Store success data for the modal on home page
        sessionStorage.setItem('paymentSuccess', JSON.stringify({
          orderDetails: orderDetails,
          paymentIntentId: paymentIntent.id,
          timestamp: new Date().toISOString()
        }));
        // Clear order data from session storage
        sessionStorage.removeItem('orderData');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMessage('Payment failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement onReady={() => setIsReady(true)} />
      
      <button
        type="submit"
        disabled={!stripe || !isReady || isProcessing}
        className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!isReady ? 'Loading Payment Form...' : isProcessing ? 'Processing Payment...' : 'Pay Now'}
      </button>
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successful') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}

function PaymentMethodCollectionForm({ orderDetails, setPaymentIntentCreated, paymentIntentCreated }: PaymentFormProps & { setPaymentIntentCreated: (value: boolean) => void; paymentIntentCreated: boolean }) {
  const { currentUser, userProfile } = useAuth();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [localPaymentIntentCreated, setLocalPaymentIntentCreated] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const setupPaymentMethod = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Check if payment intent has already been created (either globally or locally)
        if (paymentIntentCreated || localPaymentIntentCreated) {
          setIsLoading(false);
          return;
        }

        // Only create payment intent if we don't have saved payment methods
        // This component should only be shown when there are no saved payment methods
        const requestBody = {
          amount: orderDetails.totalAmount * 100, // Convert to cents
          orderDetails: {
            items: orderDetails.orderItems,
            customerName: orderDetails.customerName,
            email: orderDetails.email,
            address: orderDetails.address,
            city: orderDetails.city,
            zipCode: orderDetails.zipCode,
            phone: orderDetails.phone,
            deliveryDate: orderDetails.deliveryDate,
            comments: orderDetails.comments,
          },
          userId: currentUser?.uid || undefined
        };
        
        const response = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }

        const responseData = await response.json();
        
        if (!responseData.clientSecret) {
          throw new Error('No client secret returned from payment intent creation');
        }
        
        setClientSecret(responseData.clientSecret);
        setIsLoading(false);
        // Mark that a payment intent has been created (both locally and globally)
        setLocalPaymentIntentCreated(true);
        setPaymentIntentCreated(true);
      } catch (error) {
        console.error('Error setting up payment method collection:', error);
        setError('Failed to set up payment form. Please try again.');
        setIsLoading(false);
      }
    };

    if (currentUser) {
      setupPaymentMethod();
    }
  }, [currentUser, userProfile, orderDetails]); // Removed paymentIntentCreated from dependencies

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up payment form...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Setup Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/order')}
          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
        >
          Back to Order
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-2">
            <p className="text-sm text-blue-800">
              <strong>Complete your order:</strong> Provide a payment method to complete your order.
            </p>
          </div>
        </div>
      </div>

      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <DirectPaymentForm 
            orderDetails={orderDetails} 
          />
        </Elements>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up payment form...</p>
        </div>
      )}
    </div>
  );
}

function DirectPaymentForm({ orderDetails }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage('Payment form is not ready. Please wait a moment and try again.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message || 'An error occurred during payment.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful
        setMessage('Payment successful! Redirecting to home page...');
        // Store success data for the modal on home page
        sessionStorage.setItem('paymentSuccess', JSON.stringify({
          orderDetails: orderDetails,
          paymentIntentId: paymentIntent.id,
          timestamp: new Date().toISOString()
        }));
        // Clear order data from session storage
        sessionStorage.removeItem('orderData');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMessage('Payment failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing Payment...' : 'Complete Order'}
      </button>
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successful') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}

function SavedPaymentMethodForm({ orderDetails, paymentMethod, customerId }: PaymentFormProps & { paymentMethod: PaymentMethod; customerId: string }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage('');

    try {
      // Create payment intent with the saved payment method ID
      const requestBody = {
        amount: orderDetails.totalAmount * 100, // Convert to cents
        paymentMethodId: paymentMethod.id,
        customerId: customerId,
        orderDetails: {
          items: orderDetails.orderItems,
          customerName: orderDetails.customerName,
          email: orderDetails.email,
          address: orderDetails.address,
          city: orderDetails.city,
          zipCode: orderDetails.zipCode,
          phone: orderDetails.phone,
          deliveryDate: orderDetails.deliveryDate,
          comments: orderDetails.comments,
        },
        userId: customerId
      };

      const response = await fetch('/api/stripe/create-payment-intent-with-saved-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }

      const responseData = await response.json();

      if (responseData.status === 'succeeded') {

        setMessage('Payment successful! Redirecting to home page...');
        // Store success data for the modal on home page
        sessionStorage.setItem('paymentSuccess', JSON.stringify({
          orderDetails: orderDetails,
          paymentIntentId: responseData.id,
          timestamp: new Date().toISOString()
        }));
        // Clear order data from session storage
        sessionStorage.removeItem('orderData');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMessage('Payment failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Saved Payment Method Display */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Method</h3>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-600">
              {paymentMethod.card?.brand?.toUpperCase() || 'CARD'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-medium">
              •••• •••• •••• {paymentMethod.card?.last4}
            </p>
            <p className="text-sm text-gray-600">
              Expires {paymentMethod.card?.exp_month}/{paymentMethod.card?.exp_year}
            </p>
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing Payment...' : 'Confirm Payment'}
      </button>
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successful') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}

function RecurringOrderForm({ orderDetails }: PaymentFormProps) {
  const { currentUser, userProfile, loading } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    id: string;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
    billing_details: {
      name?: string;
    };
  }>>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setIsLoading(true);
        // setError('');

        if (!currentUser) {
          // setError('Please log in to use saved payment methods.');
          setIsLoading(false);
          return;
        }

        if (!userProfile?.stripeCustomerId) {
          // Ensure customer exists in Stripe
          const customer = await createOrFindCustomer(currentUser.email || '');
          if (customer.success && customer.customer.id) {
            // Reload user profile to get the new Stripe customer ID
            window.location.reload();
            return;
          }
        }

        if (userProfile?.stripeCustomerId) {
          const methods = await getCustomerPaymentMethods(userProfile.stripeCustomerId);
          setPaymentMethods(methods);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading payment methods:', error);
        // setError('Failed to load payment methods. Please try again.');
        setIsLoading(false);
      }
    };

    if (!loading && currentUser) {
      loadPaymentMethods();
    }
  }, [currentUser, userProfile, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPaymentMethod || !userProfile?.stripeCustomerId) {
      setMessage('Please select a payment method.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      // Create recurring payment intent
      const response = await fetch('/api/stripe/create-recurring-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: orderDetails.totalAmount,
          customerId: userProfile.stripeCustomerId,
          paymentMethodId: selectedPaymentMethod,
          orderDetails: {
            items: orderDetails.orderItems,
            deliveryDate: orderDetails.deliveryDate,
            address: orderDetails.address,
            city: orderDetails.city,
            zipCode: orderDetails.zipCode,
            customerName: orderDetails.customerName,
            email: orderDetails.email,
            phone: orderDetails.phone,
            comments: orderDetails.comments,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create recurring payment');
      }

      const { paymentIntentId, status } = await response.json();

      if (status === 'succeeded') {

        setMessage('Recurring order created successfully! Redirecting to home page...');
        // Store success data for the modal on home page
        sessionStorage.setItem('paymentSuccess', JSON.stringify({
          orderDetails: orderDetails,
          paymentIntentId: paymentIntentId,
          isRecurring: true,
          timestamp: new Date().toISOString()
        }));
        // Clear order data from session storage
        sessionStorage.removeItem('orderData');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMessage('Payment failed. Please try again.');
        setIsProcessing(false);
      }
    } catch (error: unknown) {
      console.error('Recurring order error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setMessage(errorMessage);
      setIsProcessing(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payment methods...</p>
      </div>
    );
  }

  if (!isLoading && paymentMethods.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 text-xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods Found</h3>
        <p className="text-gray-600 mb-4">You need to add a payment method to create a recurring order.</p>
        <button
          onClick={() => router.push('/payment-methods')}
          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
        >
          Add Payment Method
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-4">
          Select Payment Method for Recurring Charges
        </label>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <label key={method.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedPaymentMethod === method.id}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {method.card?.brand?.toUpperCase()} •••• {method.card?.last4}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    Expires {method.card?.exp_month}/{method.card?.exp_year}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {method.billing_details.name}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-2">
            <p className="text-sm text-yellow-800">
              <strong>Recurring Order:</strong> This payment method will be charged automatically every week for your recurring order.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!selectedPaymentMethod || isProcessing}
        className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Creating Recurring Order...' : 'Create Recurring Order'}
      </button>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successful') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}
    </form>
  );
}

export default function PaymentPage() {
  const { currentUser, userProfile, loading } = useAuth();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodsLoaded, setPaymentMethodsLoaded] = useState(false);
  // const [error, setError] = useState('');
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);

    useEffect(() => {
    const orderData = sessionStorage.getItem('orderData');
    if (orderData) {
      try {
        const parsedOrder = JSON.parse(orderData);
        
        // Ensure orderItems exists and is properly structured
        if (!parsedOrder.orderItems || !Array.isArray(parsedOrder.orderItems)) {
          // If orderItems doesn't exist, try to create it from items
          if (parsedOrder.items && Array.isArray(parsedOrder.items)) {
            parsedOrder.orderItems = parsedOrder.items;
          } else {
            // Fallback: create empty orderItems array
            parsedOrder.orderItems = [];
          }
        }
        
        setOrderDetails(parsedOrder);
      } catch (error) {
        console.error('Error parsing order data:', error);
        // setError('Invalid order data. Please try again.');
      }
    } else {
      // setError('No order data found. Please start a new order.');
    }
   
  }, []);

  useEffect(() => {
    const paymentFlow = async () => {
      if (!orderDetails || !currentUser) return;

      try {
        if (userProfile?.stripeCustomerId) {
          const methods = await getCustomerPaymentMethods(userProfile.stripeCustomerId);
          setPaymentMethods(methods);
          setPaymentMethodsLoaded(true);
          // Don't create payment intent here - let the individual forms handle it
        } else {
          // User logged in but no Stripe customer ID, let PaymentMethodCollectionForm handle it
          // This will be handled by the PaymentMethodCollectionForm component
          setPaymentMethodsLoaded(true);
        }
      } catch (error) {
        console.error('Error in payment flow:', error);
        setPaymentMethodsLoaded(true);
        // Never create payment intent for logged-in users - let forms handle it
      }
    };

    if (orderDetails && currentUser && !loading) {
      paymentFlow();
    } else if (orderDetails && !currentUser) {
      // User not logged in, create payment intent directly
      createPaymentIntent(orderDetails);
    }
  }, [orderDetails, currentUser, userProfile, loading]);

  const createPaymentIntent = async (orderDetails: OrderDetails) => {
    if (paymentIntentCreated) {
      return;
    }

    setPaymentIntentCreated(true);

    try {
      const requestBody = {
        amount: orderDetails.totalAmount * 100,
        orderDetails: {
          items: orderDetails.orderItems,
          customerName: orderDetails.customerName,
          email: orderDetails.email,
          address: orderDetails.address,
          city: orderDetails.city,
          zipCode: orderDetails.zipCode,
          phone: orderDetails.phone,
          deliveryDate: orderDetails.deliveryDate,
          comments: orderDetails.comments,
        },
        userId: currentUser?.uid || undefined
      };

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }

      const responseData = await response.json();
      setOrderDetails(prev => prev ? { ...prev, clientSecret: responseData.clientSecret } : null);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      // setError('Failed to set up payment. Please try again.');
    }
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

  if (!orderDetails || loading || (currentUser && !paymentMethodsLoaded)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!orderDetails ? 'Loading payment form...' : 'Checking payment methods...'}
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-bakery-cream via-bakery-warm to-bakery-butter py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Complete Your Order
          </h1>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              {orderDetails.isRecurring && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                  🔄 Recurring Order
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
                    This amount will be charged weekly
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Name:</strong> {orderDetails.customerName}</p>
              <p><strong>Address:</strong> {orderDetails.address}</p>
              <p><strong>City:</strong> {orderDetails.city}, {orderDetails.zipCode}</p>
              <p><strong>Delivery Date:</strong> {new Date(orderDetails.deliveryDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
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
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
            {orderDetails.isRecurring ? (
              <RecurringOrderForm orderDetails={orderDetails} />
            ) : paymentMethods.length > 0 && userProfile?.stripeCustomerId ? (
              // User has saved payment methods - show saved payment method form
              <SavedPaymentMethodForm 
                orderDetails={orderDetails}
                paymentMethod={paymentMethods[0]}
                customerId={userProfile.stripeCustomerId}
              />
            ) : orderDetails.clientSecret ? (
              // User has a client secret - show payment form
              <Elements stripe={stripePromise} options={{ clientSecret: orderDetails.clientSecret }}>
                <PaymentForm 
                  orderDetails={orderDetails}
                />
              </Elements>
            ) : currentUser && paymentMethodsLoaded && paymentMethods.length === 0 ? (
              // User is logged in but no saved methods - show payment method collection
              <PaymentMethodCollectionForm 
                orderDetails={orderDetails}
                setPaymentIntentCreated={setPaymentIntentCreated}
                paymentIntentCreated={paymentIntentCreated}
              />
            ) : currentUser && !paymentMethodsLoaded ? (
              // User is logged in but payment methods are still loading
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payment methods...</p>
              </div>
            ) : (
              // User not logged in - show loading while creating payment intent
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Setting up payment form...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 