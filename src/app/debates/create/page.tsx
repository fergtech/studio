"use client";

import { useRouter } from 'next/navigation';
import { CreateDebateTopicForm } from '@/components/CreateDebateTopicForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';

export default function CreateDebatePage() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

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
          <h1 className="text-xl font-semibold">Create New Debate Topic</h1>
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

      {/* Scrollable form content - mimics modal content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <CreateDebateTopicForm />
        </div>
      </div>
    </div>
  );
}
