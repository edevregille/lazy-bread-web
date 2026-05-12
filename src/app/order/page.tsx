"use client";

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  BREAD_TYPES,
  getAvailableDeliveryDates,
  formatDeliveryDate,
  DELIVERY_ZONES,
  BUSINESS_SETTINGS,
  PICKUP_ADDRESS_DISPLAY,
  PICKUP_ADDRESS_LINE,
  PICKUP_ADDRESS_CITY,
  PICKUP_ADDRESS_ZIP,
  type BreadType,
} from '@/config/app-config';
import { isSubscriptionEnabled } from '@/config/feature-flags';
import type { FulfillmentType } from '@/lib/types';
import { useConfig } from '@/contexts/ConfigContext';
import { updateUserProfile } from '@/lib/firebaseService';
import AuthModal from '@/components/auth/AuthModal';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

function breadImageSrc(bread: BreadType) {
  const name = bread.image_name?.trim();
  return `/breads/${name || 'default.jpg'}`;
}

export default function OrderPage() {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const { config: runtimeConfig } = useConfig();
  const router = useRouter();
  
  // Use runtime config if available, otherwise fall back to imported values
  const BUSINESS_SETTINGS_RUNTIME = runtimeConfig?.BUSINESS_SETTINGS || BUSINESS_SETTINGS;
  const BREAD_TYPES_RUNTIME = runtimeConfig?.BREAD_TYPES || BREAD_TYPES;
  const DELIVERY_ZONES_RUNTIME = runtimeConfig?.DELIVERY_ZONES || DELIVERY_ZONES;
  
  const [breadQuantities, setBreadQuantities] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Portland'); // Default to Portland
  const [zipCode, setZipCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comments, setComments] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'bi-weekly' | 'every-4-weeks'>('weekly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot-password'>('signup');
  const [showSaveAddressPrompt, setShowSaveAddressPrompt] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery');

  /** When true, skip profile-based prefill so a restored checkout draft is not overwritten. */
  const suppressProfilePrefillRef = useRef(false);

  const ORDER_DATA_STORAGE_KEY = 'orderData';

  // Restore form from sessionStorage when returning from payment (browser back or /order revisit)
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem(ORDER_DATA_STORAGE_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as Record<string, unknown>;
      const items = d.items;
      if (!Array.isArray(items)) return;

      const quantities: Record<string, number> = {};
      for (const row of items) {
        if (
          row &&
          typeof row === 'object' &&
          'name' in row &&
          'quantity' in row &&
          typeof (row as { name: unknown }).name === 'string' &&
          typeof (row as { quantity: unknown }).quantity === 'number'
        ) {
          const { name, quantity } = row as { name: string; quantity: number };
          quantities[name] = quantity;
        }
      }
      setBreadQuantities(quantities);

      if (typeof d.deliveryDate === 'string') setDeliveryDate(d.deliveryDate);
      if (typeof d.address === 'string') setAddress(d.address);
      if (typeof d.city === 'string') setCity(d.city);
      if (typeof d.zipCode === 'string') setZipCode(d.zipCode);
      if (typeof d.customerName === 'string') setCustomerName(d.customerName);
      if (typeof d.email === 'string') setEmail(d.email);
      if (typeof d.phone === 'string') setPhone(d.phone);
      if (typeof d.comments === 'string') setComments(d.comments);
      if (isSubscriptionEnabled && typeof d.isRecurring === 'boolean') {
        setIsRecurring(d.isRecurring);
      }
      if (
        d.frequency === 'weekly' ||
        d.frequency === 'bi-weekly' ||
        d.frequency === 'every-4-weeks'
      ) {
        setFrequency(d.frequency);
      }
      if (d.fulfillmentType === 'pickup' || d.fulfillmentType === 'delivery') {
        setFulfillmentType(d.fulfillmentType);
      }

      suppressProfilePrefillRef.current = true;
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    if (!isSubscriptionEnabled) {
      setIsRecurring(false);
    }
  }, []);

  const recurringActive = isSubscriptionEnabled && isRecurring;

  useEffect(() => {
    if (recurringActive) {
      setFulfillmentType('delivery');
    }
  }, [recurringActive]);

  // Phone number formatter function
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const trimmed = phoneNumber.slice(0, 10);
    
    // Format as xxx-xxx-xxxx
    if (trimmed.length >= 6) {
      return `${trimmed.slice(0, 3)}-${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
    } else if (trimmed.length >= 3) {
      return `${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
    } else {
      return trimmed;
    }
  };

  // Handle phone number change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Pre-fill form with user profile data if available (skip when restoring a payment draft)
  useEffect(() => {
    if (suppressProfilePrefillRef.current) {
      return;
    }
    if (userProfile) {
      if (fulfillmentType === 'delivery') {
        setAddress(userProfile.deliveryAddress || '');
        setCity('Portland');
        setZipCode(userProfile.deliveryZipCode || '');
      }
      setCustomerName(userProfile.displayName || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
    } else if (currentUser) {
      setCustomerName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }
  }, [userProfile, currentUser, fulfillmentType]);

  // Reset loading state on component unmount or route change
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  // Show save address prompt when user fills in address fields (delivery only)
  useEffect(() => {
    if (
      fulfillmentType !== 'delivery' ||
      !currentUser ||
      !userProfile ||
      !address.trim() ||
      !zipCode.trim() ||
      showSaveAddressPrompt
    ) {
      return;
    }
    const currentAddress = userProfile.deliveryAddress || '';
    const currentZipCode = userProfile.deliveryZipCode || '';
    if (address.trim() !== currentAddress || zipCode.trim() !== currentZipCode) {
      setShowSaveAddressPrompt(true);
      setAddressSaved(false);
    }
  }, [address, zipCode, currentUser, userProfile, showSaveAddressPrompt, fulfillmentType]);

  const availableDates = getAvailableDeliveryDates();

  // Check if we're in holiday mode
  const isHolidayMode = BUSINESS_SETTINGS_RUNTIME.isHolidayMode;

  // Validate zip code is in Multnomah County
  const validateZipCode = (zip: string): boolean => {
    return DELIVERY_ZONES_RUNTIME.allowedZipCodes.includes(zip.trim());
  };

  const updateQuantity = (breadType: string, quantity: number) => {
    setBreadQuantities(prev => {
      const currentTotal = Object.values(prev).reduce((sum, qty) => sum + qty, 0);
      const currentBreadQty = prev[breadType] || 0;
      const newBreadQty = Math.max(0, quantity);
      
      // Calculate what the new total would be
      const newTotal = currentTotal - currentBreadQty + newBreadQty;
      const maxQuantity = BUSINESS_SETTINGS_RUNTIME.maxOrderQuantity;
      
      // If adding would exceed the max, cap it at the max
      if (newTotal > maxQuantity && quantity > currentBreadQty) {
        const allowedIncrease = maxQuantity - (currentTotal - currentBreadQty);
        const cappedQty = currentBreadQty + Math.max(0, allowedIncrease);
        
        // Show error message
        setFieldErrors(prevErrors => ({
          ...prevErrors,
          maxQuantity: `Maximum order quantity is ${maxQuantity} breads. You can add ${Math.max(0, allowedIncrease)} more.`
        }));
        
        return {
          ...prev,
          [breadType]: cappedQty
        };
      }
      
      // Clear max quantity error if we're within limits
      if (newTotal <= maxQuantity && fieldErrors.maxQuantity) {
        setFieldErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.maxQuantity;
          return newErrors;
        });
      }
      
      const updated = {
        ...prev,
        [breadType]: newBreadQty
      };
      
      // Clear bread items error if user selects any bread
      const hasBread = Object.values(updated).some(qty => qty > 0);
      if (fieldErrors.breadItems && hasBread) {
        setFieldErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.breadItems;
          return newErrors;
        });
      }
      
      return updated;
    });
  };

  const handleRecurringToggle = (checked: boolean) => {
    if (checked && !currentUser) {
      // User wants recurring order but is not signed in
      // Don't check the box, just show sign-in modal
      setAuthModalMode('signup');
      setShowAuthModal(true);
      return;
    }
    // Allow checking/unchecking the box if user is signed in
    setIsRecurring(checked);
  };

  const handleAuthSuccess = async () => {
    await refreshUserProfile();
    setShowAuthModal(false);
    if (isSubscriptionEnabled) {
      setIsRecurring(true);
    }
  };

  const calculateTotal = () => {
    return Object.entries(breadQuantities).reduce((total, [breadType, quantity]) => {
      const bread = BREAD_TYPES_RUNTIME.find(b => b.name === breadType && b.availableForOrders);
      return total + (bread ? bread.price * quantity : 0);
    }, 0);
  };

  const getOrderItems = (): OrderItem[] => {
    return Object.entries(breadQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([breadType, quantity]) => {
        const bread = BREAD_TYPES_RUNTIME.find(b => b.name === breadType && b.availableForOrders);
        return {
          id: breadType,
          name: breadType,
          price: bread ? bread.price : 0,
          quantity,
          total: bread ? bread.price * quantity : 0
        };
      });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    if (isHolidayMode) {
      setError('Orders are temporarily disabled during our holiday break');
      return false;
    }
    
    // Check max order quantity
    const totalQuantity = Object.values(breadQuantities).reduce((sum, qty) => sum + qty, 0);
    const maxQuantity = BUSINESS_SETTINGS_RUNTIME.maxOrderQuantity;
    if (totalQuantity > maxQuantity) {
      errors.maxQuantity = `Maximum order quantity is ${maxQuantity} breads. Please reduce your order.`;
      hasErrors = true;
    }
    
    if (recurringActive && !currentUser) {
      setError('Please sign in to place a recurring order');
      return false;
    }
    if (calculateTotal() === 0) {
      errors.breadItems = 'Please select at least one bread item';
      hasErrors = true;
    }
    if (!deliveryDate) {
      errors.deliveryDate = recurringActive
        ? 'Please select a delivery day'
        : fulfillmentType === 'pickup'
          ? 'Please select a pickup date'
          : 'Please select a delivery date';
      hasErrors = true;
    }
    if (fulfillmentType === 'delivery') {
      if (!address.trim()) {
        errors.address = 'Please enter your delivery address';
        hasErrors = true;
      }
      if (!zipCode.trim()) {
        errors.zipCode = 'Please enter your ZIP code';
        hasErrors = true;
      } else if (!validateZipCode(zipCode)) {
        errors.zipCode = 'We only deliver to Multnomah County (Portland area). Please enter a valid Portland ZIP code.';
        hasErrors = true;
      }
    }
    if (!customerName.trim()) {
      errors.customerName = 'Please enter your name';
      hasErrors = true;
    }
    if (!email.trim()) {
      errors.email = 'Please enter your email';
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    setFieldErrors(errors);
    
    if (hasErrors) {
      // Set a general error message
      const firstError = Object.values(errors)[0];
      setError(firstError || 'Please fix the errors below');
      
      // Scroll to the first error field
      setTimeout(() => {
        const firstErrorField = document.querySelector('[data-field-error]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Fallback: scroll to error message
          const errorElement = document.getElementById('form-error-message');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
      
      return false;
    }

    setFieldErrors({});
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setFieldErrors({});

    // Add a timeout to prevent loading state from getting stuck
    const loadingTimeout = setTimeout(() => {
      console.warn('Loading timeout reached, resetting loading state');
      setLoading(false);
    }, 10000); // 10 second timeout

    try {
      const orderItems = getOrderItems();
      const totalAmount = calculateTotal();
      const isDelivery = fulfillmentType === 'delivery';

      const orderData = {
        items: orderItems,
        deliveryDate,
        fulfillmentType,
        ...(isDelivery
          ? {
              address: address.trim(),
              city: city.trim(),
              zipCode: zipCode.trim(),
            }
          : {
              pickupLocation: PICKUP_ADDRESS_DISPLAY,
              address: PICKUP_ADDRESS_LINE,
              city: PICKUP_ADDRESS_CITY,
              zipCode: PICKUP_ADDRESS_ZIP,
            }),
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        comments: comments.trim(),
        totalAmount,
        isRecurring: recurringActive,
        frequency: recurringActive ? frequency : undefined
      };

      // Store order data in session storage for payment page
      sessionStorage.setItem(ORDER_DATA_STORAGE_KEY, JSON.stringify(orderData));
      
      // Redirect to payment page
      router.push('/order/payment');
      
      // Clear the timeout since we're redirecting
      clearTimeout(loadingTimeout);
    } catch (error) {
      console.error('Error processing order:', error);
      setError('An error occurred while processing your order. Please try again.');
      setLoading(false); // Ensure loading is reset on error
      clearTimeout(loadingTimeout);
    }
  };

  return (
    <div className="min-h-screen py-12 sm:py-20 bg-warm-cream overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-bakery-primary mb-4 sm:mb-6">Place your order</h1>
            <div className="flex flex-col md:flex-row md:items-start gap-6 lg:gap-8">
              <div className="flex-1 min-w-0 space-y-4 text-base sm:text-lg text-earth-brown leading-relaxed">
                <p>
                  Can&apos;t make it to the bread stand during the week? No problem! Place your order here and I&apos;ll bring it to you. Or order and reserve your favorite flavor to come pick up at the stand after work.
                </p>
                <p>
                  Each of the focaccia &quot;loaves&quot; are roughly 9.5 x 13 inches, and the sandwich loaves are the typical 9 inch size.
                </p>
                <p>
                  Payment is collected only after the delivery or pickup has been made.
                </p>
                <p>
                  For larger orders or any other ordering questions, please shoot me an email or text message - lazybreadpdx@gmail.com / 206-272-0839
                </p>
              </div>
              <div className="w-full max-w-md mx-auto md:mx-0 md:max-w-[min(100%,22rem)] lg:max-w-sm shrink-0">
                <Image
                  src="/breads/description.jpg"
                  alt="Lazy Bread focaccia and loaves"
                  width={1200}
                  height={900}
                  className="w-full h-auto rounded-lg object-cover shadow-md"
                  sizes="(max-width: 768px) 100vw, 22rem"
                />
              </div>
            </div>
          </div>

          {/* Holiday Mode Check */}
          {isHolidayMode && (
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 mb-8 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-900 mb-2">
                    {BUSINESS_SETTINGS_RUNTIME.holidayMessage}
                  </h3>
                  <p className="text-amber-800 text-base leading-relaxed">
                    We&apos;ll be back taking orders on <span className="font-semibold">{BUSINESS_SETTINGS_RUNTIME.returnDate}</span>. Thank you for your patience and we look forward to serving you again soon! 🌴
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
            aria-describedby={error ? "form-error-message" : undefined}
          >

            {/* Bread Selection */}
            <div data-field-error={fieldErrors.breadItems ? 'true' : undefined}>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-bakery-primary">Select your focaccias</h2>
                <div className="text-sm text-gray-600 shrink-0">
                  Max {BUSINESS_SETTINGS_RUNTIME.maxOrderQuantity} per order
                  {(() => {
                    const totalQuantity = Object.values(breadQuantities).reduce((sum, qty) => sum + qty, 0);
                    return totalQuantity > 0 ? (
                      <span className={`ml-2 font-semibold ${totalQuantity >= BUSINESS_SETTINGS_RUNTIME.maxOrderQuantity ? 'text-red-600' : 'text-gray-700'}`}>
                        ({totalQuantity}/{BUSINESS_SETTINGS_RUNTIME.maxOrderQuantity})
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
              {fieldErrors.breadItems && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.breadItems}
                  </p>
                </div>
              )}
              {fieldErrors.maxQuantity && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.maxQuantity}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {BREAD_TYPES_RUNTIME.filter(bread => bread.availableForOrders).map((bread) => (
                  <div
                    key={bread.name}
                    className="bg-white rounded-lg shadow-md p-3 sm:p-4 border border-bakery-light flex flex-col gap-3 min-w-0 h-full"
                  >
                    <div className="flex flex-row gap-3 min-w-0 flex-1 items-start">
                      <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={breadImageSrc(bread)}
                          alt={bread.name}
                          fill
                          sizes="(max-width: 768px) 6rem, 7rem"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-base md:text-lg font-semibold text-bakery-primary leading-tight">{bread.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 break-words">{bread.description}</p>
                        <p className="text-base md:text-lg font-bold text-bakery-primary mt-2">${bread.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 shrink-0 pt-1 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => updateQuantity(bread.name, (breadQuantities[bread.name] || 0) - 1)}
                        disabled={isHolidayMode || (breadQuantities[bread.name] || 0) === 0}
                        className="h-10 w-10 sm:h-8 sm:w-8 btn-primary rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        aria-label={`Decrease quantity of ${bread.name}`}
                      >
                        <span aria-hidden="true">−</span>
                      </button>
                      <span className="text-lg font-semibold min-w-[2.5rem] text-center tabular-nums" aria-live="polite" aria-atomic="true">
                        {breadQuantities[bread.name] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(bread.name, (breadQuantities[bread.name] || 0) + 1)}
                        disabled={isHolidayMode || (() => {
                          const totalQuantity = Object.values(breadQuantities).reduce((sum, qty) => sum + qty, 0);
                          return totalQuantity >= BUSINESS_SETTINGS_RUNTIME.maxOrderQuantity;
                        })()}
                        className="h-10 w-10 sm:h-8 sm:w-8 btn-primary rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        title={(() => {
                          const totalQuantity = Object.values(breadQuantities).reduce((sum, qty) => sum + qty, 0);
                          return totalQuantity >= BUSINESS_SETTINGS_RUNTIME.maxOrderQuantity 
                            ? `Maximum order quantity is ${BUSINESS_SETTINGS_RUNTIME.maxOrderQuantity} breads`
                            : '';
                        })()}
                        aria-label={`Increase quantity of ${bread.name}`}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Type Selection — NEXT_PUBLIC_ENABLE_SUBSCRIPTION === "true" */}
            {isSubscriptionEnabled && (
            <div>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6 hover:border-yellow-300 transition-colors">
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 mb-2">
                      <input
                        id="order-recurring"
                        type="checkbox"
                        checked={isRecurring && !!currentUser}
                        onChange={(e) => handleRecurringToggle(e.target.checked)}
                        disabled={isHolidayMode}
                        className="w-5 h-5 mt-1 shrink-0 rounded border-gray-300 text-bakery-primary focus:ring-bakery-primary focus:ring-2 disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor="order-recurring" className="text-lg font-semibold text-gray-900 cursor-pointer block">
                          Set up as weekly, bi-weekly or every 4 weeks focaccias delivery
                        </label>
                    <p className="text-gray-700 mb-3 mt-2">
                      Get fresh focaccias delivered to your door every week!
                      {isRecurring && !currentUser && (
                        <span className="block mt-2 text-sm text-orange-600 font-medium">
                          ⚠️ Please sign in to activate your recurring order
                        </span>
                      )}
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Modify, pause or cancel anytime</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Payment is charged only after delivery</span>
                      </div>
                    </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Pickup or delivery */}
            <div>
              <h2 className="text-2xl font-semibold text-bakery-primary mb-6">Pickup or delivery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 mb-3">
                      How do you want to receive your order? *
                    </legend>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-bakery-light p-4 flex-1 has-[:checked]:border-bakery-primary has-[:checked]:bg-bakery-primary/5">
                        <input
                          type="radio"
                          name="fulfillment"
                          className="mt-1"
                          checked={fulfillmentType === 'pickup'}
                          onChange={() => {
                            setFulfillmentType('pickup');
                            setFieldErrors(prev => {
                              const next = { ...prev };
                              delete next.address;
                              delete next.zipCode;
                              return next;
                            });
                          }}
                          disabled={isHolidayMode || recurringActive}
                        />
                        <span>
                          <span className="font-semibold text-bakery-primary">Pickup</span>
                          <span className="block text-sm text-gray-600 mt-1">{PICKUP_ADDRESS_DISPLAY}</span>
                        </span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-bakery-light p-4 flex-1 has-[:checked]:border-bakery-primary has-[:checked]:bg-bakery-primary/5">
                        <input
                          type="radio"
                          name="fulfillment"
                          className="mt-1"
                          checked={fulfillmentType === 'delivery'}
                          onChange={() => setFulfillmentType('delivery')}
                          disabled={isHolidayMode}
                        />
                        <span>
                          <span className="font-semibold text-bakery-primary">Delivery</span>
                          <span className="block text-sm text-gray-600 mt-1">We bring your order to your Portland-area address.</span>
                        </span>
                      </label>
                    </div>
                    {recurringActive && (
                      <p className="text-xs text-gray-500 mt-2">Subscriptions use delivery only.</p>
                    )}
                  </fieldset>
                </div>
                {recurringActive && (
                  <div>
                    <label htmlFor="order-frequency" className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Frequency *
                    </label>
                    <select
                      id="order-frequency"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value as 'weekly' | 'bi-weekly' | 'every-4-weeks')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
                      required
                      disabled={isHolidayMode}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly (Delivering every 2 weeks)</option>
                      <option value="every-4-weeks">Delivering every 4 weeks</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose how often you&apos;d like to receive your delivery
                    </p>
                  </div>
                )}
                <div data-field-error={fieldErrors.deliveryDate ? 'true' : undefined}>
                  <label htmlFor="order-delivery" className="block text-sm font-medium text-gray-700 mb-2">
                    {recurringActive
                      ? 'Delivery Day *'
                      : fulfillmentType === 'pickup'
                        ? 'Pickup date *'
                        : 'Delivery date *'}
                  </label>
                  {recurringActive ? (
                    <select
                      id="order-delivery"
                      value={deliveryDate}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        if (fieldErrors.deliveryDate) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.deliveryDate;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent ${
                        fieldErrors.deliveryDate 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      required
                      disabled={isHolidayMode}
                      aria-invalid={fieldErrors.deliveryDate ? 'true' : undefined}
                      aria-describedby={fieldErrors.deliveryDate ? 'order-err-deliveryDate' : undefined}
                    >
                      <option value="">Select your preferred delivery day</option>
                      {BUSINESS_SETTINGS_RUNTIME.deliveryDays.map((day) => (
                        <option key={day} value={day.toLowerCase()}>
                          {day}s
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      id="order-delivery"
                      value={deliveryDate}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        if (fieldErrors.deliveryDate) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.deliveryDate;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent ${
                        fieldErrors.deliveryDate 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      required
                      disabled={isHolidayMode}
                      aria-invalid={fieldErrors.deliveryDate ? 'true' : undefined}
                      aria-describedby={fieldErrors.deliveryDate ? 'order-err-deliveryDate' : undefined}
                    >
                      <option value="">
                        {fulfillmentType === 'pickup' ? 'Select a pickup date' : 'Select a delivery date'}
                      </option>
                      {availableDates.map((date) => (
                        <option key={date} value={date}>
                          {formatDeliveryDate(date)}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.deliveryDate && (
                    <p id="order-err-deliveryDate" className="text-sm text-red-600 mt-1 flex items-center" role="alert">
                      <svg className="w-4 h-4 mr-1 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.deliveryDate}
                    </p>
                  )}
                  {!fieldErrors.deliveryDate && recurringActive && currentUser && (
                    <p className="text-xs text-gray-500 mt-1">
                      Your first delivery will be scheduled for the next available {deliveryDate || 'selected day'}
                    </p>
                  )}
                </div>

                <div data-field-error={fieldErrors.customerName ? 'true' : undefined}>
                  <label htmlFor="order-customer-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="order-customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (fieldErrors.customerName) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.customerName;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={isHolidayMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      fieldErrors.customerName 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                    required
                    autoComplete="name"
                    aria-invalid={fieldErrors.customerName ? 'true' : undefined}
                    aria-describedby={fieldErrors.customerName ? 'order-err-customerName' : undefined}
                  />
                  {fieldErrors.customerName && (
                    <p id="order-err-customerName" className="text-sm text-red-600 mt-1 flex items-center" role="alert">
                      <svg className="w-4 h-4 mr-1 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.customerName}
                    </p>
                  )}
                </div>

                <div data-field-error={fieldErrors.email ? 'true' : undefined}>
                  <label htmlFor="order-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    id="order-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={isHolidayMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      fieldErrors.email 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                    required
                    autoComplete="email"
                    aria-invalid={fieldErrors.email ? 'true' : undefined}
                    aria-describedby={fieldErrors.email ? 'order-err-email' : undefined}
                  />
                  {fieldErrors.email && (
                    <p id="order-err-email" className="text-sm text-red-600 mt-1 flex items-center" role="alert">
                      <svg className="w-4 h-4 mr-1 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="order-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="order-phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={isHolidayMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="555-123-4567"
                    maxLength={12}
                    autoComplete="tel"
                  />
                </div>

                {fulfillmentType === 'delivery' && (
                <>
                <div className="md:col-span-2" data-field-error={fieldErrors.address ? 'true' : undefined}>
                  <label htmlFor="order-address" className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <input
                    id="order-address"
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (fieldErrors.address) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.address;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={isHolidayMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      fieldErrors.address 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your street address"
                    required
                    autoComplete="street-address"
                    aria-invalid={fieldErrors.address ? 'true' : undefined}
                    aria-describedby={fieldErrors.address ? 'order-err-address' : undefined}
                  />
                  {fieldErrors.address && (
                    <p id="order-err-address" className="text-sm text-red-600 mt-1 flex items-center" role="alert">
                      <svg className="w-4 h-4 mr-1 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="order-city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    id="order-city"
                    type="text"
                    value={city}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                    placeholder="Portland"
                    aria-readonly="true"
                  />
                  <p className="text-xs text-gray-500 mt-1">We currently only deliver to Portland, Oregon</p>
                </div>

                <div data-field-error={fieldErrors.zipCode ? 'true' : undefined}>
                  <label htmlFor="order-zip" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    id="order-zip"
                    type="text"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value);
                      if (fieldErrors.zipCode) {
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.zipCode;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={isHolidayMode}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      fieldErrors.zipCode 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your Portland ZIP code"
                    required
                    autoComplete="postal-code"
                    aria-invalid={fieldErrors.zipCode ? 'true' : undefined}
                    aria-describedby={
                      fieldErrors.zipCode ? "order-err-zipCode" : "order-zip-hint"
                    }
                  />
                  {fieldErrors.zipCode ? (
                    <p id="order-err-zipCode" className="text-sm text-red-600 mt-1 flex items-center" role="alert">
                      <svg className="w-4 h-4 mr-1 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {fieldErrors.zipCode}
                    </p>
                  ) : (
                    <p id="order-zip-hint" className="text-xs text-gray-500 mt-1">We deliver to Multnomah County (Portland area) only</p>
                  )}
                </div>
                </>
                )}

                {/* Save Address Prompt for Logged-in Users */}
                {fulfillmentType === 'delivery' && currentUser && userProfile && showSaveAddressPrompt && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-blue-900 mb-1">
                            Save this delivery address to your profile?
                          </h3>
                          <p className="text-sm text-blue-700 mb-3">
                            This will make future orders faster by pre-filling your delivery information.
                          </p>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!currentUser?.uid) return;
                                
                                try {
                                  setSavingAddress(true);
                                  await updateUserProfile(currentUser.uid, {
                                    deliveryAddress: address.trim(),
                                    deliveryCity: 'Portland',
                                    deliveryZipCode: zipCode.trim(),
                                    deliveryState: 'OR',
                                    phone: phone.trim(),
                                  });
                                  setAddressSaved(true);
                                  setShowSaveAddressPrompt(false);
                                  // Show success message briefly
                                  setTimeout(() => {
                                    // You could add a success state here if needed
                                  }, 2000);
                                } catch (error) {
                                  console.error('Error saving address:', error);
                                  // You could add error handling here if needed
                                } finally {
                                  setSavingAddress(false);
                                }
                              }}
                              disabled={savingAddress || addressSaved || !address.trim() || !zipCode.trim()}
                              className="btn-primary-sm"
                            >
                              {savingAddress ? 'Saving...' : addressSaved ? 'Address Saved!' : 'Save Address'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label htmlFor="order-comments" className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    id="order-comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    disabled={isHolidayMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Any special requests or delivery instructions..."
                    rows={3}
                    maxLength={255}
                  />
                </div>


              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-bakery-primary mb-4">Order Summary</h2>
              <div className="space-y-2">
                {getOrderItems().map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div id="form-error-message" className="text-center" role="alert" aria-live="assertive">
                <div className="inline-flex items-center p-4 bg-red-50 border-2 border-red-300 rounded-lg max-w-md shadow-md">
                  <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}



            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={loading || calculateTotal() === 0 || isHolidayMode || getOrderItems().length < 1}
                className="btn-primary"
              >
                {isHolidayMode ? 'Orders Temporarily Disabled' : loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Auth Modal for Recurring Orders */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
} 