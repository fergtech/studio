
"use client";

import AppSidebar from '@/components/AppSidebar';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default function SocietiesPage() {
  const [societies, setSocieties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('sidebarCollapsed:societies');
      if (stored !== null) return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
        const res = await fetch(`${baseUrl}/api/societies`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSocieties(data);
        }
      } catch (error) {
        console.error('Error fetching societies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocieties();
  }, []);

  if (loading) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <AppSidebar
          className="hidden lg:flex"
          widgets={['userControls', 'navigation', 'resources', 'footer']}
          context={{ type: 'societies' }}
          onCollapseChange={(collapsed: boolean) => {
            setSidebarCollapsed(collapsed);
            if (typeof window !== 'undefined') {
              localStorage.setItem('sidebarCollapsed:societies', String(collapsed));
            }
          }}
        />
        <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-32 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
        }`}>
          <div className="max-w-4xl mx-auto py-10">
            <div className="text-center">Loading societies...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar
        className="hidden lg:flex"
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'societies' }}
        onCollapseChange={(collapsed: boolean) => {
          setSidebarCollapsed(collapsed);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed:societies', String(collapsed));
          }
        }}
      />
      <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-32 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-4xl mx-auto py-10">
          <h1 className="text-3xl font-bold mb-6">All Societies</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {societies.length > 0 ? societies.map((society: any) => (
              <Link key={society.id} href={`/societies/${society.id}`} className="block bg-card rounded-lg shadow p-4 hover:ring-2 hover:ring-primary transition">
                {society.image && (
                  <div className="mb-2 w-full h-32 relative">
                    <Image src={society.image} alt={society.name} fill className="object-cover rounded" />
                  </div>
                )}
                <div className="font-semibold text-lg mb-1">{society.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{society.description}</div>
              </Link>
            )) : (
              <div className="col-span-full text-center text-muted-foreground">No societies found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 