import type React from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";


interface FeedLayoutProps {
  children: React.ReactNode;
}

export function FeedLayout({ children }: FeedLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6 pt-20 lg:pt-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
