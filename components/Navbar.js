'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* logo */}
        <Link 
          href="/" 
          className="flex items-center gap-2 text-base sm:text-lg font-extrabold tracking-tight text-slate-900"
          onClick={closeMobileMenu}
        >
          <span className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm text-sm sm:text-base">
            O
          </span>
          <span className="">Odyssey</span>
        </Link>

        {/* laptop/desktop navigation */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <Link href="/" className="text-slate-600 hover:text-slate-900 transition">
            Explore
          </Link>
          <Link href="/logistics" className="text-slate-600 hover:text-slate-900 transition">
            Logistics
          </Link>

          <SignedIn>
            <Link href="/my-trips" className="text-slate-600 hover:text-slate-900 transition">
              My Trips
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 transition shadow-sm text-sm">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* mobile: user button / Sign In (always visible) */}
        <div className="flex md:hidden items-center gap-3">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-xl bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800 transition shadow-sm text-xs">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          {/* hamburger button */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 transition"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              onClick={closeMobileMenu}
            >
              Explore
            </Link>
            <Link
              href="/logistics"
              className="block py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
              onClick={closeMobileMenu}
            >
              Logistics
            </Link>
            <SignedIn>
              <Link
                href="/my-trips"
                className="block py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                onClick={closeMobileMenu}
              >
                My Trips
              </Link>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
}

