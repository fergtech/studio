"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface CreateInitiativeModalState {
  isOpen: boolean;
  initialTitle: string | null;
  initialDescription: string | null;
  initialImageUrl: string | null;
  originatingIssueId?: string | null;
  originatingIdeaId?: string | null;
}

interface ModalContextType {
  createInitiativeModal: CreateInitiativeModalState;
  openCreateInitiativeModal: (title?: string, description?: string, imageUrl?: string, originatingIssueId?: string, originatingIdeaId?: string) => void;
  closeCreateInitiativeModal: () => void;
  // New for Issues
  createIssueModal: { isOpen: boolean };
  openCreateIssueModal: () => void;
  closeCreateIssueModal: () => void;
  // New for Ideas
  createIdeaModal: { isOpen: boolean };
  openCreateIdeaModal: () => void;
  closeCreateIdeaModal: () => void;
  // New for Societies
  createSocietyModal: { isOpen: boolean };
  openCreateSocietyModal: () => void;
  closeCreateSocietyModal: () => void;
  // New for Debate Topics
  createDebateTopicModal: { isOpen: boolean };
  openCreateDebateTopicModal: () => void;
  closeCreateDebateTopicModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [createInitiativeModal, setCreateInitiativeModal] = useState<CreateInitiativeModalState>({
    isOpen: false,
    initialTitle: null,
    initialDescription: null,
    initialImageUrl: null,
  });
  const [createIssueModal, setCreateIssueModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [createIdeaModal, setCreateIdeaModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [createSocietyModal, setCreateSocietyModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [createDebateTopicModal, setCreateDebateTopicModal] = useState<{ isOpen: boolean }>({ isOpen: false });

  const openCreateInitiativeModal = (title?: string, description?: string, imageUrl?: string, originatingIssueId?: string, originatingIdeaId?: string) => {
    setCreateInitiativeModal({
      isOpen: true,
      initialTitle: title || null,
      initialDescription: description || null,
      initialImageUrl: imageUrl || null,
      originatingIssueId: originatingIssueId || null,
      originatingIdeaId: originatingIdeaId || null,
    });
  };

  const closeCreateInitiativeModal = () => {
    setCreateInitiativeModal({
      isOpen: false,
      initialTitle: null,
      initialDescription: null,
      initialImageUrl: null,
      originatingIssueId: null,
      originatingIdeaId: null,
    });
  };

  const openCreateIssueModal = () => {
    setCreateIssueModal({ isOpen: true });
  };

  const closeCreateIssueModal = () => {
    setCreateIssueModal({ isOpen: false });
  };

  const openCreateIdeaModal = () => {
    setCreateIdeaModal({ isOpen: true });
  };

  const closeCreateIdeaModal = () => {
    setCreateIdeaModal({ isOpen: false });
  };

  const openCreateSocietyModal = () => {
    setCreateSocietyModal({ isOpen: true });
  };

  const closeCreateSocietyModal = () => {
    setCreateSocietyModal({ isOpen: false });
  };

  const openCreateDebateTopicModal = () => {
    setCreateDebateTopicModal({ isOpen: true });
  };

  const closeCreateDebateTopicModal = () => {
    setCreateDebateTopicModal({ isOpen: false });
  };

  return (
    <ModalContext.Provider value={{
      createInitiativeModal,
      openCreateInitiativeModal,
      closeCreateInitiativeModal,
      createIssueModal,
      openCreateIssueModal,
      closeCreateIssueModal,
      createIdeaModal,
      openCreateIdeaModal,
      closeCreateIdeaModal,
      createSocietyModal,
      openCreateSocietyModal,
      closeCreateSocietyModal,
      createDebateTopicModal,
      openCreateDebateTopicModal,
      closeCreateDebateTopicModal,
    }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
