"use client";

import Link from "next/link";
import Image from 'next/image';
import { useState } from "react";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/app-config";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-white shadow-bakery z-10 border-t-0 border-b border-bakery-light">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-2xl font-semibold">
                            <Image
                                src="/logo-lazy-bread.png"
                                alt="Lazy Bread PDX — Home"
                                className="w-28 h-28 hover:animate-warm-glow transition-all duration-300"
                                width={112}
                                height={112}
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:block" aria-label="Main">
                        <div className="flex items-center gap-10">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.path}
                                        className={`relative py-2 text-lg font-body font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:text-bakery-primary after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-bakery-primary after:transition-all after:duration-200 ${
                                            isActive
                                                ? 'text-bakery-primary after:w-full'
                                                : 'text-earth-brown hover:text-bakery-primary after:w-0 hover:after:w-full'
                                        }`}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            type="button"
                            className="text-earth-brown hover:text-bakery-primary transition-colors duration-300"
                            onClick={toggleMenu}
                            aria-label={isOpen ? "Close menu" : "Open menu"}
                            aria-expanded={isOpen}
                            aria-controls="mobile-nav-menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div
                    id="mobile-nav-menu"
                    className={`${
                        isOpen ? 'block' : 'hidden'
                    } md:hidden bg-white py-4 px-4 border-t border-bakery-light shadow-bakery`}
                    hidden={!isOpen}
                >
                    <div className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.path;
                            return (
                                <Link
                                    href={item.path}
                                    className={`block py-3 px-4 rounded-md text-base font-body font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:bg-warm-cream ${
                                        isActive
                                            ? 'text-bakery-primary bg-warm-cream'
                                            : 'text-earth-brown hover:text-bakery-primary hover:bg-warm-cream'
                                    }`}
                                    onClick={toggleMenu}
                                    key={item.name}
                                    aria-current={isActive ? "page" : undefined}
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
