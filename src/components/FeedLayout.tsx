import type React from 'react';
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/toaster"


export function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:px-6">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
