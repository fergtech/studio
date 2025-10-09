"use client";

import { useState } from 'react';
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';
import EditProfileForm from './EditProfileForm';
import { User } from '@prisma/client';

interface EditProfileClientProps {
  user: User;
}

export default function EditProfileClient({ user }: EditProfileClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'profile-edit' }));

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar 
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'profile-edit' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 px-4 lg:px-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="mx-auto py-8">
          <div className="max-w-4xl mx-auto mt-12">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Edit Your Profile</h1>
            <EditProfileForm user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}