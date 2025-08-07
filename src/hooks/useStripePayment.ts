import { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { PaymentIntent } from '@stripe/stripe-js';

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

interface UseStripePaymentOptions {
  orderDetails?: OrderDetails;
  returnUrl?: string;
  onSuccess?: (paymentIntent: PaymentIntent) => void;
  onError?: (error: unknown) => void;
}

interface UseStripePaymentReturn {
  isProcessing: boolean;
  message: string;
  handlePayment: () => Promise<void>;
  setMessage: (message: string) => void;
}

export function useStripePayment({
  orderDetails,
  returnUrl = '/',
  onSuccess,
  onError
}: UseStripePaymentOptions = {}): UseStripePaymentReturn {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
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
          return_url: `${window.location.origin}${returnUrl}`,
        },
        redirect: 'if_required',
      });
      console.log('paymentIntent', paymentIntent, error);
      
      if (error) {
        const errorMessage = error.message || 'An error occurred during payment.';
        setMessage(errorMessage);
        setIsProcessing(false);
        onError?.(error);
        return;
      }
      
      if (!paymentIntent) {
        setMessage('No payment intent returned. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      console.log('Payment intent status:', paymentIntent.status);
      
      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
        // Payment successful
        const successMessage = paymentIntent.status === 'requires_capture' 
          ? 'Payment authorized! Your order will be captured when delivered. Redirecting to home page...'
          : 'Payment successful! Redirecting to home page...';
        
        setMessage(successMessage);
        
        // Store success data for the modal on home page
        sessionStorage.setItem('paymentSuccess', JSON.stringify({
          orderDetails: orderDetails,
          paymentIntentId: paymentIntent.id,
          timestamp: new Date().toISOString(),
          status: paymentIntent.status
        }));
        
        // Clear order data from session storage
        sessionStorage.removeItem('orderData');
        sessionStorage.removeItem('paymentIntentClientSecret');
        
        // Call success callback if provided
        onSuccess?.(paymentIntent);
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        console.log('Unexpected payment status:', paymentIntent.status);
        setMessage(`Payment status: ${paymentIntent.status}. Please try again.`);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setMessage(errorMessage);
      setIsProcessing(false);
      onError?.(err);
    }
  };

  return {
    isProcessing,
    message,
    handlePayment,
    setMessage
  };
} 