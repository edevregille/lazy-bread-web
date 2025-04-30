'use client'

import React from "react";
import Image from "next/image";
import { Tile } from "./ui/Tile";
import EmailSignup from "./EmailSignup";
import { Button } from "./ui/Button";
import Link from "next/link";

import welcomeImg from '../../public/welcome-img.png';
import aboutImg from '../../public/about.png';

const MENU_ITEMS = [
    { title: "Classic salt", description: "" },
    { title: "Rosemary", description: "" },
    { title: "Parmesan and Pepper (aka cacio e pepe)", description: "" },
    { title: "Green Olive", description: "" },
    { title: "Anise and candied orange peel", description: "" },
    { title: "Cheez-it ", description: "" },
  ]

const Home: React.FC = () => {
  return (
    <>
      <section id="menu" className="flex justify-center p-8">
        <div className="w-full">
          <Tile title="">
            <div className="md:flex">
              <div className="md:w-1/3 relative">
                <div className="md:h-full relative overflow-hidden flex items-center justify-center">
                  <Image 
                    src={welcomeImg} 
                    alt="Lazy Bread" 
                    width={250}
                    height={250}
                    priority
                    className="object-contain max-h-full max-w-full"
                  />
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <h1 className="text-3xl font-bold text-indigo-900">Organic Sourdough Cottage Bakery</h1>
                <p className="mt-4 text-lg text-gray-600">
                  Specializing in whole wheat and gluten free focaccia bread
                </p>
                <div className="w-18  mt-6 px-0 py-3 w-[200px]">
                  <Link href="/contact">
                    <Button 
                      label="Find Us"
                      onClickAction={() => {}}
                    />
                  </Link>
                </div>
              </div>
            </div>
          </Tile>
        </div>
      </section>

    <section id="menu" className="flex justify-center p-8">
       <div className="w-full">
         <Tile title="">
          <div className="md:flex">
            <div className="md:w-1/2 relative" >
              <div className="md:h-full relative overflow-hidden flex items-center justify-center">
                <Image 
                  src={aboutImg}
                  alt="Lazy Bread"
                  priority
                  width={350}
                  height={150}
                  className="object-contain max-h-full max-w-full"
                />
              </div>
            </div>
            <div className="md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
              <h1 className="text-lg text-gray-600 mb-6 font-bold text-indigo-900">
                Sample farmers market menu
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                {MENU_ITEMS.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{feature.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tile>
      </div>
    </section>

    <section id="email" className="flex justify-center p-8 mb-10">
      <div className="w-full">
      <Tile title="Follow us!">
        <h3>Lazy Bread is just launching: subscribe now to receive updates!</h3>
        <br/>
        <br/>
        <EmailSignup />
      </Tile>
      </div>
    </section>
    </>
  );
};

export default Home;