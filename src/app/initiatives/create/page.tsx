"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateInitiativeForm } from '@/components/CreateInitiativeForm';

export default function CreateInitiativePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract query params for pre-filling
  const initialTitle = searchParams.get('title');
  const initialDescription = searchParams.get('description');
  const initialImageUrl = searchParams.get('imageUrl');
  const originatingIssueId = searchParams.get('originatingIssueId');
  const originatingIdeaId = searchParams.get('originatingIdeaId');

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with close button - full width */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-9 w-9 p-0 hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Create New Initiative</h1>
            {(originatingIssueId || originatingIdeaId) && (
              <p className="text-xs text-muted-foreground">
                {originatingIssueId && 'Addressing an issue'}
                {originatingIdeaId && 'Implementing an idea'}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-9 w-9 p-0 hover:bg-muted"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <CreateInitiativeForm
            initialTitle={initialTitle}
            initialDescription={initialDescription}
            initialImageUrl={initialImageUrl}
            originatingIssueId={originatingIssueId}
            originatingIdeaId={originatingIdeaId}
          />
        </div>
      </div>
    </div>
  );
}
