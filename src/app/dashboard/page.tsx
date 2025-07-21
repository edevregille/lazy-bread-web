"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserOrders, getUserOrdersWithoutIndex, Order, updateUserProfile } from '@/lib/firebaseService';
import { getCustomerPaymentMethods, PaymentMethod } from '@/lib/stripeApi';
import PaymentMethods from '@/components/payment/PaymentMethods';
import { DELIVERY_ZONES } from '@/config/app-config';

export default function DashboardPage() {
  const { currentUser, loading, userProfile, refreshUserProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    deliveryAddress: userProfile?.deliveryAddress || '',
    deliveryCity: 'Portland', // Default to Portland
    deliveryZipCode: userProfile?.deliveryZipCode || '',
    deliveryState: 'OR', // Default to Oregon
    phone: userProfile?.phone || '',
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/');
      return;
    }

    if (currentUser) {
      // Only fetch orders and payment methods once when user is available
      fetchUserOrders();
      // Don't call refreshUserProfile here as it causes infinite loops
    }
  }, [currentUser, loading, router]); // Removed userProfile and refreshUserProfile from dependencies

  // Separate effect for user profile refresh
  useEffect(() => {
    if (currentUser && !userProfile) {
      // Only refresh profile if we don't have one yet
      refreshUserProfile();
    }
  }, [currentUser, userProfile, refreshUserProfile]);

  // Separate effect for payment methods when userProfile becomes available
  useEffect(() => {
    if (userProfile?.stripeCustomerId && paymentMethods.length === 0) {
      // Only fetch payment methods if we have a customer ID and no methods yet
      fetchPaymentMethods();
    }
  }, [userProfile?.stripeCustomerId, paymentMethods.length]);

  // Effect to update address form when userProfile changes
  useEffect(() => {
    console.log('Dashboard: userProfile updated:', userProfile);
    if (userProfile) {
      console.log('Dashboard: Setting address form with profile data:', {
        deliveryAddress: userProfile.deliveryAddress,
        deliveryZipCode: userProfile.deliveryZipCode,
        phone: userProfile.phone
      });
      setAddressForm({
        deliveryAddress: userProfile.deliveryAddress || '',
        deliveryCity: 'Portland', // Always set to Portland
        deliveryZipCode: userProfile.deliveryZipCode || '',
        deliveryState: 'OR', // Always set to Oregon
        phone: userProfile.phone || '',
      });
      setProfileLoading(false);
    } else if (!loading) {
      // If auth is done loading but no profile, set loading to false
      setProfileLoading(false);
    }
  }, [userProfile, loading]);

  // Handle ESC key to close payment methods modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPaymentMethods) {
        setShowPaymentMethods(false);
        fetchPaymentMethods();
      }
    };

    if (showPaymentMethods) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showPaymentMethods]);

  const fetchUserOrders = async () => {
    if (!currentUser?.email) return;

    try {
      setOrdersLoading(true);
      // Try the original function first, fallback to the alternative if index doesn't exist
      let ordersData: Order[];
      try {
        ordersData = await getUserOrders(currentUser.email);
      } catch {
        // Fallback to alternative query if index doesn't exist
        ordersData = await getUserOrdersWithoutIndex(currentUser.email);
      }
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!userProfile?.stripeCustomerId) return;

    try {
      const methods = await getCustomerPaymentMethods(userProfile.stripeCustomerId);
      console.log('Payment methods:', methods);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  // Validate zip code is in Multnomah County
  const validateZipCode = (zip: string): boolean => {
    return DELIVERY_ZONES.allowedZipCodes.includes(zip.trim());
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.uid) return;

    // Validate zip code
    if (!validateZipCode(addressForm.deliveryZipCode)) {
      setAddressError('We only deliver to Multnomah County (Portland area). Please enter a valid Portland ZIP code.');
      return;
    }

    try {
      setSavingAddress(true);
      setAddressError('');
      
      await updateUserProfile(currentUser.uid, addressForm);
      await refreshUserProfile();
      setEditingAddress(false);
    } catch (error) {
      console.error('Error updating address:', error);
      setAddressError('Failed to update address. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const recurringOrders = orders.filter(order => order.isRecurring);
  const historicalOrders = orders.filter(order => !order.isRecurring);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-bakery-primary">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen py-20 bg-gradient-to-br from-bakery-cream via-bakery-warm to-bakery-butter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card-bakery mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bakery font-bold text-bakery-primary">
              Welcome back, {currentUser.displayName || 'Baker'}!
            </h1>
            <button
              onClick={() => router.push('/order')}
              className="bg-bakery-primary text-white px-6 py-3 rounded-md hover:bg-bakery-primary-dark transition-colors font-medium"
            >
              Place New Order
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Payment */}
          <div className="lg:col-span-1 space-y-8">
            {/* Delivery Address */}
            <div className="card-bakery">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-bakery-primary">Delivery Address</h2>
                <button
                  onClick={() => setEditingAddress(!editingAddress)}
                  className="text-bakery-primary hover:text-bakery-primary-dark text-sm font-medium"
                >
                  {editingAddress ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {editingAddress ? (
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  {addressError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{addressError}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={addressForm.deliveryAddress}
                      onChange={(e) => setAddressForm({...addressForm, deliveryAddress: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
                      placeholder="Enter your street address"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={addressForm.deliveryCity}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                        placeholder="Portland"
                      />
                      <p className="text-xs text-gray-500 mt-1">We currently only deliver to Portland, Oregon</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={addressForm.deliveryState}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                        placeholder="OR"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={addressForm.deliveryZipCode}
                        onChange={(e) => setAddressForm({...addressForm, deliveryZipCode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
                        placeholder="Enter your Portland ZIP code"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">We deliver to Multnomah County (Portland area) only</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bakery-primary focus:border-transparent"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="flex-1 bg-bakery-primary text-white py-2 px-4 rounded-md hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingAddress ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAddress(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  {profileLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bakery-primary"></div>
                      <p className="text-gray-500">Loading address...</p>
                    </div>
                  ) : userProfile?.deliveryAddress ? (
                    <>
                      <p className="text-gray-900">{userProfile.deliveryAddress}</p>
                      <p className="text-gray-600">
                        {userProfile.deliveryCity}, {userProfile.deliveryState} {userProfile.deliveryZipCode}
                      </p>
                      {userProfile.phone && (
                        <p className="text-gray-600">📞 {userProfile.phone}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No delivery address set</p>
                  )}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="card-bakery">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-bakery-primary">Payment Methods</h2>
                {paymentMethods.length === 0  && <button
                  onClick={() => setShowPaymentMethods(true)}
                  className="text-bakery-primary hover:text-bakery-primary-dark text-sm font-medium"
                >
                  Add
                </button>}
                {paymentMethods.length > 0  && <button
                  onClick={() => setShowPaymentMethods(true)}
                  className="text-bakery-primary hover:text-bakery-primary-dark text-sm font-medium"
                >
                  Edit
                </button>}
              </div>

              {paymentMethods.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No payment methods saved</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.slice(0, 1).map((method) => (
                    <div key={method.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">
                          {method.card?.brand?.toUpperCase() || 'CARD'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          •••• •••• •••• {method.card?.last4}
                        </p>
                        <p className="text-xs text-gray-600">
                          Expires {method.card?.exp_month}/{method.card?.exp_year}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Default
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Orders */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recurring Orders */}
            {recurringOrders.length > 0 && (
              <div className="card-bakery">
                <h2 className="text-2xl font-semibold text-bakery-primary mb-6">
                  🔄 Recurring Orders
                </h2>
                
                <div className="space-y-6">
                  {recurringOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-bakery-light">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold text-bakery-primary">
                              Order #{order.id?.slice(-8) || 'Unknown'}
                            </h3>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                              🔄 Recurring
                            </span>
                          </div>
                          <p className="text-gray-600">
                            Started on {formatDate(order.createdAt || new Date())}
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            Repeats every {order.recurringFrequency} on {new Date(order.recurringStartDate || order.deliveryDate).toLocaleDateString('en-US', { weekday: 'long' })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>${item.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span>Total</span>
                              <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Delivery Details</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Date:</strong> {formatDate(new Date(order.deliveryDate))}</p>
                            <p><strong>Address:</strong> {order.address}</p>
                            <p><strong>City:</strong> {order.city}</p>
                            <p><strong>ZIP:</strong> {order.zipCode}</p>
                          </div>
                        </div>
                      </div>

                      {order.comments && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-gray-900 mb-1">Special Instructions</h4>
                          <p className="text-sm text-gray-600">{order.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Orders */}
            <div className="card-bakery">
              <h2 className="text-2xl font-semibold text-bakery-primary mb-6">
                📋 Last 30 days orders history
              </h2>
              
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="text-bakery-primary">Loading your orders...</div>
                </div>
              ) : historicalOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-600 mb-4">You haven&apos;t placed any orders yet.</div>
                  <button
                    onClick={() => router.push('/order')}
                    className="bg-bakery-primary text-white px-4 py-2 rounded-md hover:bg-bakery-primary-dark transition-colors"
                  >
                    Place Your First Order
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {historicalOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-bakery-light">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-bakery-primary">
                            Order #{order.id?.slice(-8) || 'Unknown'}
                          </h3>
                          <p className="text-gray-600">
                            Placed on {formatDate(order.createdAt || new Date())}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>${item.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span>Total</span>
                              <span>${order.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Delivery Details</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Date:</strong> {formatDate(new Date(order.deliveryDate))}</p>
                            <p><strong>Address:</strong> {order.address}</p>
                            <p><strong>City:</strong> {order.city}</p>
                            <p><strong>ZIP:</strong> {order.zipCode}</p>
                          </div>
                        </div>
                      </div>

                      {order.comments && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-gray-900 mb-1">Special Instructions</h4>
                          <p className="text-sm text-gray-600">{order.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Modal */}
      {showPaymentMethods && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowPaymentMethods(false);
            fetchPaymentMethods();
          }}
        >
          <div 
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <PaymentMethods 
              onClose={() => {
                setShowPaymentMethods(false);
                fetchPaymentMethods();
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 