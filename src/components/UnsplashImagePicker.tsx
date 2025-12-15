"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
}

interface UnsplashImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (photo: UnsplashPhoto) => void;
}

export function UnsplashImagePicker({ isOpen, onClose, onSelect }: UnsplashImagePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectingPhotoId, setSelectingPhotoId] = useState<string | null>(null);
  const { toast } = useToast();

  const searchPhotos = useCallback(async (query: string) => {
    if (!query.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term to find images.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(
        `/api/unsplash/search?query=${encodeURIComponent(query)}&perPage=30`
      );

      if (!response.ok) {
        throw new Error('Failed to search images');
      }

      const data = await response.json();
      setPhotos(data.results || []);

      if (data.results.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search term.",
        });
      }
    } catch (error) {
      console.error('Error searching Unsplash:', error);
      toast({
        title: "Search failed",
        description: "Could not fetch images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent form submission
    searchPhotos(searchQuery);
  };

  const handleSelectPhoto = async (photo: UnsplashPhoto) => {
    // Prevent duplicate selections
    if (selectingPhotoId) return;
    
    setSelectingPhotoId(photo.id);
    
    try {
      // Track download as required by Unsplash API guidelines
      await fetch('/api/unsplash/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadLocation: photo.links.download_location,
        }),
      });

      onSelect(photo);
      onClose();
      setSearchQuery('');
      setPhotos([]);
      setHasSearched(false);
      setSelectingPhotoId(null);
    } catch (error) {
      console.error('Error tracking download:', error);
      // Still allow selection even if tracking fails
      onSelect(photo);
      onClose();
      setSelectingPhotoId(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setPhotos([]);
    setHasSearched(false);
    setSelectingPhotoId(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Unsplash Images</DialogTitle>
          <DialogDescription>
            Find high-quality images for your debate topic. All images are free to use.
          </DialogDescription>
        </DialogHeader>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for images... (e.g., technology, nature, politics)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
              }
            }}
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !searchQuery.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </form>

        {/* Results Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`group relative aspect-video overflow-hidden rounded-lg border transition-all ${
                    selectingPhotoId === photo.id
                      ? 'ring-2 ring-primary border-primary scale-95'
                      : selectingPhotoId
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:border-primary hover:shadow-lg active:scale-95'
                  }`}
                  onClick={() => handleSelectPhoto(photo)}
                >
                  <Image
                    src={photo.urls.small}
                    alt={photo.alt_description || photo.description || 'Unsplash image'}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Overlay with photographer info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="text-xs font-medium truncate">
                        Photo by {photo.user.name}
                      </p>
                      <a
                        href={`${photo.user.links.html}?utm_source=studio&utm_medium=referral`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-white/80 hover:text-white inline-flex items-center gap-1"
                      >
                        @{photo.user.username}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No images found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Start searching for images</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enter a keyword above to find high-quality images
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Footer with Unsplash attribution */}
        <div className="border-t pt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>Powered by</span>
            <a
              href="https://unsplash.com?utm_source=studio&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground inline-flex items-center gap-1"
            >
              Unsplash
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
