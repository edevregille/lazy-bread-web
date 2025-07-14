"use client";

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';

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
  clientSecret: string;
}

function PaymentForm() {
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
          return_url: `${window.location.origin}/order/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message || 'An error occurred during payment.');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage('Payment successful! Redirecting...');
        setTimeout(() => {
          router.push('/order/success');
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

export default function PaymentPage() {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const storedOrderDetails = sessionStorage.getItem('orderDetails');
    if (!storedOrderDetails) {
      router.push('/order');
      return;
    }

    try {
      const details = JSON.parse(storedOrderDetails);
      setOrderDetails(details);
      setClientSecret(details.clientSecret);
    } catch (error) {
      console.error('Error parsing order details:', error);
      router.push('/order');
    }
  }, [router]);

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

  if (!orderDetails || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Complete Your Order
          </h1>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              {orderDetails.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-700">{item.name} × {item.quantity}</span>
                  <span className="font-semibold">${item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-indigo-600">${orderDetails.totalAmount.toFixed(2)}</span>
                </div>
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
            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payment form...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 