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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-sky-500 selection:text-slate-950"
      >
        <Navbar />
        <main className="flex-1 flex flex-col relative">{children}</main>
      </body>
    </html>
  );
}
