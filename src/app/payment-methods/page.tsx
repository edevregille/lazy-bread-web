"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PaymentMethods from '@/components/payment/PaymentMethods';

export default function PaymentMethodsPage() {
  const { currentUser, loading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/');
      return;
    }

    // Check for success parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccess(true);
      // Remove the success parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser, loading, router]);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-bakery">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bakery font-bold text-bakery-primary">
              Payment Methods
            </h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-bakery-primary text-white px-4 py-2 rounded-md hover:bg-bakery-primary-dark transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700">Payment method added successfully!</p>
              </div>
            </div>
          )}

          <PaymentMethods onClose={() => router.push('/dashboard')} />
        </div>
      </div>
    </div>
  );
} 