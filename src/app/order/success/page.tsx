"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDeliveryDate } from '@/config/app-config';

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
}

export default function SuccessPage() {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const storedOrderData = sessionStorage.getItem('orderData');
    if (!storedOrderData) {
      router.push('/order');
      return;
    }

    try {
      const details = JSON.parse(storedOrderData);
      setOrderDetails(details);
      // Clear the order data from session storage
      sessionStorage.removeItem('orderData');
      
      // Auto-redirect to home after 10 seconds with countdown
      const redirectTimer = setTimeout(() => {
        router.push('/');
      }, 10000);
      
      // Countdown timer
      const countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearTimeout(redirectTimer);
        clearInterval(countdownTimer);
      };
    } catch (error) {
      console.error('Error parsing order details:', error);
      router.push('/order');
    }
  }, [router]);

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your order.
          </p>
          
          {/* Auto-redirect notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              You&apos;ll be automatically redirected to the home page in{' '}
              <span className="font-bold">{countdown}</span> seconds, or you can click the buttons below.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
            <div className="space-y-3">
              {orderDetails?.orderItems?.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-700">{item.name} × {item.quantity}</span>
                  <span className="font-semibold">${item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total Paid</span>
                  <span className="text-xl font-bold text-green-600">${orderDetails.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Name:</strong> {orderDetails.customerName}</p>
              <p><strong>Address:</strong> {orderDetails.address}</p>
              <p><strong>City:</strong> {orderDetails.city}, {orderDetails.zipCode}</p>
              <p><strong>Delivery Date:</strong> {formatDeliveryDate(orderDetails.deliveryDate)}</p>
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

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Next?</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  1
                </div>
                <p className="text-gray-700">We&apos;ll send you a confirmation email with your order details.</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                  2
                </div>
                <p className="text-gray-700">We will deliver your order at the address you provided and the day you selected.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              🏠 Back to Home
            </Link>
            <Link
              href="/order"
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              🛒 Place Another Order
            </Link>
          </div>
          
          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need help? Contact us at{' '}
              <a href="mailto:support@lazybread.com" className="text-indigo-600 hover:text-indigo-800 font-medium">
                support@lazybread.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 