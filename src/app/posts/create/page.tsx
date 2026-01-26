"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import CreatePostForm from '@/components/CreatePostForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || undefined;
  const battleId = searchParams.get('battleId') || undefined;
  const battleTitle = searchParams.get('battleTitle') || undefined;

  const handleClose = () => {
    router.back();
  };

  const battleContext = battleId ? {
    battleId,
    battleTitle: battleTitle || undefined
  } : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header with close button - mimics modal header */}
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
          <h1 className="text-xl font-semibold">
            {battleContext ? '🔥 Add Your Take' : '💬 Create Post'}
          </h1>
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

      {/* Context subtitle if applicable */}
      {(battleContext?.battleTitle || initialTopic) && (
        <div className="px-4 sm:px-6 py-2 border-b bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {battleContext?.battleTitle && `Responding to: ${battleContext.battleTitle}`}
            {initialTopic && `About: #${initialTopic}`}
          </p>
        </div>
      )}

      {/* Scrollable form content - blends seamlessly into page */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <CreatePostForm
            initialTopic={initialTopic}
            battleContext={battleContext}
            variant="seamless"
            onSuccess={() => {
              router.back();
              router.refresh();
            }}
          />
        </div>
      </div>
    </div>
  );
}
