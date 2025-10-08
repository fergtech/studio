'use client';

import { useState } from 'react';
import { AllTopicsClient } from './AllTopicsClient';
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';

export default function BrowseTopicsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'topics' }));

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'topics' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 px-4 lg:px-6 pt-20 lg:pt-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <AllTopicsClient />
      </div>
    </div>
  );
}
