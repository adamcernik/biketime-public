'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import { useState, useEffect, useRef } from 'react';

export default function UserAuthButton() {
    const { shopUser, loading, signOutUser } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-700 animate-pulse"></div>
            </div>
        );
    }

    if (!shopUser) {
        return (
            <div className="flex items-center gap-3">
                <Link
                    href="/login"
                    className="hover:text-white transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Přihlášení
                </Link>
            </div>
        );
    }

    const displayName = shopUser.firstName || shopUser.displayName || shopUser.email.split('@')[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:text-white transition-colors"
            >
                {shopUser.photoURL ? (
                    <Image
                        src={shopUser.photoURL}
                        alt={displayName}
                        width={24}
                        height={24}
                        className="rounded-full"
                    />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xs font-medium">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="hidden sm:inline">{displayName}</span>
                <svg
                    className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{shopUser.email}</p>
                        {shopUser.priceLevel && (
                            <p className="text-xs text-primary font-medium mt-1">
                                Cenová skupina: {shopUser.priceLevel}
                            </p>
                        )}
                    </div>
                    {shopUser.companyName && (
                        <div className="px-4 py-2 border-b border-gray-200">
                            <p className="text-xs text-gray-500">Firma</p>
                            <p className="text-sm text-gray-900">{shopUser.companyName}</p>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            signOutUser();
                            setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Odhlásit se
                    </button>
                </div>
            )}
        </div>
    );
}
