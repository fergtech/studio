'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import type { Initiative, Milestone } from "@/lib/types";

interface MissionProgressBannerProps {
  initiative: Initiative;
  milestones: Milestone[];
  onContributeClick?: () => void;
  isMember?: boolean;
}

export function MissionProgressBanner({ initiative, milestones, onContributeClick, isMember = false }: MissionProgressBannerProps) {
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const milestoneProgress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
  // Use initiative.progress if available, otherwise fallback to milestone-based progress
  const progress = typeof initiative.progress === 'number' && initiative.progress !== null
    ? initiative.progress
    : milestoneProgress;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1 max-w-3xl">
            <h2 className="text-xl font-semibold">Group Progress</h2>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              {completedMilestones} of {milestones.length} milestones completed
            </p>
          </div>
          {!isMember && onContributeClick && (
            <Button
              onClick={onContributeClick}
              className="bg-primary text-white hover:bg-primary/90 flex-shrink-0"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Participate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 