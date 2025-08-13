"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserOrders, 
  getUserOrdersWithoutIndex, 
  updateUserProfile, 
  getUserSubscriptions, 
  pauseSubscription, 
  resumeSubscription, 
  cancelSubscription,
} from '@/lib/firebaseService';
import SubscriptionAddressEditModal from '@/components/payment/SubscriptionAddressEditModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import ShowSavedPaymentMethod from '@/components/payment/ShowSavedPaymentMethod';
import { DELIVERY_ZONES } from '@/config/app-config';
import { PaymentMethod, Subscription, Order } from '@/lib/types';

export default function DashboardPage() {
  const { currentUser, loading, userProfile, refreshUserProfile, signingOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);

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
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState<string | null>(null);
  const [editingSubscriptionAddress, setEditingSubscriptionAddress] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    action: 'pause' | 'cancel' | null;
    subscription: Subscription | null;
  }>({
    isOpen: false,
    action: null,
    subscription: null
  });
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/');
      return;
    }

    if (currentUser && !signingOut) {
      // Only fetch orders, subscriptions and payment methods once when user is available
      fetchUserOrders();
      fetchUserSubscriptions();
      // Don't call refreshUserProfile here as it causes infinite loops
    }
  }, [currentUser, loading, router, signingOut]); // Added signingOut to dependencies

  // Separate effect for user profile refresh
  useEffect(() => {
    if (currentUser && !userProfile && !signingOut) {
      // Only refresh profile if we don't have one yet and not signing out
      refreshUserProfile();
    }
  }, [currentUser, userProfile, refreshUserProfile, signingOut]);

  // Separate effect for payment methods when userProfile becomes available
  useEffect(() => {
    if (userProfile?.stripeCustomerId && paymentMethods.length === 0 && !signingOut) {
      // Only fetch payment methods if we have a customer ID and no methods yet
      fetchPaymentMethods();
    }
  }, [userProfile?.stripeCustomerId, paymentMethods.length, signingOut]);

  // Effect to update address form when userProfile changes
  useEffect(() => {
    if (userProfile) {
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

  const fetchUserSubscriptions = async () => {
    if (!currentUser?.uid) return;

    try {
      setSubscriptionsLoading(true);
      const subscriptionsData = await getUserSubscriptions(currentUser.uid);
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!userProfile?.stripeCustomerId) return;

    try {
      const methods = await fetch(`/api/stripe/customers/${userProfile.stripeCustomerId}/payment-methods`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await methods.json();
      if(data.success) {
        setPaymentMethods(data.paymentMethods);
      } else setPaymentMethods([]);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleSubscriptionAction = async (subscriptionId: string, action: 'pause' | 'resume' | 'cancel') => {
    if (!subscriptionId) return;

    try {
      setSubscriptionActionLoading(subscriptionId);
      
      switch (action) {
        case 'pause':
          await pauseSubscription(subscriptionId);
          break;
        case 'resume':
          await resumeSubscription(subscriptionId);
          break;
        case 'cancel':
          await cancelSubscription(subscriptionId);
          break;
      }
      
      // Refresh subscriptions after action
      await fetchUserSubscriptions();
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      alert(`Failed to ${action} subscription. Please try again.`);
    } finally {
      setSubscriptionActionLoading(null);
    }
  };

  const handleSubscriptionActionClick = (subscription: Subscription, action: 'pause' | 'cancel') => {
    setConfirmationModal({
      isOpen: true,
      action,
      subscription
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationModal.subscription?.id || !confirmationModal.action) return;

    try {
      setSubscriptionActionLoading(confirmationModal.subscription.id);
      
      switch (confirmationModal.action) {
        case 'pause':
          await pauseSubscription(confirmationModal.subscription.id);
          break;
        case 'cancel':
          await cancelSubscription(confirmationModal.subscription.id);
          break;
      }
      
      // Refresh subscriptions after action
      await fetchUserSubscriptions();
      setConfirmationModal({ isOpen: false, action: null, subscription: null });
    } catch (error) {
      console.error(`Error ${confirmationModal.action}ing subscription:`, error);
      alert(`Failed to ${confirmationModal.action} subscription. Please try again.`);
    } finally {
      setSubscriptionActionLoading(null);
    }
  };

  const handleCloseConfirmationModal = () => {
    setConfirmationModal({ isOpen: false, action: null, subscription: null });
  };

  const handleEditSubscriptionAddress = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setEditingSubscriptionAddress(true);
  };

  const handleCloseAddressModal = () => {
    setEditingSubscriptionAddress(false);
    setSelectedSubscription(null);
  };

  const handleAddressUpdated = () => {
    // Refresh subscriptions to show updated address
    fetchUserSubscriptions();
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

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayOfWeekName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

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
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card-bakery mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-semibold text-bakery-primary mb-6">
              Welcome back, {currentUser.displayName}!
            </h2>
            <button
              onClick={() => router.push('/order')}
              className="bg-bakery-primary text-white px-6 py-3 rounded-md hover:bg-bakery-primary-dark transition-colors font-medium"
            >
              + Order
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
            <ShowSavedPaymentMethod 
              paymentMethods={paymentMethods}
              onPaymentMethodUpdate={fetchPaymentMethods}
            />
          </div>

          {/* Right Column - Subscriptions & Orders */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscriptions */}
            <div className="card-bakery">
              <h2 className="text-2xl font-semibold text-bakery-primary mb-6">
                🔄 Weekly focaccias delivery
              </h2>
              
              {subscriptionsLoading ? (
                <div className="text-center py-8">
                  <div className="text-bakery-primary">Loading your subscriptions...</div>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-600 mb-4">You don&apos;t have any active subscriptions.</div>
                  <button
                    onClick={() => router.push('/order')}
                    className="bg-bakery-primary text-white px-4 py-2 rounded-md hover:bg-bakery-primary-dark transition-colors"
                  >
                    + Order
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {subscriptions.filter(subscription => subscription.status !== 'cancelled').map((subscription) => (
                    <div key={subscription.id} className="bg-white rounded-lg shadow-md p-6 border border-bakery-light">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="text-lg font-semibold text-bakery-primary">
                              Subscription #{subscription.id?.slice(-8) || 'Unknown'}
                            </h3>
                           
                          </div>
                          
                          {/* Action buttons for active subscriptions */}
                          {subscription.status === 'active' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSubscriptionActionClick(subscription, 'pause')}
                                disabled={subscriptionActionLoading === subscription.id}
                                className="px-3 py-1 text-xs bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Pause subscription"
                              >
                                {subscriptionActionLoading === subscription.id ? '...' : 'Pause'}
                              </button>
                              <button
                                onClick={() => handleSubscriptionActionClick(subscription, 'cancel')}
                                disabled={subscriptionActionLoading === subscription.id}
                                className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Cancel subscription"
                              >
                                {subscriptionActionLoading === subscription.id ? '...' : 'Cancel'}
                              </button>
                            </div>
                          )}

                          {/* Action buttons for paused subscriptions */}
                          {subscription.status === 'paused' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSubscriptionAction(subscription.id!, 'resume')}
                                disabled={subscriptionActionLoading === subscription.id}
                                className="px-3 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Resume subscription"
                              >
                                {subscriptionActionLoading === subscription.id ? '...' : 'Resume'}
                              </button>
                              <button
                                onClick={() => handleSubscriptionActionClick(subscription, 'cancel')}
                                disabled={subscriptionActionLoading === subscription.id}
                                className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Cancel subscription"
                              >
                                {subscriptionActionLoading === subscription.id ? '...' : 'Cancel'}
                              </button>
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatusColor(subscription.status)}`}>
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Subscription Items</h4>
                          <div className="space-y-1">
                            {subscription.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>${item.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                            {subscription.totalAmount && <><span>Total</span> <span>${subscription.totalAmount.toFixed(2)}</span></>}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Delivery Schedule</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Delivery Day:</strong> {subscription.dayOfWeek}</p>
                            <p><strong>Started on:</strong> {subscription.createdAt ? subscription.createdAt.toLocaleDateString() : 'Unknown'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900">Delivery Address</h4>
                            <button
                              onClick={() => handleEditSubscriptionAddress(subscription)}
                              className="text-bakery-primary hover:text-bakery-primary-dark text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="text-sm space-y-1">
                            <p>{subscription.address}</p>
                            <p>{subscription.city}, {subscription.zipCode}</p>
                            <p>📞 {subscription.phone}</p>
                          </div>
                        </div>

                        {subscription.comments && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
                            <p className="text-sm text-gray-600">{subscription.comments}</p>
                          </div>
                        )}
                      </div>

                      {subscription.status === 'cancelled' && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-gray-500 text-center italic">
                            This subscription has been cancelled and cannot be reactivated.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orders */}
            <div className="card-bakery">
              <h2 className="text-2xl font-semibold text-bakery-primary mb-6">
                📋 Last 30 days history
              </h2>
              
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="text-bakery-primary">Loading your orders...</div>
                </div>
              ) : orders.length === 0 ? (
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
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-bakery-light">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-bakery-primary">
                            Order #{order.id?.slice(-8) || 'Unknown'}
                          </h3>
                          <p className="text-gray-600">
                            Placed on {order.createdAt ? order.createdAt.toLocaleDateString() : 'Unknown'}
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

      {/* Payment Methods Modal is now handled in ShowSavedPaymentMethod component */}
      
      {/* Subscription Address Edit Modal */}
      {selectedSubscription && (
        <SubscriptionAddressEditModal
          isOpen={editingSubscriptionAddress}
          onClose={handleCloseAddressModal}
          subscription={selectedSubscription}
          onAddressUpdated={handleAddressUpdated}
        />
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && confirmationModal.subscription && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmAction}
          title={
            confirmationModal.action === 'pause' 
              ? 'Pause Subscription' 
              : 'Cancel Subscription'
          }
          message={
            confirmationModal.action === 'pause'
              ? `Are you sure you want to pause your subscription? You can resume it at any time from your dashboard.`
              : `Are you sure you want to cancel your subscription? This action cannot be undone and you will no longer receive weekly deliveries.`
          }
          confirmText={
            confirmationModal.action === 'pause' ? 'Pause Subscription' : 'Cancel Subscription'
          }
          confirmButtonColor={
            confirmationModal.action === 'pause' 
              ? 'bg-yellow-500 hover:bg-yellow-600' 
              : 'bg-red-500 hover:bg-red-600'
          }
          loading={subscriptionActionLoading === confirmationModal.subscription.id}
        />
      )}
    </div>
  );
} 