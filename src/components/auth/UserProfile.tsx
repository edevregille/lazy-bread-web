"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PaymentMethods from '../payment/AddPaymentMethods';

interface UserProfileDropdownProps {
  onClose: () => void;
}

export default function UserProfileDropdown({ onClose }: UserProfileDropdownProps) {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      onClose();
    } catch (error: unknown) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle ESC key to close payment methods modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPaymentMethods) {
        setShowPaymentMethods(false);
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

  return (
    <>
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-bakery-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {currentUser?.displayName || 'User'}
              </h3>
              <p className="text-sm text-gray-600 truncate">{currentUser?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                router.push('/dashboard');
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>My Dashboard</span>
            </button>
            
            <div className="border-t pt-2 mt-2">
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{loading ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPaymentMethods && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentMethods(false)}
        >
          <div 
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <PaymentMethods onClose={() => setShowPaymentMethods(false)} />
          </div>
        </div>
      )}
    </>
  );
} 