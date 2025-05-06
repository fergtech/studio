import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header'; // Import Header directly
import { Toaster } from "@/components/ui/toaster"; // Keep Toaster if needed globally
import AuthProvider from "@/components/AuthProvider"; // Import the AuthProvider

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
    <html lang="en" className="dark">
      <head>
        {/* Keep font links or other head elements if needed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground"> 
        <AuthProvider> {/* Wrap content with AuthProvider */}
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 md:px-6"> {/* Keep main styling */}
            {children}
          </main>
          <Toaster /> {/* Keep Toaster */}
        </AuthProvider>
      </body>
    </html>
  );
}