"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';

const BREAD_TYPES = [
  { id: 'classic-salt', name: 'Classic Salt', price: 8.99, description: 'Traditional sourdough with sea salt' },
  { id: 'rosemary', name: 'Rosemary', price: 9.99, description: 'Artisan bread with fresh rosemary' },
  { id: 'green-olive', name: 'Green Olive', price: 10.99, description: 'Rustic bread with green olives' },
  { id: 'cheez-it', name: 'Cheez-it', price: 11.99, description: 'Cheesy bread with a crispy crust' },
];

interface OrderForm {
  breadQuantities: Record<string, number>;
  deliveryDate: string;
  address: string;
  city: string;
  zipCode: string;
  customerName: string;
  email: string;
  phone: string;
  comments: string;
}

interface FormErrors {
  breadType?: string;
  quantity?: string;
  deliveryDate?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  comments?: string;
  captcha?: string;
}

export default function OrderPage() {
  // Holiday mode - set to true to disable ordering
  // To enable holiday mode, change this to: const [isHolidayMode, setIsHolidayMode] = useState(true);
  const isHolidayMode = true;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const [orderForm, setOrderForm] = useState<OrderForm>({
    breadQuantities: {
      'classic-salt': 0,
      'rosemary': 0,
      'green-olive': 0,
      'cheez-it': 0,
    },
    deliveryDate: '',
    address: '',
    city: 'Portland',
    zipCode: '',
    customerName: '',
    email: '',
    phone: '',
    comments: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // US Phone number validation
  const validateUSPhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check if it's a valid US phone number (10 or 11 digits)
    if (digitsOnly.length === 10) {
      return true; // 10 digits (area code + number)
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return true; // 11 digits starting with 1 (country code + area code + number)
    }
    
    return false;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length === 10) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
    }
    
    return phone;
  };

  // Helper functions for delivery date validation
  const getAvailableDeliveryDates = (): string[] => {
    const dates: string[] = [];
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    
    // Start from tomorrow
    const currentDate = new Date(pacificTime);
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Add 24 hours to current time for minimum order time
    const minOrderTime = new Date(pacificTime);
    minOrderTime.setHours(minOrderTime.getHours() + 24);
    
    // Generate dates for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      
      // Only include Wednesday (3) and Friday (5)
      if (date.getDay() === 3 || date.getDay() === 5) {
        // Check if this date is at least 24 hours in the future
        if (date > minOrderTime) {
          dates.push(date.toISOString().split('T')[0]);
        }
      }
    }
    
    return dates;
  };

  const formatDeliveryDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Check if at least one bread type has quantity > 0
    const totalQuantity = Object.values(orderForm.breadQuantities).reduce((sum, qty) => sum + qty, 0);
    if (totalQuantity === 0) {
      newErrors.breadType = 'Please select at least one bread type';
    }

    // Validate delivery date
    if (!orderForm.deliveryDate) {
      newErrors.deliveryDate = 'Please select a delivery date';
    } else {
      const availableDates = getAvailableDeliveryDates();
      if (!availableDates.includes(orderForm.deliveryDate)) {
        newErrors.deliveryDate = 'Please select a valid delivery date (Wednesday or Friday, at least 24 hours in advance)';
      }
    }

    // Validate CAPTCHA (only if configured)
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      newErrors.captcha = 'Please complete the CAPTCHA verification';
    }

    if (!orderForm.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // City is always Portland, no validation needed

    if (!orderForm.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else {
      // Validate Multnomah County ZIP codes (Portland area)
      const multnomahZipCodes = [
        '97201', '97202', '97203', '97204', '97205', '97206', '97207', '97208', '97209',
        '97210', '97211', '97212', '97213', '97214', '97215', '97216', '97217', '97218',
        '97219', '97220', '97221', '97222', '97223', '97224', '97225', '97227', '97228',
        '97229', '97230', '97231', '97232', '97233', '97236', '97238', '97239', '97240',
        '97242', '97266', '97267', '97268', '97269', '97280', '97281', '97282', '97283',
        '97286', '97290', '97291', '97292', '97293', '97294', '97296', '97298', '97299'
      ];
      if (!multnomahZipCodes.includes(orderForm.zipCode)) {
        newErrors.zipCode = 'We only deliver to Multnomah County (Portland area)';
      }
    }

    if (!orderForm.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }

    if (!orderForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(orderForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!orderForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateUSPhoneNumber(orderForm.phone)) {
      newErrors.phone = 'Please enter a valid US phone number (e.g., (503) 555-0123 or 503-555-0123)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate total amount and create order items
      const orderItems = BREAD_TYPES
        .filter(bread => orderForm.breadQuantities[bread.id] > 0)
        .map(bread => ({
          id: bread.id,
          name: bread.name,
          price: bread.price,
          quantity: orderForm.breadQuantities[bread.id],
          total: bread.price * orderForm.breadQuantities[bread.id]
        }));

      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // Convert to cents
          captchaToken: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? captchaToken : null,
          orderDetails: {
            items: orderItems,
            totalAmount,
            customerInfo: {
              name: orderForm.customerName,
              email: orderForm.email,
              phone: orderForm.phone,
              address: orderForm.address,
              city: orderForm.city,
              zipCode: orderForm.zipCode,
            },
            deliveryDate: orderForm.deliveryDate,
            comments: orderForm.comments
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      
      // Store order details in session storage for the payment component
      sessionStorage.setItem('orderDetails', JSON.stringify({
        ...orderForm,
        orderItems,
        totalAmount,
        clientSecret
      }));

      // Redirect to payment page
      router.push('/order/payment');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate total amount
  const totalAmount = BREAD_TYPES.reduce((sum, bread) => {
    return sum + (bread.price * orderForm.breadQuantities[bread.id]);
  }, 0);

  // Holiday mode display
  if (isHolidayMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🏖️ We&apos;re on Holiday!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              We&apos;re taking a well-deserved break and will be back soon.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Holiday Schedule</h2>
              <p className="text-yellow-700">
                We&apos;ll resume taking orders in <strong>September, 2025</strong>.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Order Organic Sourdough Focaccia Bread
          </h1>

          {/* Recurring Delivery Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Recurring Deliveries Available
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    For weekly or monthly recurring deliveries, please contact us directly at{' '}
                    <a href="mailto:orders@lazybread.com" className="font-medium underline hover:text-blue-800">
                      orders@lazybread.com
                    </a>
                    {' '}to set up a custom delivery schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bread Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Bread Types and Quantities *
              </label>
              <div className="space-y-4">
                {BREAD_TYPES.map((bread) => (
                  <div
                    key={bread.id}
                    className={`border-2 rounded-lg p-4 transition-colors ${
                      orderForm.breadQuantities[bread.id] > 0
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{bread.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{bread.description}</p>
                      </div>
                      <span className="text-lg font-bold text-indigo-600">
                        ${bread.price}
                      </span>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <div className="flex items-center space-x-4">
                        <button
                          type="button"
                          onClick={() => setOrderForm({
                            ...orderForm,
                            breadQuantities: {
                              ...orderForm.breadQuantities,
                              [bread.id]: Math.max(0, orderForm.breadQuantities[bread.id] - 1)
                            }
                          })}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-indigo-500 text-gray-600"
                        >
                          -
                        </button>
                        <span className="text-lg font-semibold w-12 text-center">
                          {orderForm.breadQuantities[bread.id]}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOrderForm({
                            ...orderForm,
                            breadQuantities: {
                              ...orderForm.breadQuantities,
                              [bread.id]: orderForm.breadQuantities[bread.id] + 1
                            }
                          })}
                          className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-indigo-500 text-gray-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {/* Item Total */}
                    {orderForm.breadQuantities[bread.id] > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {bread.name} × {orderForm.breadQuantities[bread.id]}
                          </span>
                          <span className="font-semibold text-indigo-600">
                            ${(bread.price * orderForm.breadQuantities[bread.id]).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {errors.breadType && (
                <p className="text-red-600 text-sm mt-1">{errors.breadType}</p>
              )}
            </div>

            {/* Delivery Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date *
              </label>
              <select
                value={orderForm.deliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a delivery date</option>
                {getAvailableDeliveryDates().map((date) => (
                  <option key={date} value={date}>
                    {formatDeliveryDate(date)}
                  </option>
                ))}
              </select>
              {errors.deliveryDate && (
                <p className="text-red-600 text-sm mt-1">{errors.deliveryDate}</p>
              )}
              <p className="text-sm text-gray-600 mt-2">
                We deliver on Wednesdays and Fridays only. Orders must be placed at least 24 hours in advance.
              </p>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={orderForm.customerName}
                  onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
                {errors.customerName && (
                  <p className="text-red-600 text-sm mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={orderForm.email}
                  onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="(503) 555-0123"
                />
                {orderForm.phone && (
                  <p className="text-sm text-gray-600 mt-1">
                    Formatted: {formatPhoneNumber(orderForm.phone)}
                  </p>
                )}
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
              <p className="text-sm text-gray-600 mb-4">
                We currently only deliver to Multnomah County (Portland area)
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="123 Main St"
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={orderForm.city}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder="Portland"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      We currently only deliver to Portland
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={orderForm.zipCode}
                      onChange={(e) => setOrderForm({ ...orderForm, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="97201"
                      maxLength={5}
                    />
                    {errors.zipCode && (
                      <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments
              </label>
              <textarea
                value={orderForm.comments}
                onChange={(e) => setOrderForm({ ...orderForm, comments: e.target.value })}
                rows={4}
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Any special requests, delivery instructions, or other details you'd like us to know..."
              />
              <p className="text-sm text-gray-600 mt-1">
                Optional: Let us know about any special requirements or delivery preferences. (Max 255 characters)
              </p>
            </div>

            {/* Order Summary */}
            {totalAmount > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {BREAD_TYPES.map((bread) => {
                    const quantity = orderForm.breadQuantities[bread.id];
                    if (quantity > 0) {
                      return (
                        <div key={bread.id} className="flex justify-between items-center mb-2">
                          <span className="text-gray-700">{bread.name} × {quantity}</span>
                          <span className="font-semibold">${(bread.price * quantity).toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-indigo-600">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CAPTCHA Verification */}
            {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 text-sm">
                  ⚠️ CAPTCHA is not configured. Please set up reCAPTCHA keys in your environment variables.
                </p>
              </div>
            )}
            {errors.captcha && (
              <p className="text-red-600 text-sm text-center">{errors.captcha}</p>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 