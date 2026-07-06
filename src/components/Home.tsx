'use client'

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BREAD_TYPES, BUSINESS_SETTINGS } from "@/config/app-config";
import { useConfig } from "@/contexts/ConfigContext";
import { PaymentSuccessModal } from "./PaymentSuccessModal";
import NewsletterSignup from "./NewsletterSignup";
import type { PaymentSuccessData } from "@/lib/types";

// Same photos shown per bread on the order page listing (/breads/<image_name>).
// Skip the generic default.jpg fallback so the showcase only uses real bread photos.
const FLAVOR_SHOWCASE_IMAGES = Array.from(
  new Set(
    BREAD_TYPES.map((bread) => bread.image_name?.trim()).filter((name): name is string => Boolean(name))
  )
)
  .slice(0, 4)
  .map((name) => `/breads/${name}`);

export default function Home() {
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const { config: runtimeConfig } = useConfig();
  const isHolidayMode = (runtimeConfig?.BUSINESS_SETTINGS || BUSINESS_SETTINGS).isHolidayMode;
  const heroMobileSrc = isHolidayMode ? "/hero-vacation-mobile.svg" : "/hero-mobile.svg";
  const heroDesktopSrc = isHolidayMode ? "/hero-vacation-desktop.svg" : "/hero-desktop.svg";
  const heroAlt = isHolidayMode
    ? "Lazy Bread PDX is on vacation — re-opening soon"
    : "Lazy Bread PDX — 100% sourdough focaccia, order now";

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
      <h1 className="sr-only">Lazy Bread PDX — Organic sourdough focaccia bakery in Portland, Oregon</h1>
      {/* Hero Section */}
      <section className="py-6 md:py-8 px-0 md:px-8 background-gradient-warm">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-0">
          <HeroImage
            href={isHolidayMode ? undefined : "/order"}
            mobileSrc={heroMobileSrc}
            desktopSrc={heroDesktopSrc}
            alt={heroAlt}
          />
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-8 background-gradient-warm">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="flex items-center justify-center order-1">
            <Image
              src="/about.png"
              alt="Fresh Organic Focaccia"
              priority
              width={500}
              height={400}
              className="object-cover w-full h-64 sm:h-80 md:h-96 rounded-lg shadow-lg"
            />
          </div>
          <div className="order-2 text-center md:text-left">
            <h2 className="text-4xl font-semibold text-bakery-primary mb-6">About the bread</h2>
            <p className="text-xl font-body text-earth-brown mb-8 leading-relaxed">
              When sourcing the flour for Lazy Bread, my priorities are that it be both organic and free from synthetic nutrients and dough conditioners. I won’t sell what I wouldn’t feed my own family. The focaccia flavors sold in the bread stand are simple but impactful and offerings will vary slightly each day.
              <br /> <br />
              Free delivery &amp; pickup options available.
            </p>
            <Link href="/order" className="inline-block hover:opacity-90 transition-opacity">
              <button className="btn-primary-lg">Order Now</button>
            </Link>
          </div>
        </div>
      </section>

      {/* Current Flavors Section */}
      <section className="py-16 px-8 background-gradient-warm">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-14">
          <div>
            <h3 className="text-3xl font-semibold text-bakery-primary mb-8">
              Current Flavors
            </h3>

            <div className="flex flex-col gap-2.5">
              {BREAD_TYPES.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-warm-cream rounded-xl border border-bakery-primary/10 px-3.5 py-3 shadow-sm hover:shadow-accent hover:border-bakery-primary/30 transition-all"
                >
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-bakery-primary/10 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-bakery-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <h4 className="text-sm sm:text-base font-body font-semibold text-earth-brown leading-snug">
                    {item.name}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 grid-rows-2 gap-3 h-full">
            {FLAVOR_SHOWCASE_IMAGES.map((src) => (
              <div key={src} className="rounded-lg overflow-hidden shadow-lg">
                <img src={src} alt="" aria-hidden="true" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-8 background-gradient-warm">
        <div className="max-w-6xl mx-auto">
          <NewsletterSignup />
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

function HeroImage({
  href,
  mobileSrc,
  desktopSrc,
  alt,
}: {
  href?: string;
  mobileSrc: string;
  desktopSrc: string;
  alt: string;
}) {
  const images = (
    <>
      {/* Mobile: portrait crop of the same artwork so the sign stays large and legible on narrow screens */}
      <img
        src={mobileSrc}
        alt={alt}
        width={375}
        height={500}
        className="w-full h-auto rounded-lg shadow-lg md:hidden"
      />
      {/* Desktop: full landscape artwork */}
      <img
        src={desktopSrc}
        alt={alt}
        width={1000}
        height={500}
        className="w-full h-auto rounded-lg shadow-lg hidden md:block"
      />
    </>
  );

  if (!href) {
    return <div className="block">{images}</div>;
  }

  return (
    <Link href={href} className="block cursor-pointer hover:opacity-90 transition-opacity">
      {images}
    </Link>
  );
}