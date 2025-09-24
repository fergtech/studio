"use client";

import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useModal } from '@/context/ModalContext';

const CreateInitiativeForm = dynamic(() => import('@/components/CreateInitiativeForm').then(mod => ({ default: mod.CreateInitiativeForm })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

const IssueForm = dynamic(() => import('@/components/IssueForm').then(mod => ({ default: mod.IssueForm })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

const IdeaForm = dynamic(() => import('@/components/IdeaForm').then(mod => ({ default: mod.IdeaForm })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

const CreateSocietyForm = dynamic(() => import('@/components/CreateSocietyForm').then(mod => ({ default: mod.CreateSocietyForm })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

const CreateDebateTopicForm = dynamic(() => import('@/components/CreateDebateTopicForm').then(mod => ({ default: mod.CreateDebateTopicForm })), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

const CreatePostForm = dynamic(() => import('@/components/CreatePostForm'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-96 rounded-md" />
});

export function GlobalModals() {
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
  } = useModal();

  // Add handler to emit custom event for feed update
  const handleFeedItemCreated = (item: any) => {
    window.dispatchEvent(new CustomEvent('feed:itemCreated', { detail: item }));
  };

  return (
    <>
      {/* Create Initiative Modal */}
      <Dialog open={createInitiativeModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateInitiativeModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Initiative</DialogTitle>
          </DialogHeader>
          <CreateInitiativeForm 
            setOpen={closeCreateInitiativeModal} 
            onCreated={handleFeedItemCreated}
            initialTitle={createInitiativeModal.initialTitle}
            initialDescription={createInitiativeModal.initialDescription}
            initialImageUrl={createInitiativeModal.initialImageUrl}
            originatingIssueId={createInitiativeModal.originatingIssueId}
            originatingIdeaId={createInitiativeModal.originatingIdeaId}
          />
        </DialogContent>
      </Dialog>

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

      {/* Create Society Modal */}
      <Dialog open={createSocietyModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateSocietyModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Society</DialogTitle>
          </DialogHeader>
          <CreateSocietyForm setOpen={closeCreateSocietyModal} onCreated={handleFeedItemCreated} />
        </DialogContent>
      </Dialog>

      {/* Create Debate Topic Modal */}
      <Dialog open={createDebateTopicModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateDebateTopicModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Debate Topic</DialogTitle>
          </DialogHeader>
          <CreateDebateTopicForm setOpen={closeCreateDebateTopicModal} onCreated={handleFeedItemCreated} />
        </DialogContent>
      </Dialog>

      {/* Create Battle Response Modal */}
      <Dialog open={createBattleResponseModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateBattleResponseModal()}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
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
    </>
  );
}