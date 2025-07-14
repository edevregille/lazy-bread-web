"use client";

import Link from "next/link";
import Image from 'next/image';
import {  useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/app-config";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-white shadow-bakery z-10 border-b-bakery-light">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-2xl font-semibold">
                            <Image 
                                src="/logo-lazy-bread.png" 
                                alt="Artisanal Organic Focaccia" 
                                className="w-28 h-28 hover:animate-warm-glow transition-all duration-300"
                                width={112}
                                height={112}
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:block">
                        <div className="flex items-center space-x-8">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.path;
                                return (
                                    <a
                                        key={item.name}
                                        href={item.path}
                                        className={`px-4 py-2 rounded-md text-lg font-body font-medium transition-colors duration-300 ${
                                            isActive 
                                                ? 'text-bakery-primary bg-warm-cream border-b-2 border-bakery-primary' 
                                                : 'text-earth-brown hover:text-bakery-primary hover:bg-warm-cream'
                                        }`}
                                    >
                                        {item.name}
                                    </a>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button 
                            className="text-earth-brown hover:text-bakery-primary transition-colors duration-300"
                            onClick={toggleMenu}
                            aria-label="Toggle mobile menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div 
                    className={`${
                        isOpen ? 'block' : 'hidden'
                    } md:hidden bg-white py-4 px-4 border-t border-bakery-light shadow-bakery`}
                >
                    <div className="space-y-3">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link 
                                    href={item.path} 
                                    className={`block py-3 px-4 rounded-md text-base font-body font-medium transition-colors duration-300 ${
                                        isActive 
                                            ? 'text-bakery-primary bg-warm-cream border-l-4 border-bakery-primary' 
                                            : 'text-earth-brown hover:text-bakery-primary hover:bg-warm-cream'
                                    }`}
                                    onClick={toggleMenu}
                                    key={item.name}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </header>
    );
}
