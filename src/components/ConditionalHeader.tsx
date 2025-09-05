"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Pages that should NOT show the header (pages with AppSidebar)
  const noHeaderPaths = [
    '/', // Main page (authenticated users)
    '/societies',
    '/initiatives',
    '/activity', 
    '/explore',
    '/chat/',
    '/profile/',
    '/debates/',
    '/issues/',
    '/ideas/',
    '/posts/'
  ];

  // Check if current path should hide header
  const shouldHideHeader = noHeaderPaths.some(path => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  });

  // Don't render header on pages with AppSidebar
  if (shouldHideHeader) {
    return null;
  }

  return <Header />;
}