'use client'

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BREAD_TYPES } from "@/config/app-config";
import { PaymentSuccessModal } from "./PaymentSuccessModal";

interface PaymentSuccessData {
  orderDetails: {
    breadQuantities: Record<string, number>;
    deliveryDate: string;
    address: string;
    city: string;
    zipCode: string;
    customerName: string;
    email: string;
    phone: string;
    comments: string;
    orderItems: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    totalAmount: number;
  };
  paymentIntentId?: string;
  setupIntentId?: string;
  isRecurring: boolean;
  timestamp: string;
  status: 'payment_completed' | 'setup_completed';
}

export default function Home() {
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);

  useEffect(() => {
    // Check for payment success data in session storage
    const paymentSuccessData = sessionStorage.getItem('paymentSuccess');
    if (paymentSuccessData) {
      try {
        const data = JSON.parse(paymentSuccessData);
        setPaymentData(data);
        setShowPaymentSuccess(true);
        // Clear the data from session storage
        sessionStorage.removeItem('paymentSuccess');
      } catch (error) {
        console.error('Error parsing payment success data:', error);
        sessionStorage.removeItem('paymentSuccess');
      }
    }
  }, []);

  const handleClosePaymentSuccess = () => {
    setShowPaymentSuccess(false);
    setPaymentData(null);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-8 px-8 bg-warm-cream">
        <div className="max-w-6xl mx-auto">
          <Link href="/order" className="block cursor-pointer hover:opacity-90 transition-opacity">
            <Image 
              src="/home-ordering.png" 
              alt="Order Now" 
              width={1920}
              height={1080}
              quality={100}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
              className="object-contain w-full h-auto rounded-lg shadow-lg"
            />
          </Link>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-8 px-8 pb-16 bg-warm-cream mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold text-bakery-primary mb-6">
              Our Varieties
            </h2>
            <p className="text-xl md:text-2xl font-body text-earth-brown mb-8 leading-relaxed">
              Each focaccia is crafted with our signature sourdough starter and organic flour, 
              creating unique flavors that celebrate local, seasonal produce.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex items-center justify-center">
              <Image 
                src="/about.png"
                alt="Fresh Organic Focaccia"
                priority
                width={500}
                height={200}
                className="object-contain w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div className="md:w-full p-6 md:p-8">
              <h3 className="text-2xl font-semibold text-bakery-primary mb-6">
                Available at Farmers Markets
              </h3>
              
              <div className="space-y-4">
                {BREAD_TYPES.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-golden-wheat flex items-center justify-center mr-4 shadow-golden">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-body font-semibold text-earth-brown">{item.name}</h4>
                        <p className="mt-1 text-sm font-accent text-earth-brown opacity-80">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Success Modal */}
      {showPaymentSuccess && paymentData && (
        <PaymentSuccessModal
          isOpen={showPaymentSuccess}
          onClose={handleClosePaymentSuccess}
          paymentData={paymentData}
        />
      )}
    </>
  );
}