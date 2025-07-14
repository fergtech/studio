"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface CreateInitiativeModalState {
  isOpen: boolean;
  initialDescription: string | null;
}

interface ModalContextType {
  createInitiativeModal: CreateInitiativeModalState;
  openCreateInitiativeModal: (description?: string) => void;
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
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [createInitiativeModal, setCreateInitiativeModal] = useState<CreateInitiativeModalState>({
    isOpen: false,
    initialDescription: null,
  });
  const [createIssueModal, setCreateIssueModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [createIdeaModal, setCreateIdeaModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [createSocietyModal, setCreateSocietyModal] = useState<{ isOpen: boolean }>({ isOpen: false });

  const openCreateInitiativeModal = (description?: string) => {
    setCreateInitiativeModal({
      isOpen: true,
      initialDescription: description || null,
    });
  };

  const closeCreateInitiativeModal = () => {
    setCreateInitiativeModal({
      isOpen: false,
      initialDescription: null, // Clear description on close
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
