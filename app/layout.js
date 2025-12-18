import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Odyssey',
  description: 'The Unified Travel Orchestrator',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-gray-50 text-gray-900">
          
          {/* --- GLOBAL NAVBAR --- */}
          <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-8 h-16 flex justify-between items-center">
              {/* Logo */}
              <Link href="/" className="text-xl font-extrabold text-slate-900 tracking-tight">
                Odyssey 🌍
              </Link>

              {/* Links & Auth Buttons */}
              <div className="flex gap-6 text-sm font-medium items-center">
                <Link href="/" className="text-gray-500 hover:text-slate-900 transition">
                  Explore
                </Link>
                
                {/* Only show "My Trips" if logged in */}
                <SignedIn>
                  <Link href="/my-trips" className="text-gray-500 hover:text-slate-900 transition">
                    My Trips
                  </Link>
                  {/* The User Profile Circle */}
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>

                {/* Show "Sign In" if logged out */}
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition">
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