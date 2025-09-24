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
        {/* Keep font links or other head elements if needed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden"> 
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SessionProvider refetchInterval={0} refetchOnWindowFocus={false} refetchWhenOffline={false}>
            <QueryProvider>
              <AuthProvider>
                <ModalProvider>
                  <ConditionalHeader />
                  <main className="flex-grow overflow-x-hidden"> {/* Removed py-8 padding for pages with AppSidebar */}
                    {children}
                  </main>
                  <GlobalModals /> {/* Global modal dialogs */}
                  <Toaster /> {/* Keep Toaster */}
                </ModalProvider>
              </AuthProvider>
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
