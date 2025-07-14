'use client'

import React from "react";
import Image from "next/image";
import EmailSignup from "./EmailSignup";
import Link from "next/link";
import { BREAD_TYPES } from "@/config/app-config";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 px-8 bg-warm-cream">
        <div className="max-w-6xl mx-auto">
          <div className="md:flex items-center">
            <div className="md:w-1/3 relative animate-gentle-float">
              <div className="md:h-full relative overflow-hidden flex items-center justify-center">
                <Image 
                  src="/welcome-img.png" 
                  alt="Artisanal Organic Focaccia" 
                  width={300}
                  height={300}
                  priority
                  className="object-contain max-h-full max-w-full"
                />
              </div>
            </div>
            <div className="md:w-2/3 p-8 md:p-12">
              <h1 className="text-3xl md:text-5xl font-bakery font-bold text-bakery-primary mb-6">
                Organic Sourdough Cottage Bakery
              </h1>
              <p className="text-xl md:text-2xl font-body text-earth-brown mb-8 leading-relaxed">
                Handcrafted sourdough focaccia made with organic ingredients. 
                Each loaf is carefully fermented and baked to perfection in our cottage bakery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/order">
                  <button className="btn-bakery-primary font-body text-lg px-8 py-4">
                    Order
                  </button>
                </Link>
                <Link href="/find-us">
                  <button className="btn-bakery-secondary font-body text-lg px-8 py-4">
                    Find Us
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-16 px-8 bg-warm-cream">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bakery font-bold text-bakery-primary mb-4">
              Our Artisanal Varieties
            </h2>
            <p className="text-lg font-body text-earth-brown max-w-2xl mx-auto">
              Each focaccia is crafted with our signature sourdough starter and organic ingredients, 
              creating unique flavors that celebrate local, seasonal produce.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="md:h-full relative overflow-hidden flex items-center justify-center">
              <Image 
                src="/about.png"
                alt="Fresh Organic Focaccia"
                priority
                width={500}
                height={200}
                className="object-contain max-h-full max-w-full shadow-bakery rounded-lg"
              />
            </div>
            <div className="md:w-full p-6 md:p-8">
              <h3 className="text-2xl font-bakery font-semibold text-bakery-primary mb-6">
                Available at Farmers Markets
              </h3>
              
              <div className="space-y-4">
                {BREAD_TYPES.map((item, index) => (
                  <div key={index} className="card-bakery hover:shadow-bakery-hover">
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

      {/* Email Signup Section */}
      <section className="py-16 px-8 background-gradient-warm">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card-bakery">
            <h2 className="text-3xl md:text-4xl font-bakery font-bold text-bakery-primary mb-4">
              Join Our Community
            </h2>
            <p className="text-lg font-body text-earth-brown mb-8">
              Be the first to know about new flavors, market locations, and special orders. 
              Subscribe to receive updates from our local artisanal bakery.
            </p>
            <EmailSignup />
          </div>
        </div>
      </section>
    </>
  );
}