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
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [createInitiativeModal, setCreateInitiativeModal] = useState<CreateInitiativeModalState>({
    isOpen: false,
    initialDescription: null,
  });

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

  return (
    <ModalContext.Provider value={{ createInitiativeModal, openCreateInitiativeModal, closeCreateInitiativeModal }}>
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
