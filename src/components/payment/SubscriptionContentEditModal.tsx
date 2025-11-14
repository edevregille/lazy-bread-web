'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { updateSubscriptionContent } from '@/lib/firebaseService';
import { BREAD_TYPES } from '@/config/app-config';
import { Subscription, OrderItem } from '@/lib/types';

interface SubscriptionContentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onContentUpdated: () => void;
}

export default function SubscriptionContentEditModal({
  isOpen,
  onClose,
  subscription,
  onContentUpdated
}: SubscriptionContentEditModalProps) {
  const [breadQuantities, setBreadQuantities] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize bread quantities from subscription items when modal opens
  useEffect(() => {
    if (isOpen && subscription.items && subscription.items.length > 0) {
      console.log('Initializing modal with subscription items:', subscription.items);
      const quantities: Record<string, number> = {};
      subscription.items.forEach(item => {
        console.log(`Setting quantity for ${item.id} (${item.name}): ${item.quantity}`);
        // Map the item to the correct bread type ID (case-insensitive)
        const breadType = BREAD_TYPES.find(bread => 
          bread.availableForOrders && (
            bread.id.toLowerCase() === item.id.toLowerCase() || 
            bread.name.toLowerCase() === item.name.toLowerCase()
          )
        );
        if (breadType) {
          quantities[breadType.id] = item.quantity;
        } else {
          quantities[item.id] = item.quantity; // fallback to original ID
        }
      });
      setBreadQuantities(quantities);
      setError(''); // Clear any previous errors
    } else if (isOpen) {
      console.log('Modal opened but no subscription items found:', subscription.items);
      // Initialize with empty quantities if no items
      setBreadQuantities({});
      setError('');
    }
  }, [isOpen, subscription.items]);

  // Also initialize when subscription changes, even if modal is not open yet
  useEffect(() => {
    if (subscription.items && subscription.items.length > 0) {
      const quantities: Record<string, number> = {};
      subscription.items.forEach(item => {
        // Map the item to the correct bread type ID (case-insensitive)
        const breadType = BREAD_TYPES.find(bread => 
          bread.availableForOrders && (
            bread.id.toLowerCase() === item.id.toLowerCase() || 
            bread.name.toLowerCase() === item.name.toLowerCase()
          )
        );
        if (breadType) {
          quantities[breadType.id] = item.quantity;
        } else {
          quantities[item.id] = item.quantity; // fallback to original ID
        }
      });
      setBreadQuantities(quantities);
    }
  }, [subscription.items]);

  const handleQuantityChange = (breadId: string, quantity: number) => {
    if (quantity < 0) return;
    
    setBreadQuantities(prev => ({
      ...prev,
      [breadId]: quantity
    }));
  };

  const calculateTotal = (): number => {
    return BREAD_TYPES
      .filter(bread => bread.availableForOrders)
      .reduce((total, bread) => {
        const quantity = breadQuantities[bread.id] || 0;
        return total + (bread.price * quantity);
      }, 0);
  };

  const generateOrderItems = (): OrderItem[] => {
    return BREAD_TYPES
      .filter(bread => bread.availableForOrders && (breadQuantities[bread.id] || 0) > 0)
      .map(bread => ({
        id: bread.id,
        name: bread.name,
        price: bread.price,
        quantity: breadQuantities[bread.id] || 0,
        total: bread.price * (breadQuantities[bread.id] || 0)
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscription.id) {
      setError('Subscription ID not found');
      return;
    }

    // Check if at least one bread type is selected
    const hasItems = Object.values(breadQuantities).some(quantity => quantity > 0);
    if (!hasItems) {
      setError('Please select at least one bread type');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const newItems = generateOrderItems();
      const newTotalAmount = calculateTotal();
      
      await updateSubscriptionContent(subscription.id, {
        items: newItems,
        totalAmount: newTotalAmount
      });
      
      onContentUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating subscription content:', error);
      setError('Failed to update subscription content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentQuantity = (breadId: string): number => {
    const quantity = breadQuantities[breadId] || 0;
    console.log(`Getting quantity for ${breadId}: ${quantity} (from breadQuantities:`, breadQuantities, ')');
    return quantity;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modify your subscription"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          
          {BREAD_TYPES.filter(bread => bread.availableForOrders).map((bread) => (
            <div key={bread.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{bread.name}</h4>
                <p className="text-sm text-gray-600">{bread.description}</p>
                <p className="text-sm font-medium text-bakery-primary">${bread.price.toFixed(2)} each</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(bread.id, getCurrentQuantity(bread.id) - 1)}
                  disabled={getCurrentQuantity(bread.id) <= 0}
                  className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  -
                </button>
                
                <span className="w-8 text-center font-medium">
                  {getCurrentQuantity(bread.id)}
                </span>
                
                <button
                  type="button"
                  onClick={() => handleQuantityChange(bread.id, getCurrentQuantity(bread.id) + 1)}
                  className="w-8 h-8 rounded-full btn-primary flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total per delivery:</span>
            <span className="text-bakery-primary">${calculateTotal().toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            This will be your weekly subscription amount
          </p>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
