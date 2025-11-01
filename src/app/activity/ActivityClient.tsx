"use client";

import { useState } from 'react';
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';
import ActivityFeed from '@/components/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp } from 'lucide-react';

interface ActivityClientProps {
  userId: string;
}

export default function ActivityClient({ userId }: ActivityClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'activity' }));

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar 
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'activity' }}
        onCollapseChange={setSidebarCollapsed}
      />
      <div className={`transition-all duration-300 px-4 lg:px-6 pt-20 lg:pt-6 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="container mx-auto py-8 max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Activity Feed</h1>
                <p className="text-muted-foreground">
                  See what's happening in your network
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Activity Feed */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityFeed />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Network</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Following</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Followers</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Initiatives</span>
                      <span className="font-medium">-</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">💡 Follow more users to see their activities</p>
                      <p className="mb-2">💡 Join initiatives to stay updated</p>
                      <p className="mb-2">💡 Share your progress to inspire others</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}