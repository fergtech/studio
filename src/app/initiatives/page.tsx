"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Target, Users, Calendar, Filter, Grid, Layers } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import { InitiativeCard } from '@/components/InitiativeCard';
import { useIsMobile } from '@/hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { TikTokStyleFeed } from '@/components/initiatives/TikTokStyleFeed';
import { DesktopInitiativesView } from '@/components/initiatives/DesktopInitiativesView';

export const dynamic = 'force-dynamic';

interface Initiative {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    members: number;
  };
}

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'tiktok'>('tiktok'); // New state for view mode
  const { openCreateInitiativeModal } = useModal();
  const isMobile = useIsMobile();

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch initiatives when debounced search term or other filters change
  useEffect(() => {
    fetchInitiatives();
  }, [debouncedSearchTerm, sortBy, sortOrder]);

  // Listen for new initiatives created via modal
  useEffect(() => {
    const handleFeedItemCreated = (event: CustomEvent) => {
      const item = event.detail;
      // If it's an initiative, refresh the list
      if ('status' in item && 'roles' in item) {
        fetchInitiatives();
      }
    };
    
    window.addEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    return () => {
      window.removeEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    };
  }, []);

  const fetchInitiatives = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const res = await fetch(`${baseUrl}/api/initiatives?${params}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        // Data is now directly the initiatives array (like societies)
        setInitiatives(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <div className="px-4 lg:px-6 pt-20 lg:pt-6 pb-32">
          <div className="max-w-6xl mx-auto py-10">
            <div className="text-center">Loading initiatives...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className={`transition-all duration-300 ${
        isMobile
          ? 'pt-0' // No padding for mobile full-screen experience
          : 'px-4 lg:px-6 pt-20 lg:pt-6 pb-32'
      }`}>
        {isMobile ? (
          // Mobile: TikTok-style full-screen feed
          <TikTokStyleFeed 
            initiatives={initiatives} 
            onRefresh={fetchInitiatives} 
          />
        ) : (
          // Desktop: Traditional layout with optional view modes
          <DesktopInitiativesView
            initiatives={initiatives}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            viewMode={viewMode}
            setViewMode={setViewMode}
            debouncedSearchTerm={debouncedSearchTerm}
            openCreateInitiativeModal={openCreateInitiativeModal}
          />
        )}
      </div>
    </div>
  );
}