import React from 'react';
import { Tile } from './ui/Tile';
import Image from 'next/image';
import imgMarket from '../../public/contact-market.png'
import imgCafe from '../../public/contact-cafe11.png';
export default function Contact () {
  return (
    <div className="flex justify-center space-x-8 p-8">
      <Tile title="">
        <Image
          src={imgCafe}
          alt="cafe11"
          className="w-100 h-40 object-cover rounded-t-lg"
          width={420}
          height={150}
        />
        <div className="mt-4 text-center">
          <p className="text-gray-700 mb-4 font-bold">Café Eleven every weekend <br/> 435 NE Rosa Parks, Portland OR 97211</p>
        </div>
      </Tile>

      <Tile title=''>
        <Image
          src={imgMarket}
          alt="market"
          className="w-100 h-40 object-cover rounded-t-lg"
          width={420}
          height={150}
        />
        <div className="mt-4 text-center">
          <p className="text-gray-700 mb-4 font-bold">Woodlawn Farmers Market <br/>every second Saturday ( March - May 2025)</p>
        </div>
      </Tile>
    </div>
  );
};