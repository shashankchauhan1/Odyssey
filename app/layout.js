import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Odyssey',
  description: 'The Unified Travel Orchestrator',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}
        >
          {/* --- GLOBAL NAVBAR --- */}
          <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  O
                </span>
                <span>Odyssey</span>
              </Link>

              {/* Links & Auth Buttons */}
              <div className="flex items-center gap-6 text-sm font-semibold">
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
                    <button className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 transition shadow-sm">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </nav>
          {/* --------------------- */}

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
