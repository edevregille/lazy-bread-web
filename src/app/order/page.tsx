"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BREAD_TYPES, getAvailableDeliveryDates, formatDeliveryDate, DELIVERY_ZONES, BUSINESS_SETTINGS } from '@/config/app-config';
import { updateUserProfile } from '@/lib/firebaseService';
import AuthModal from '@/components/auth/AuthModal';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export default function OrderPage() {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot-password'>('signup');
  const [showSaveAddressPrompt, setShowSaveAddressPrompt] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);

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

  // Pre-fill form with user profile data if available
  useEffect(() => {
    if (userProfile) {
      setAddress(userProfile.deliveryAddress || '');
      setCity('Portland'); // Always set to Portland
      setZipCode(userProfile.deliveryZipCode || '');
      setCustomerName(userProfile.displayName || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
    } else if (currentUser) {
      setCustomerName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }
  }, [userProfile, currentUser]);

  // Reset loading state on component unmount or route change
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  // Show save address prompt when user fills in address fields
  useEffect(() => {
    if (currentUser && userProfile && address.trim() && zipCode.trim() && !showSaveAddressPrompt) {
      // Only show if the address is different from what's already saved
      const currentAddress = userProfile.deliveryAddress || '';
      const currentZipCode = userProfile.deliveryZipCode || '';
      
      if (address.trim() !== currentAddress || zipCode.trim() !== currentZipCode) {
        setShowSaveAddressPrompt(true);
        setAddressSaved(false); // Reset saved state when address changes
      }
    }
  }, [address, zipCode, currentUser, userProfile, showSaveAddressPrompt]);

  const availableDates = getAvailableDeliveryDates();

  // Check if we're in holiday mode
  const isHolidayMode = BUSINESS_SETTINGS.isHolidayMode;

  // Validate zip code is in Multnomah County
  const validateZipCode = (zip: string): boolean => {
    return DELIVERY_ZONES.allowedZipCodes.includes(zip.trim());
  };

  const updateQuantity = (breadType: string, quantity: number) => {
    setBreadQuantities(prev => ({
      ...prev,
      [breadType]: Math.max(0, quantity)
    }));
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

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setIsRecurring(true);
  };

  const calculateTotal = () => {
    return Object.entries(breadQuantities).reduce((total, [breadType, quantity]) => {
      const bread = BREAD_TYPES.find(b => b.name === breadType);
      return total + (bread ? bread.price * quantity : 0);
    }, 0);
  };

  const getOrderItems = (): OrderItem[] => {
    return Object.entries(breadQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([breadType, quantity]) => {
        const bread = BREAD_TYPES.find(b => b.name === breadType);
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
    if (isHolidayMode) {
      setError('Orders are temporarily disabled during our holiday break');
      return false;
    }
    if (isRecurring && !currentUser) {
      setError('Please sign in to place a recurring order');
      return false;
    }
    if (!deliveryDate) {
      setError(isRecurring ? 'Please select a delivery day' : 'Please select a delivery date');
      return false;
    }
    if (!address.trim()) {
      setError('Please enter your delivery address');
      return false;
    }
    if (!zipCode.trim()) {
      setError('Please enter your ZIP code');
      return false;
    }
    if (!validateZipCode(zipCode)) {
      setError('We only deliver to Multnomah County (Portland area). Please enter a valid Portland ZIP code.');
      return false;
    }
    if (!customerName.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (calculateTotal() === 0) {
      setError('Please select at least one bread item');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    // Add a timeout to prevent loading state from getting stuck
    const loadingTimeout = setTimeout(() => {
      console.warn('Loading timeout reached, resetting loading state');
      setLoading(false);
    }, 10000); // 10 second timeout

    try {
      const orderItems = getOrderItems();
      const totalAmount = calculateTotal();

      const orderData = {
        items: orderItems,
        deliveryDate,
        address: address.trim(),
        city: city.trim(),
        zipCode: zipCode.trim(),
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        comments: comments.trim(),
        totalAmount,
        isRecurring
      };

      // Store order data in session storage for payment page
      sessionStorage.setItem('orderData', JSON.stringify(orderData));
      
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
    <div className="min-h-screen py-20 bg-warm-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-bakery">
          <div className="mb-8">
            <h2 className="text-4xl font-semibold text-bakery-primary mb-6">
              Place your order 
            </h2>
            <p className="text-lg text-earth-brown">
              Select your favorite focaccias and choose your delivery date, we will bring it to you. 
              <br/>For specific orders or any question, send us an email or reach out via instagram.
            </p>
          </div>

          {/* Holiday Mode Check */}
          {isHolidayMode && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-1">
                    {BUSINESS_SETTINGS.holidayMessage}
                  </h3>
                  <p className="text-red-700">
                    We&apos;ll be back taking orders on {BUSINESS_SETTINGS.returnDate}. Thank you for your patience!
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Bread Selection */}
            <div>
              <h2 className="text-2xl font-semibold text-bakery-primary mb-6">Select your focaccias</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {BREAD_TYPES.map((bread) => (
                  <div key={bread.name} className="bg-white rounded-lg shadow-md p-6 border border-bakery-light">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-bakery-primary">{bread.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{bread.description}</p>
                        <p className="text-lg font-bold text-bakery-primary mt-2">${bread.price.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(bread.name, (breadQuantities[bread.name] || 0) - 1)}
                        disabled={isHolidayMode}
                        className="w-8 h-8 bg-bakery-primary text-white rounded-full flex items-center justify-center hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="text-lg font-semibold min-w-[2rem] text-center">
                        {breadQuantities[bread.name] || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(bread.name, (breadQuantities[bread.name] || 0) + 1)}
                        disabled={isHolidayMode}
                        className="w-8 h-8 bg-bakery-primary text-white rounded-full flex items-center justify-center hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Type Selection */}
            <div>
              {/* <h2 className="text-2xl font-semibold text-bakery-primary mb-6">Order Type</h2> */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6 hover:border-yellow-300 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <input
                        type="checkbox"
                        checked={isRecurring && !!currentUser}
                        onChange={(e) => handleRecurringToggle(e.target.checked)}
                        disabled={isHolidayMode}
                        className="w-5 h-5 rounded border-gray-300 text-bakery-primary focus:ring-bakery-primary focus:ring-2 disabled:opacity-50"
                      />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Set up as weekly focaccias delivery
                      </h3>
                    </div>
                    <p className="text-gray-700 mb-3">
                      Get fresh focaccias delivered to your door every week!
                      {!currentUser && (
                        <span className="block mt-2 text-sm text-blue-600 font-medium">
                          💡 Sign in required for recurring orders to manage your subscription
                        </span>
                      )}
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
                        <span>Weekly delivery on your chosen day</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Easy to pause or cancel anytime</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h2 className="text-2xl font-semibold text-bakery-primary mb-6">Delivery information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isRecurring ? 'Delivery Day *' : 'Delivery Date *'}
                  </label>
                  {isRecurring ? (
                    <select
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
                      required
                      disabled={isHolidayMode}
                    >
                      <option value="">Select your preferred delivery day</option>
                      {BUSINESS_SETTINGS.deliveryDays.map((day) => (
                        <option key={day} value={day.toLowerCase()}>
                          Every {day}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
                      required
                      disabled={isHolidayMode}
                    >
                      <option value="">Select a delivery date</option>
                      {availableDates.map((date) => (
                        <option key={date} value={date}>
                          {formatDeliveryDate(date)}
                        </option>
                      ))}
                    </select>
                  )}
                  {isRecurring && currentUser && (
                    <p className="text-xs text-gray-500 mt-1">
                      Your first delivery will be scheduled for the next available {deliveryDate || 'selected day'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isHolidayMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isHolidayMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={isHolidayMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="555-123-4567"
                    maxLength={12}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isHolidayMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your street address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                    placeholder="Portland"
                  />
                  <p className="text-xs text-gray-500 mt-1">We currently only deliver to Portland, Oregon</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    disabled={isHolidayMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your Portland ZIP code"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">We deliver to Multnomah County (Portland area) only</p>
                </div>

                {/* Save Address Prompt for Logged-in Users */}
                {currentUser && userProfile && showSaveAddressPrompt && (
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
                              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Instructions
                  </label>
                  <textarea
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
              <div className="text-center">
                <div className="inline-flex items-center p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
                  <svg className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="bg-bakery-primary text-white px-6 py-3 rounded-md hover:bg-bakery-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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