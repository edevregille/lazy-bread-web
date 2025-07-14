"use client";

import Link from "next/link";
import Image from 'next/image';
import {  useState } from "react";

import logo from '../../public/logo-lazy-bread.png';

const NAV_ITEMS = [
  {"name": "Home", path: "/"},
  {"name": "About", path: "/about"},
  {"name": "Order", path: "/order"},
  {"name": "Find Us", path: "/contact"},
];
// import { useCart } from "@/hooks/use-cart";
// import { Button } from "./ui/Button";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    // const [numberItems, setNumberItems] = useState(0);
    // const cart = useCart();

    // useEffect( () => {
    //   if(cart.items && cart.items.length > 0){
    //     setNumberItems( cart.items.reduce((acc, obj) => { return acc + obj.qty; }, 0) );
    //   }
    //   else setNumberItems(0);

    // }, [ cart , ])

    const toggleMenu = () => {
      setIsOpen(!isOpen)
    }
  
    return (
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-semibold">
                <Image 
                  src={logo} 
                  alt="Lazy Bread" 
                  className="w-24 h-24"
                />
              </Link>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex items-center space-x-8">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.name}
                  href={item.path}
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-lg font-medium"
                >
                  {item.name}
                </a>
              ))}
               {/* <div>
                <Link href="/cart">
                  <Button 
                    label="Cart"
                    num={numberItems}
                    onClickAction={() => {}}
                  />
                </Link>
              </div> */}
            </div>
          </nav>
          
          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden">
            <button 
              className="text-gray-700 hover:text-indigo-600"
              onClick={toggleMenu}
              aria-label="Toggle mobile menu"
            >
              <svg 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isOpen ? (
                  // X icon when menu is open
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  // Hamburger icon when menu is closed
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Dropdown - Outside the main flex container */}
        <div
          className={`${
            isOpen ? 'block' : 'hidden'
          } md:hidden bg-white py-3 px-4 border-t border-gray-100 shadow-inner`}
        >
          <div className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link 
                href={item.path} 
                className="block text-gray-700 hover:text-indigo-600 py-2 px-2 rounded-md text-base font-medium"
                onClick={toggleMenu}
                key={item.name}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
