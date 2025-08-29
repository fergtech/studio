"use client";

import React, { useState } from 'react';
import AppSidebar from '@/components/AppSidebar';

interface IdeaClientProps {
  idea: {
    id: string;
    title: string;
    description: string;
  };
}

export default function IdeaClient({ idea }: IdeaClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar 
        widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
        context={{ type: 'idea' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 px-4 lg:px-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-2xl mx-auto py-10 px-4">
          <h1 className="text-2xl font-bold mb-4">Idea</h1>
          <div className="bg-card rounded-lg shadow p-6">
            <div className="text-lg font-semibold mb-2">{idea.title}</div>
            <div className="text-base text-muted-foreground">{idea.description}</div>
            {/* Add more idea details here if needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
