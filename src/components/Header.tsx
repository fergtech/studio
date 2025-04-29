"use client";

import Link from "next/link";
import { PlusCircle, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* Placeholder Logo */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="text-lg font-semibold text-foreground">Impact Labs</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label="Home Feed">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
             <Link href="/initiatives/create" className="flex items-center gap-1">
               <PlusCircle className="h-4 w-4" />
               <span>Create Initiative</span>
             </Link>
          </Button>
           {/* Placeholder for Profile Button */}
          <Button variant="ghost" size="icon" disabled>
             <User className="h-5 w-5" />
             <span className="sr-only">Profile</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
