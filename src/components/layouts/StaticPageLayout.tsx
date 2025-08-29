"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface StaticPageLayoutProps {
  title: string;
  children: React.ReactNode;
  breadcrumb?: {
    label: string;
    href: string;
  };
}

export function StaticPageLayout({ title, children, breadcrumb }: StaticPageLayoutProps) {

  return (
    <div className="min-h-screen bg-background">

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl pt-20">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
          <div className="h-1 w-16 bg-primary rounded-full"></div>
        </div>

        {/* Page Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {children}
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Button asChild variant="link" size="sm">
              <Link href="/about">About</Link>
            </Button>
            <span>•</span>
            <Button asChild variant="link" size="sm">
              <Link href="/privacy">Privacy</Link>
            </Button>
            <span>•</span>
            <Button asChild variant="link" size="sm">
              <Link href="/help">Help</Link>
            </Button>
            <span>•</span>
            <Button asChild variant="link" size="sm">
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}