"use client";

import './globals.css';
import { ConditionalHeader } from '@/components/ConditionalHeader'; // Import ConditionalHeader
import { GlobalModals } from '@/components/GlobalModals'; // Import GlobalModals
import { Toaster } from "@/components/ui/toaster"; // Keep Toaster if needed globally
import AuthProvider from "@/components/AuthProvider"; // Import the AuthProvider
import { ModalProvider } from "@/context/ModalContext"; // Import ModalProvider
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import QueryProvider from "@/providers/QueryProvider";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { BottomNavBar } from '@/components/layout/BottomNavBar';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        {/* Viewport meta tag - prevents auto-zoom on input focus while allowing manual zoom */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Keep font links or other head elements if needed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden"> 
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SessionProvider refetchInterval={0} refetchOnWindowFocus={false} refetchWhenOffline={false}>
              <QueryProvider>
                <AuthProvider>
                  <ModalProvider>
                    <NavigationProgress />
                    {/* <ConditionalHeader /> */}
                    <main className="flex-grow overflow-x-hidden">
                      {children}
                    </main>
                    <GlobalModals /> {/* Global modal dialogs */}
                    <Toaster /> {/* Keep Toaster */}
                    {/* Show BottomNavBar only on mobile/tablet, hide on desktop */}
                    <div className="block lg:hidden">
                      <BottomNavBar />
                    </div>
                  </ModalProvider>
                </AuthProvider>
              </QueryProvider>
            </SessionProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
