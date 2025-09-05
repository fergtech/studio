"use client";

import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MessageCircle, Lightbulb, AlertTriangle, Target } from 'lucide-react';

interface SocietyStats {
  generalPosts: number;
  ideaPosts: number;
  issuePosts: number;
  initiatives: number;
}

interface LazySocietyStatsProps {
  societyId: string;
  stats?: SocietyStats | null;
}

export function LazySocietyStats({ societyId, stats: passedStats }: LazySocietyStatsProps) {
  const fetchStats = async (): Promise<SocietyStats> => {
    const response = await fetch(`/api/societies/${societyId}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    return response.json();
  };

  const { ref, data: lazyStats, loading, error } = useLazyLoad<SocietyStats>(fetchStats);
  
  // Use passed stats if available, otherwise use lazy loaded stats
  const stats = passedStats || lazyStats;

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-8 w-12 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const statItems = stats ? [
    {
      title: "General Posts",
      value: stats.generalPosts,
      icon: MessageCircle,
      color: "text-blue-600"
    },
    {
      title: "Ideas",
      value: stats.ideaPosts,
      icon: Lightbulb,
      color: "text-yellow-600"
    },
    {
      title: "Issues",
      value: stats.issuePosts,
      icon: AlertTriangle,
      color: "text-red-600"
    },
    {
      title: "Initiatives",
      value: stats.initiatives,
      icon: Target,
      color: "text-green-600"
    }
  ] : [];

  return (
    <div ref={ref}>
      {loading && !passedStats && renderLoadingSkeleton()}
      
      {error && (
        <Card className="p-4">
          <p className="text-red-500 text-sm">Failed to load stats: {error}</p>
        </Card>
      )}
      
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${item.color}`} />
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{item.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}