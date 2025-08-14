"use client";

import Link from "next/link";
import Image from 'next/image';
import {  useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, AUTH_NAV_ITEMS } from "@/config/app-config";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./auth/AuthModal";
import UserProfileDropdown from "./auth/UserProfile";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, logout } = useAuth();
    const userDropdownRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleAuthClick = (mode: 'signin' | 'signup') => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    const handleUserClick = () => {
        setShowUserProfile(true);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setShowUserProfile(false);
            }
        };

        if (showUserProfile) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserProfile]);

    return (
        <>
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
                            {(currentUser ? AUTH_NAV_ITEMS : NAV_ITEMS).map((item) => {
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
                            
                            {/* Authentication */}
                            <div className="flex items-center space-x-4">
                                {currentUser ? (
                                    <div className="relative" ref={userDropdownRef}>
                                        <button
                                            onClick={handleUserClick}
                                            className="flex items-center space-x-2 px-4 py-2 rounded-md text-lg font-body font-medium text-earth-brown hover:text-bakery-primary hover:bg-warm-cream transition-colors duration-300"
                                            title="Account & Settings"
                                        >
                                            <div className="w-8 h-8 bg-bakery-primary rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                            <span className="hidden sm:inline">{currentUser.displayName || 'Account'}</span>
                                        </button>
                                        {showUserProfile && (
                                            <UserProfileDropdown onClose={() => setShowUserProfile(false)} />
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleAuthClick('signin')}
                                            className="px-2 py-2 bg-bakery-primary text-white px-6 py-3 rounded-md hover:bg-bakery-primary-dark transition-colors font-medium"
                                        >
                                            Sign In
                                        </button>
                                    </>
                                )}
                            </div>
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
                        {(currentUser ? AUTH_NAV_ITEMS : NAV_ITEMS).map((item) => {
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
                        
                        {/* Mobile Authentication */}
                        <div className="border-t pt-3 mt-3">
                            {currentUser ? (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            router.push('/dashboard');
                                            toggleMenu();
                                        }}
                                        className="w-full text-left py-3 px-4 rounded-md text-base font-body font-medium text-earth-brown hover:text-bakery-primary hover:bg-warm-cream transition-colors duration-300 flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <span>My Dashboard</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            logout();
                                            toggleMenu();
                                        }}
                                        className="w-full text-left py-3 px-4 rounded-md text-base font-body font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors duration-300 flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            handleAuthClick('signin');
                                            toggleMenu();
                                        }}
                                        className="w-full py-3 px-4 rounded-md text-base font-body font-medium text-earth-brown hover:text-bakery-primary hover:bg-warm-cream transition-colors duration-300"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleAuthClick('signup');
                                            toggleMenu();
                                        }}
                                        className="w-full py-3 px-4 bg-bakery-primary text-white rounded-md text-base font-body font-medium hover:bg-bakery-primary-dark transition-colors duration-300"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>

        {/* Authentication Modal */}
        <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authMode}
        />
    </>
    );
}
