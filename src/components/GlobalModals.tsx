"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateInitiativeForm } from '@/components/CreateInitiativeForm';
import { IssueForm } from '@/components/IssueForm';
import { IdeaForm } from '@/components/IdeaForm';
import { CreateSocietyForm } from '@/components/CreateSocietyForm';
import { CreateDebateTopicForm } from '@/components/CreateDebateTopicForm';
import { useModal } from '@/context/ModalContext';

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
    </>
  );
}