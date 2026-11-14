import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TerraSync — Space Apps Agricultural Resilience Platform',
  description:
    'Leveraging Open Science Data (NASA POWER & EONET) for Agricultural Resilience in Dadu, Sindh, Pakistan via Machine Learning Predictions and Automated Farmer Email Alerts.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="h-full w-full bg-[#f4f7f6] text-slate-900 flex flex-row font-sans overflow-hidden antialiased selection:bg-amber-500 selection:text-white"
      >
        {/* Full-Height Left Navigation Dock */}
        <Navbar />

        {/* Fullscreen Edge-to-Edge Main Canvas */}
        <main className="flex-1 h-screen overflow-hidden flex flex-col min-w-0 bg-[#f4f7f6] relative">
          {children}
        </main>
      </body>
    </html>
  );
}
