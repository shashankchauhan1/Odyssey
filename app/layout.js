// In the layout file all the components that are gonna use in each and every page is written.


import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

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
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
