"use client";

import { useState, useEffect } from 'react';
import AppSidebar from '@/components/AppSidebar';
import EditProfileClient from './EditProfileClient';
import { User } from '@prisma/client';

interface EditProfileSidebarClientProps {
  user: User;
}

export default function EditProfileSidebarClient({ user }: EditProfileSidebarClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('sidebarCollapsed:profile-edit');
      if (stored !== null) return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed:profile-edit', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar
        className="hidden lg:flex"
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'profile-edit' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-32 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'}`}>
        <EditProfileClient user={user} />
      </div>
    </div>
  );
}