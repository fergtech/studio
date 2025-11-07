"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Lock, Trophy, Target, MessageSquare } from 'lucide-react';
import { UserUnlockStatus } from '@/lib/gamification';

interface UnlockProgressProps {
  unlockStatus: UserUnlockStatus;
  activityScore: number;
}

export function UnlockProgress({ unlockStatus, activityScore }: UnlockProgressProps) {
  const { societyProgress, initiativeProgress, societyUnlocked, initiativeUnlocked } = unlockStatus;

  return (
    <div className="space-y-4">
      {/* Activity Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Activity Score
          </CardTitle>
          <CardDescription>
            Earn points by engaging with debates, posting arguments, and contributing to the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{activityScore} points</div>
        </CardContent>
      </Card>

      {/* Society Unlock Progress */}
      <Card className={societyUnlocked ? 'border-green-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {societyUnlocked ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              Create Societies
            </CardTitle>
            {societyUnlocked && (
              <Badge variant="default" className="bg-green-500">Unlocked!</Badge>
            )}
          </div>
          <CardDescription>
            {societyUnlocked
              ? 'You can now create Societies to organize around popular debates!'
              : 'Engage with debates to unlock Society creation'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!societyUnlocked && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Activity Progress</span>
                  <span className="font-semibold">
                    {societyProgress.currentScore} / {societyProgress.requiredScore} points
                  </span>
                </div>
                <Progress value={societyProgress.progressPct} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground">
                Tip: Vote on debates, post arguments, and create content to earn points faster!
              </div>
            </>
          )}
          {societyUnlocked && societyProgress.currentScore > 0 && (
            <div className="text-sm text-green-600">
              ✓ Unlocked with {societyProgress.currentScore} activity points
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Unlock Progress */}
      <Card className={initiativeUnlocked ? 'border-green-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {initiativeUnlocked ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              Create Projects
            </CardTitle>
            {initiativeUnlocked && (
              <Badge variant="default" className="bg-green-500">Unlocked!</Badge>
            )}
          </div>
          <CardDescription>
            {initiativeUnlocked
              ? 'You can now create Projects to take real-world action!'
              : 'Prove deeper engagement to unlock Project creation'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!initiativeUnlocked && (
            <>
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Overall Progress</span>
                  <span className="font-semibold">{initiativeProgress.progressPct}%</span>
                </div>
                <Progress value={initiativeProgress.progressPct} className="h-2" />
              </div>

              {/* Individual Requirements */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Activity Score</span>
                  </div>
                  <span className={
                    initiativeProgress.currentScore >= initiativeProgress.requiredScore
                      ? 'text-green-600 font-semibold'
                      : 'text-muted-foreground'
                  }>
                    {initiativeProgress.currentScore >= initiativeProgress.requiredScore ? '✓ ' : ''}
                    {initiativeProgress.currentScore} / {initiativeProgress.requiredScore}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Debates Created</span>
                  </div>
                  <span className={
                    initiativeProgress.debatesCreated >= initiativeProgress.requiredDebates
                      ? 'text-green-600 font-semibold'
                      : 'text-muted-foreground'
                  }>
                    {initiativeProgress.debatesCreated >= initiativeProgress.requiredDebates ? '✓ ' : ''}
                    {initiativeProgress.debatesCreated} / {initiativeProgress.requiredDebates}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Arguments Posted</span>
                  </div>
                  <span className={
                    initiativeProgress.argumentsPosted >= initiativeProgress.requiredArguments
                      ? 'text-green-600 font-semibold'
                      : 'text-muted-foreground'
                  }>
                    {initiativeProgress.argumentsPosted >= initiativeProgress.requiredArguments ? '✓ ' : ''}
                    {initiativeProgress.argumentsPosted} / {initiativeProgress.requiredArguments}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2">
                Tip: Create debates and engage deeply with arguments to prove you're ready to lead initiatives!
              </div>
            </>
          )}
          {initiativeUnlocked && (
            <div className="text-sm text-green-600">
              ✓ Unlocked! You've proven deep community engagement
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
