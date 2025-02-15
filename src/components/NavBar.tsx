"use client";

import Link from "next/link";
import Image from 'next/image';
import {  useState } from "react";

import logo from '../../public/logo-lazy-bread.png';
// import { useCart } from "@/hooks/use-cart";
//import { Button } from "./ui/Button";

export default function NavBar() {
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
      <nav className="bg-white fixed w-full top-0 left-0 z-50 text-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-x-8">
            {/* Logo */}
            <Link href="/" className="text-2xl font-semibold">
                <Image 
                  src={logo} 
                  alt="Lazy Bread" 
                  className="w-16 h-16"
                  />
            </Link>
  
          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-8 flex-grow ">
            <Link href="/about">
                <div className="hover:text-gray-500">About Us</div>
            </Link>
            {/* <Link href="/shop">
                <div className="hover:text-gray-500">Pre-order</div>
            </Link> */}
            <Link href="/contact">
                <div className="hover:text-gray-500">Find Us</div>
            </Link>
          {/* Add more links here */}
            </div>

        {/* Login Button */}
        <div>
          {/* <Link href="/cart">
          <Button 
            label="Cart"
            num={numberItems}
            onClickAction={() => {}}
          />
          </Link> */}
        </div>
  
          {/* Mobile Hamburger Menu */}
          <div className="md:hidden flex items-center">
            <button onClick={toggleMenu} className="text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
  
        {/* Mobile Menu */}
        <div
          className={`${
            isOpen ? 'block' : 'hidden'
          } md:hidden bg-gray-800 text-white py-4 px-6 space-y-4`}
        >
          <Link href="/about" className="block hover:text-gray-400">
            About
          </Link>
          <Link href="/login" className="block hover:text-gray-400">
            Login
          </Link>
        </div>
      </nav>
    )
}
