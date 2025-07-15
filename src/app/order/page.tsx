"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  BREAD_TYPES,
  BUSINESS_SETTINGS,
  VALIDATION_RULES,
  DELIVERY_ZONES,
  PAGE_CONTENT,
  ERROR_MESSAGES,
  getAvailableDeliveryDates,
  validateUSPhoneNumber,
  formatPhoneNumber,
  formatDeliveryDate
} from '@/config/app-config';

interface OrderForm {
  breadQuantities: { [key: string]: number };
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
  deliveryDate?: string;
  address?: string;
  zipCode?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  captcha?: string;
}

export default function OrderPage() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const [orderForm, setOrderForm] = useState<OrderForm>({
    breadQuantities: Object.fromEntries(BREAD_TYPES.map(bread => [bread.id, 0])),
    deliveryDate: '',
    address: '',
    city: DELIVERY_ZONES.cityName,
    zipCode: '',
    customerName: '',
    email: '',
    phone: '',
    comments: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Calculate total bread quantity
  const totalBreadQuantity = Object.values(orderForm.breadQuantities).reduce((sum, qty) => sum + qty, 0);
  const maxBreads = BUSINESS_SETTINGS.maxOrderQuantity;
  const canAddMore = totalBreadQuantity < maxBreads;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate bread selection
    const totalQuantity = Object.values(orderForm.breadQuantities).reduce((sum, qty) => sum + qty, 0);
    if (totalQuantity === 0) {
      newErrors.breadType = ERROR_MESSAGES.breadTypeRequired;
    } else if (totalQuantity > 10) {
      newErrors.breadType = 'Maximum limit of 10 breads exceeded.';
    }

    // Validate delivery date
    if (!orderForm.deliveryDate) {
      newErrors.deliveryDate = ERROR_MESSAGES.deliveryDateRequired;
    } else {
      const availableDates = getAvailableDeliveryDates();
      if (!availableDates.includes(orderForm.deliveryDate)) {
        newErrors.deliveryDate = ERROR_MESSAGES.deliveryDateInvalid;
      }
    }

    // Validate CAPTCHA (only if configured)
    if (VALIDATION_RULES.requireCaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      newErrors.captcha = ERROR_MESSAGES.captchaRequired;
    }

    if (!orderForm.address.trim()) {
      newErrors.address = ERROR_MESSAGES.addressRequired;
    }

    // City is always Portland, no validation needed

    if (!orderForm.zipCode.trim()) {
      newErrors.zipCode = ERROR_MESSAGES.zipCodeRequired;
    } else {
      if (!DELIVERY_ZONES.allowedZipCodes.includes(orderForm.zipCode)) {
        newErrors.zipCode = ERROR_MESSAGES.zipCodeInvalid;
      }
    }

    if (!orderForm.customerName.trim()) {
      newErrors.customerName = ERROR_MESSAGES.nameRequired;
    }

    if (!orderForm.email.trim()) {
      newErrors.email = ERROR_MESSAGES.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(orderForm.email)) {
      newErrors.email = ERROR_MESSAGES.emailInvalid;
    }

    if (!orderForm.phone.trim()) {
      newErrors.phone = ERROR_MESSAGES.phoneRequired;
    } else if (VALIDATION_RULES.requirePhoneValidation && !validateUSPhoneNumber(orderForm.phone)) {
      newErrors.phone = ERROR_MESSAGES.phoneInvalid;
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
      // Calculate total amount
      const totalAmount = BREAD_TYPES.reduce((total, bread) => {
        return total + (bread.price * orderForm.breadQuantities[bread.id]);
      }, 0);

      // Prepare order items
      const orderItems = BREAD_TYPES
        .filter(bread => orderForm.breadQuantities[bread.id] > 0)
        .map(bread => ({
          id: bread.id,
          name: bread.name,
          price: bread.price,
          quantity: orderForm.breadQuantities[bread.id],
          total: bread.price * orderForm.breadQuantities[bread.id]
        }));

      // Create payment intent
      const response = await fetch('/api/stripe/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // Convert to cents
          captchaToken: VALIDATION_RULES.requireCaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? captchaToken : null,
          orderDetails: {
            items: orderItems,
            deliveryDate: orderForm.deliveryDate,
            address: orderForm.address,
            city: orderForm.city,
            zipCode: orderForm.zipCode,
            customerName: orderForm.customerName,
            email: orderForm.email,
            phone: orderForm.phone,
            comments: orderForm.comments,
            totalAmount: totalAmount
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
      console.error('Order submission failed:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate total amount
  const totalAmount = BREAD_TYPES.reduce((total, bread) => {
    return total + (bread.price * orderForm.breadQuantities[bread.id]);
  }, 0);

  // Holiday mode banner
  const holidayBanner = BUSINESS_SETTINGS.isHolidayMode ? (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            {BUSINESS_SETTINGS.holidayMessage}
          </h3>
                      <p className="text-sm text-yellow-700 mt-1">
              We&apos;ll resume taking orders in <strong>{BUSINESS_SETTINGS.returnDate}</strong>.
            </p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-warm-cream py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-bakery">
          <h1 className="text-5xl font-bakery font-bold text-bakery-primary mb-8 text-center">
            {PAGE_CONTENT.orderPageTitle}
          </h1>

          {holidayBanner}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Bread Selection */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-lg font-medium text-black font-body">
                  Select Bread Types and Quantities *
                </label>
              </div>
              
              {totalBreadQuantity >= maxBreads && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-base text-red-700 font-body">
                    ⚠️ Maximum limit of {maxBreads} breads reached. You cannot add more breads to your order.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {BREAD_TYPES.map((bread) => (
                  <div
                    key={bread.id}
                    className={`border-2 rounded-lg p-4 transition-colors ${
                      orderForm.breadQuantities[bread.id] > 0
                        ? 'border-bakery-primary bg-warm-cream shadow-bakery'
                        : 'border-bakery-light'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-black font-body">{bread.name}</h3>
                        <p className="text-base text-black opacity-80 mt-1 font-accent">{bread.description}</p>
                      </div>
                      <span className="text-lg font-bold text-bakery-primary">
                        ${bread.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <span className="text-base text-black font-body">Quantity:</span>
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
                          className="w-8 h-8 rounded-full border-2 border-bakery-light flex items-center justify-center hover:border-bakery-primary text-earth-brown hover:text-bakery-primary transition-colors duration-300"
                        >
                          -
                        </button>
                        <span className="text-xl font-semibold w-12 text-center text-black">
                          {orderForm.breadQuantities[bread.id]}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (canAddMore) {
                              setOrderForm({
                                ...orderForm,
                                breadQuantities: {
                                  ...orderForm.breadQuantities,
                                  [bread.id]: orderForm.breadQuantities[bread.id] + 1
                                }
                              });
                            }
                          }}
                          disabled={!canAddMore}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                            canAddMore 
                              ? 'border-bakery-light hover:border-bakery-primary text-earth-brown hover:text-bakery-primary' 
                              : 'border-gray-300 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    {orderForm.breadQuantities[bread.id] > 0 && (
                      <div className="mt-3 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base text-black font-body">
                            {bread.name} × {orderForm.breadQuantities[bread.id]}
                          </span>
                          <span className="font-semibold text-bakery-primary">
                            ${(bread.price * orderForm.breadQuantities[bread.id]).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {errors.breadType && (
                <p className="text-red-600 text-base mt-1">{errors.breadType}</p>
              )}
            </div>

            {/* Delivery Date Selection */}
            <div>
              <h3 className="text-xl font-semibold text-black mb-4 font-body">Delivery Date</h3>
              <select
                value={orderForm.deliveryDate}
                onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
                className="w-full px-4 py-3 border border-bakery-light rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-bakery-primary font-body text-base"
              >
                <option value="">Select a delivery date</option>
                {getAvailableDeliveryDates().map((date) => (
                  <option key={date} value={date}>
                    {formatDeliveryDate(date)}
                  </option>
                ))}
              </select>
              {errors.deliveryDate && (
                <p className="text-red-600 text-base mt-1">{errors.deliveryDate}</p>
              )}
              <p className="text-base text-black mt-2 font-body">
                {PAGE_CONTENT.deliveryInstructions}
              </p>
            </div>

            {/* Delivery Address */}
            <div>
              <h3 className="text-xl font-semibold text-black mb-4 font-body">Delivery Address</h3>
              
              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-base font-medium text-black mb-2 font-body">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                    className="w-full px-4 py-3 border border-bakery-light rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-bakery-primary font-body text-base"
                    placeholder="John Doe"
                  />
                  {errors.customerName && (
                    <p className="text-red-600 text-base mt-1">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-black mb-2 font-body">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={orderForm.email}
                    onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-bakery-light rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-bakery-primary font-body text-base"
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-base mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-black mb-2 font-body">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-bakery-light rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-bakery-primary font-body text-base"
                    placeholder="(503) 555-0123"
                  />
                  {orderForm.phone && (
                    <p className="text-base text-black mt-1 font-accent">
                      Formatted: {formatPhoneNumber(orderForm.phone)}
                    </p>
                  )}
                  {errors.phone && (
                    <p className="text-red-600 text-base mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                    <label className="block text-base font-medium text-black mb-2 font-body">
                      Street Address *
                    </label>
                  <input
                    type="text"
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                    className="w-full px-4 py-3 border border-bakery-light rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-bakery-primary font-body text-base"
                    placeholder="123 Main St"
                  />
                  {errors.address && (
                    <p className="text-red-600 text-base mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                      <label className="block text-base font-medium text-black mb-2 font-body">
                        City *
                      </label>
                    <input
                      type="text"
                      value={orderForm.city}
                      readOnly
                      className="w-full px-4 py-3 border border-bakery-light rounded-md bg-warm-cream text-earth-brown cursor-not-allowed font-body text-base"
                      placeholder={DELIVERY_ZONES.cityName}
                    />
                                          <p className="text-base text-black mt-1 font-body">
                        We currently only deliver to {DELIVERY_ZONES.cityName}
                      </p>
                  </div>

                                      <div>
                      <label className="block text-base font-medium text-black mb-2 font-body">
                        ZIP Code *
                      </label>
                    <input
                      type="text"
                      value={orderForm.zipCode}
                      onChange={(e) => setOrderForm({ ...orderForm, zipCode: e.target.value })}
                      className="w-full px-4 py-3 border border-bakery-light rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-bakery-primary font-body text-base"
                      placeholder="97201"
                      maxLength={5}
                    />
                    {errors.zipCode && (
                      <p className="text-red-600 text-base mt-1">{errors.zipCode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <label className="block text-base font-medium text-black mb-2 font-body">
                Additional Comments
              </label>
              <textarea
                value={orderForm.comments}
                onChange={(e) => setOrderForm({ ...orderForm, comments: e.target.value })}
                rows={4}
                maxLength={VALIDATION_RULES.maxCommentLength}
                className="w-full px-4 py-3 border border-bakery-light rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-bakery-primary resize-none font-body text-base"
                placeholder={PAGE_CONTENT.commentsPlaceholder}
              />
              <p className="text-base text-black mt-1 font-body">
                {PAGE_CONTENT.commentsHelper}
              </p>
            </div>

            {/* Order Summary */}
            {totalAmount > 0 && (
              <div className="pt-6">
                <h3 className="text-xl font-semibold text-black mb-4 font-body">Order Summary</h3>
                <div className="bg-warm-cream rounded-lg p-4 shadow-bakery">
                  {BREAD_TYPES.map((bread) => {
                    const quantity = orderForm.breadQuantities[bread.id];
                    if (quantity > 0) {
                      return (
                        <div key={bread.id} className="flex justify-between items-center mb-2">
                          <span className="text-black font-body text-base">{bread.name} × {quantity}</span>
                          <span className="font-semibold text-bakery-primary text-base">${(bread.price * quantity).toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                  <div className="pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-black font-body text-xl">Total</span>
                      <span className="text-xl font-bold text-bakery-primary text-2xl">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CAPTCHA Verification */}
            {VALIDATION_RULES.requireCaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={setCaptchaToken}
                />
              </div>
            ) : VALIDATION_RULES.requireCaptcha ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 text-sm">
                  {ERROR_MESSAGES.captchaNotConfigured}
                </p>
              </div>
            ) : null}
            {errors.captcha && (
              <p className="text-red-600 text-sm text-center">{errors.captcha}</p>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isProcessing || BUSINESS_SETTINGS.isHolidayMode}
                className="btn-bakery-primary w-full md:w-auto px-8 py-3 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-body text-lg"
              >
                {isProcessing ? 'Processing...' : BUSINESS_SETTINGS.isHolidayMode ? 'Orders Temporarily Disabled' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 