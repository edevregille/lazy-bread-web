"use client";

import { useState } from "react";
import { PaymentMethod } from "@/lib/types";
import AddPaymentMethodPage from "./AddPaymentMethods";
import { Modal } from "@/components/ui/Modal";

interface ShowSavedPaymentMethodProps {
  paymentMethods: PaymentMethod[];
  onPaymentMethodUpdate?: () => void;
}

export default function ShowSavedPaymentMethod({
  paymentMethods,
  onPaymentMethodUpdate,
}: ShowSavedPaymentMethodProps) {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const closeModal = () => {
    setShowPaymentMethods(false);
    onPaymentMethodUpdate?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-bakery-primary">Payment Information</h2>
        {paymentMethods.length === 0 && (
          <button type="button" onClick={() => setShowPaymentMethods(true)} className="btn-text text-sm">
            Add
          </button>
        )}
        {paymentMethods.length > 0 && (
          <button type="button" onClick={() => setShowPaymentMethods(true)} className="btn-text text-sm">
            Edit
          </button>
        )}
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
                  {method.card?.brand?.toUpperCase() || "CARD"}
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
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Default</span>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showPaymentMethods}
        onClose={closeModal}
        title="Payment method"
        panelClassName="max-w-7xl w-full"
        stackClassName="z-[9999]"
      >
        <div className="-m-6 p-0 sm:p-2">
          <AddPaymentMethodPage onClose={closeModal} />
        </div>
      </Modal>
    </div>
  );
}
