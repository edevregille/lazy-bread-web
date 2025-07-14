import React from 'react';
import { Tile } from './ui/Tile';
import Image from 'next/image';
import imgMarket from '../../public/contact-market.png'
import imgCafe from '../../public/contact-cafe11.png';
import EmailSignup from "./EmailSignup";

export default function Contact () {
  return (
    <section className="mb-16 mt-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4">
      <Tile title="">
        <div className='flex justify-center'>
          <Image
            src={imgCafe}
            alt="cafe11"
            className="w-100 h-40 object-cover rounded-t-lg"
            width={420}
            height={150}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-gray-700 mb-4 font-bold">Café Eleven every weekend <br/> 435 NE Rosa Parks, Portland OR 97211</p>
        </div>
      </Tile>

      <Tile title=''>
        <div className='flex justify-center'>
          <Image
            src={imgMarket}
            alt="market"
            className="w-100 h-40 object-cover rounded-t-lg"
            width={420}
            height={150}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-gray-700 mb-4 font-bold">Woodlawn Farmers Market <br/>every second Saturday ( March - May 2025)</p>
        </div>
      </Tile>

      <Tile title="Follow us!">
        <h3>Lazy Bread is just launching: subscribe now to receive updates!</h3>
        <br/>
        <br/>
        <EmailSignup />
      </Tile>

    </div>
    </section>
  );
};