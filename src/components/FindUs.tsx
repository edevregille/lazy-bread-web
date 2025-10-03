import React from 'react';
import { Title } from './ui/Title';
import Image from 'next/image';
import EmailSignup from "./EmailSignup";
import { FIND_US_LOCATIONS, SOCIAL_MEDIA } from '@/config/app-config';

export default function FindUs () {
  return (
    <section className="background-gradient-warm py-16">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FIND_US_LOCATIONS.filter(location => location.active).map((location) => (
            <Title key={location.id} title="">
              <div className='flex justify-center'>
                <Image
                  src={location.image}
                  alt={location.imageAlt}
                  className="w-100 h-64 object-cover rounded-t-lg"
                  width={420}
                  height={400}
                />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-black mb-3 font-bold font-body text-lg">
                  {location.name}
                </h3>
                <p className="text-gray-700 mb-2 font-medium font-body">
                  📍 {location.address}
                </p>
                <p className="text-amber-700 mb-4 font-semibold font-body bg-amber-50 px-3 py-1 rounded-full inline-block">
                  🕒 {location.schedule}
                </p>
              </div>
            </Title>
          ))}

          <Title title="Follow us!">
            <h3 className="text-black font-body mb-6">Lazy Bread is just launching: subscribe now to receive updates!</h3>
            <EmailSignup />
            {SOCIAL_MEDIA.instagram.active && (
              <div className="mt-4 text-center">
                <a 
                  href={SOCIAL_MEDIA.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bakery-primary hover:text-bakery-secondary transition-colors duration-300 font-body"
                >
                  📸 Follow us on Instagram: {SOCIAL_MEDIA.instagram.handle}
                </a>
              </div>
            )}
          </Title>
        </div>
      </div>
    </section>
  );
}; 