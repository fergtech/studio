"use client";


import { useRouter, useSearchParams } from 'next/navigation';
import { CreateEventDialog } from '../../CreateEventDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import React from 'react';

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get initiativeId from the URL params (dynamic route)
  // In the new app dir, use params from the page function
  // But fallback to searchParams if needed
  // We'll use a workaround for now
  // TODO: If using app router, get params from props
  const initiativeId = searchParams.get("initiativeId") || "";

  // Fullscreen modal style, matching debates/create
  const handleClose = () => router.back();

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with close/back buttons */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-9 w-9 p-0 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <h1 className="text-xl font-semibold">Create New Event</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-9 w-9 p-0 hover:bg-muted"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <CreateEventDialog
            initiativeId={initiativeId}
            isOpen={true}
            onClose={handleClose}
            onEventCreated={handleClose}
          />
        </div>
      </div>
    </div>
  );
}
