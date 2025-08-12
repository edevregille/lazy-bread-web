'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { updateSubscriptionDeliveryAddress, } from '@/lib/firebaseService';
import { DELIVERY_ZONES } from '@/config/app-config';
import { Subscription } from '@/lib/types';

interface SubscriptionAddressEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onAddressUpdated: () => void;
}

export default function SubscriptionAddressEditModal({
  isOpen,
  onClose,
  subscription,
  onAddressUpdated
}: SubscriptionAddressEditModalProps) {
  const [addressForm, setAddressForm] = useState({
    address: subscription.address || '',
    city: 'Portland', // Default to Portland
    zipCode: subscription.zipCode || '',
    phone: subscription.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Validate zip code is in Multnomah County
  const validateZipCode = (zip: string): boolean => {
    return DELIVERY_ZONES.allowedZipCodes.includes(zip.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscription.id) {
      setError('Subscription ID not found');
      return;
    }

    // Validate zip code
    if (!validateZipCode(addressForm.zipCode)) {
      setError('We only deliver to Multnomah County (Portland area). Please enter a valid Portland ZIP code.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      await updateSubscriptionDeliveryAddress(subscription.id, addressForm);
      onAddressUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating subscription address:', error);
      setError('Failed to update address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Subscription Delivery Address"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            value={addressForm.address}
            onChange={(e) => setAddressForm({...addressForm, address: e.target.value})}
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
              value={addressForm.city}
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
              value="OR"
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
              value={addressForm.zipCode}
              onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
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
              required
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-bakery-primary text-white py-2 px-4 rounded-md hover:bg-bakery-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Address'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
} 