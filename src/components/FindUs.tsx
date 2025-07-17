import React from 'react';
import { Tile } from './ui/Tile';
import Image from 'next/image';
import EmailSignup from "./EmailSignup";
import { FIND_US_LOCATIONS, SOCIAL_MEDIA } from '@/config/app-config';

export default function FindUs () {
  return (
    <section className="background-gradient-warm py-16">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FIND_US_LOCATIONS.filter(location => location.active).map((location) => (
            <Tile key={location.id} title="">
              <div className='flex justify-center'>
                <Image
                  src={location.image}
                  alt={location.imageAlt}
                  className="w-100 h-40 object-cover rounded-t-lg"
                  width={420}
                  height={150}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-black mb-4 font-bold font-body">
                  {location.name} <br/> {location.address} <br/> {location.schedule}
                </p>
              </div>
            </Tile>
          ))}

          <Tile title="Follow us!">
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
          </Tile>
        </div>
      </div>
    </section>
  );
}; 