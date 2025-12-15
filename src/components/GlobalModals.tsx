"use client";

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useModal } from '@/context/ModalContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// CreateInitiativeForm no longer used in modal - moved to dedicated route /initiatives/create
// const CreateInitiativeForm = dynamic(() => import('@/components/CreateInitiativeForm').then(mod => ({ default: mod.CreateInitiativeForm })), {
//   ssr: false,
//   loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
// });

const IssueForm = dynamic(() => import('@/components/IssueForm').then(mod => ({ default: mod.IssueForm })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

const IdeaForm = dynamic(() => import('@/components/IdeaForm').then(mod => ({ default: mod.IdeaForm })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

// CreateSocietyForm no longer used in modal - moved to dedicated route /societies/create
// const CreateSocietyForm = dynamic(() => import('@/components/CreateSocietyForm').then(mod => ({ default: mod.CreateSocietyForm })), {
//   ssr: false,
//   loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
// });

// CreateDebateTopicForm no longer used in modal - moved to dedicated route /debates/create
// const CreateDebateTopicForm = dynamic(() => import('@/components/CreateDebateTopicForm').then(mod => ({ default: mod.CreateDebateTopicForm })), {
//   ssr: false,
//   loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
// });

// CreatePostForm no longer used in modal - moved to dedicated route /posts/create
// const CreatePostForm = dynamic(() => import('@/components/CreatePostForm'), {
//   ssr: false,
//   loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
// });

const CreatePostForm = dynamic(() => import('@/components/CreatePostForm'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

export function GlobalModals() {
  const router = useRouter();
  const {
    createInitiativeModal,
    closeCreateInitiativeModal,
    createIssueModal,
    closeCreateIssueModal,
    createIdeaModal,
    closeCreateIdeaModal,
    createSocietyModal,
    closeCreateSocietyModal,
    createDebateTopicModal,
    closeCreateDebateTopicModal,
    createBattleResponseModal,
    closeCreateBattleResponseModal,
    createTopicPostModal,
    closeCreateTopicPostModal,
  } = useModal();

  // Add handler to emit custom event for feed update AND refresh server data
  const handleFeedItemCreated = (item: any) => {
    window.dispatchEvent(new CustomEvent('feed:itemCreated', { detail: item }));
    router.refresh(); // Refresh server data for widgets and counts
  };

  return (
    <>
      {/* Create Initiative Modal - DISABLED: Now uses dedicated route /initiatives/create */}
      {/* <Dialog open={createInitiativeModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateInitiativeModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="sticky top-0 z-50 bg-background border-b px-6 py-4 flex flex-row items-center justify-between">
            <DialogTitle>Create New Initiative</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={closeCreateInitiativeModal}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 pb-6">
            <CreateInitiativeForm 
              setOpen={closeCreateInitiativeModal} 
              onCreated={handleFeedItemCreated}
              initialTitle={createInitiativeModal.initialTitle}
              initialDescription={createInitiativeModal.initialDescription}
              initialImageUrl={createInitiativeModal.initialImageUrl}
              originatingIssueId={createInitiativeModal.originatingIssueId}
              originatingIdeaId={createInitiativeModal.originatingIdeaId}
            />
          </div>
        </DialogContent>
      </Dialog> */}

      {/* Create Issue Modal */}
      <Dialog open={createIssueModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateIssueModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
          </DialogHeader>
          <IssueForm setOpen={closeCreateIssueModal} onCreated={handleFeedItemCreated} />
        </DialogContent>
      </Dialog>

      {/* Create Idea Modal */}
      <Dialog open={createIdeaModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateIdeaModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Idea</DialogTitle>
          </DialogHeader>
          <IdeaForm setOpen={closeCreateIdeaModal} onCreated={handleFeedItemCreated} />
        </DialogContent>
      </Dialog>

      {/* Create Society Modal - DISABLED: Now uses dedicated route /societies/create */}
      {/* <Dialog open={createSocietyModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateSocietyModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Society</DialogTitle>
          </DialogHeader>
          <CreateSocietyForm setOpen={closeCreateSocietyModal} onCreated={handleFeedItemCreated} />
        </DialogContent>
      </Dialog> */}

      {/* Create Debate Topic Modal - DISABLED: Now uses dedicated route /debates/create */}
      {/* <Dialog open={createDebateTopicModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateDebateTopicModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Debate Topic</DialogTitle>
          </DialogHeader>
          <CreateDebateTopicForm setOpen={closeCreateDebateTopicModal} onCreated={handleFeedItemCreated} />
        </DialogContent>
      </Dialog> */}

      {/* Create Battle Response Modal - KEPT: Special context, not a standalone creation */}
      <Dialog open={createBattleResponseModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateBattleResponseModal()}>
        <DialogContent
          className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            // Prevent closing when clicking inside Popovers
            const target = e.target as HTMLElement;
            if (target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              🔥 Add Your Take
              {createBattleResponseModal.battleTitle && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  Responding to: {createBattleResponseModal.battleTitle}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <CreatePostForm
            onSuccess={() => {
              closeCreateBattleResponseModal();
              handleFeedItemCreated({}); // Trigger feed refresh
            }}
            battleContext={{
              battleId: createBattleResponseModal.battleId!,
              battleTitle: createBattleResponseModal.battleTitle
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Create Topic Post Modal - DISABLED: Now uses dedicated route /posts/create */}
      {/* <Dialog open={createTopicPostModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateTopicPostModal()}>
        <DialogContent
          className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            // Prevent closing when clicking inside Popovers
            const target = e.target as HTMLElement;
            if (target.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              💬 Create Post
              {createTopicPostModal.topic && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  About: #{createTopicPostModal.topic}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <CreatePostForm
            onSuccess={() => {
              closeCreateTopicPostModal();
              handleFeedItemCreated({}); // Trigger feed refresh
            }}
            initialTopic={createTopicPostModal.topic}
          />
        </DialogContent>
      </Dialog> */}
    </>
  );
}