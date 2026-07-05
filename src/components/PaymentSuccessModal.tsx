'use client'

import React from 'react';
import { Modal } from './ui/Modal';
import { formatDeliveryDate } from '@/config/app-config';
import type { PaymentSuccessData } from '@/lib/types';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentSuccessData;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  paymentData
}) => {
  const { orderDetails, status } = paymentData;
  const isSetupIntent = status === 'setup_completed';
  const isPickup = orderDetails.fulfillmentType === 'pickup';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Payment Successful!"
    >
      <div className="space-y-6">
        {/* Success Message */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thank you for your order!
          </h2>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2">
            {orderDetails.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="font-semibold">${item.total.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total Amount</span>
                <span className="text-green-600">${orderDetails.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup / delivery */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {isPickup ? 'Pickup' : 'Delivery'} information
          </h3>
          <div className="space-y-1 text-sm text-gray-700">
            <p><strong>Name:</strong> {orderDetails.customerName}</p>
            {isPickup ? (
              <p><strong>Pickup location:</strong> {orderDetails.pickupLocation || orderDetails.address}</p>
            ) : (
              <>
                <p><strong>Address:</strong> {orderDetails.address}</p>
                <p><strong>City:</strong> {orderDetails.city}, {orderDetails.zipCode}</p>
              </>
            )}
            <p>
              <strong>{isPickup ? 'Pickup date' : 'Delivery date'}:</strong>{' '}
              {formatDeliveryDate(orderDetails.deliveryDate)}
            </p>
            <p><strong>Email:</strong> {orderDetails.email}</p>
            <p><strong>Phone:</strong> {orderDetails.phone}</p>
            {orderDetails.comments && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p><strong>Special Instructions:</strong></p>
                <p className="text-gray-600 mt-1 text-xs whitespace-pre-wrap">{orderDetails.comments}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">What&apos;s Next?</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                1
              </div>
              <p className="text-gray-700">We&apos;ll send you a confirmation email with your order details.</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2 mt-0.5">
                2
              </div>
              <p className="text-gray-700">
                {isPickup
                  ? 'We will have your order ready for pickup on the date you selected.'
                  : 'We will deliver to your doorstep on the day you selected.'}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    </Modal>
  );
}; 