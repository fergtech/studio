import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { FeedLayout } from '@/components/FeedLayout'; // Import FeedLayout

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Impact Labs',
  description: 'Hyperlocal collaboration platform for Aberdeen Proving Ground',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <FeedLayout> {/* Wrap children with FeedLayout */}
          {children}
        </FeedLayout>
      </body>
    </html>
  );
}
