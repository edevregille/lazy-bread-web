import React from 'react';
import { Tile } from './ui/Tile';
import Image from 'next/image';
import EmailSignup from "./EmailSignup";

export default function FindUs () {
  return (
    <section className="bg-bakery-cream py-16 bakery-pattern-bg">
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Tile title="">
            <div className='flex justify-center'>
              <Image
                src="/contact-cafe11.png"
                alt="cafe11"
                className="w-100 h-40 object-cover rounded-t-lg"
                width={420}
                height={150}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-black mb-4 font-bold font-body">Café Eleven every weekend <br/> 435 NE Rosa Parks, Portland OR 97211</p>
            </div>
          </Tile>

          <Tile title=''>
            <div className='flex justify-center'>
              <Image
                src="/contact-market.png"
                alt="market"
                className="w-100 h-40 object-cover rounded-t-lg"
                width={420}
                height={150}
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-black mb-4 font-bold font-body">Woodlawn Farmers Market <br/>every second Saturday ( March - May 2025)</p>
            </div>
          </Tile>

          <Tile title="Follow us!">
            <h3 className="text-black font-body mb-6">Lazy Bread is just launching: subscribe now to receive updates!</h3>
            <EmailSignup />
          </Tile>

        </div>
      </div>
    </section>
  );
}; 