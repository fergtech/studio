"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Flame, Users, MessageCircle, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { HotTakeStance } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';

interface HotTakeBattleCardProps {
  battle: {
    id: string;
    topic: string;
    title: string;
    description?: string;
    createdAt: Date;
    totalParticipants: number;
    post1Supporters: number;
    post2Supporters: number;
    neutralTakes: number;
    post1: {
      id: string;
      content: string;
      creatorName: string;
      creatorAvatar?: string;
      timestamp: Date;
    };
    post2: {
      id: string;
      content: string;
      creatorName: string;
      creatorAvatar?: string;
      timestamp: Date;
    };
  };
  userParticipation?: {
    stance: HotTakeStance;
    takePostId?: string;
  } | null;
  onJoinBattle?: (battleId: string, stance: HotTakeStance) => Promise<void>;
  onCreateTake?: (battleId: string) => void;
  variant?: 'feed' | 'widget' | 'page';
}

export function HotTakeBattleCard({
  battle,
  userParticipation,
  onJoinBattle,
  onCreateTake,
  variant = 'feed'
}: HotTakeBattleCardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);

  // Early return if battle data is incomplete
  if (!battle?.post1 || !battle?.post2) {
    return null;
  }

  // Calculate percentages for visual representation
  const totalVotes = battle.post1Supporters + battle.post2Supporters;
  const post1Percentage = totalVotes > 0 ? Math.round((battle.post1Supporters / totalVotes) * 100) : 50;
  const post2Percentage = totalVotes > 0 ? Math.round((battle.post2Supporters / totalVotes) * 100) : 50;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleJoinTeam = async (stance: HotTakeStance) => {
    if (!session?.user?.id || !onJoinBattle) return;

    setIsJoining(true);
    try {
      const isCurrentlyOnThisTeam = userParticipation?.stance === stance;
      await onJoinBattle(battle.id, stance);

      const teamName = stance === HotTakeStance.SUPPORT_POST1 ?
        battle.post1.creatorName : battle.post2.creatorName;

      if (isCurrentlyOnThisTeam) {
        toast({
          title: "Left the team",
          description: `You're no longer on Team ${teamName}`,
        });
      } else {
        toast({
          title: "Joined the battle! 🔥",
          description: `You're now on Team ${teamName}`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to join battle",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const isCompact = variant === 'widget';
  const showFullContent = variant === 'page';

  if (isCompact) {
    return (
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 hover:from-orange-500/20 hover:to-red-500/20 transition-all cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-600">#{battle.topic}</span>
            <Badge variant="secondary" className="text-xs">
              {battle.totalParticipants}
            </Badge>
          </div>
          <p className="text-sm font-medium line-clamp-2">{battle.title}</p>
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <span>{battle.post1.creatorName} vs {battle.post2.creatorName}</span>
            <span>{formatDistanceToNow(battle.createdAt)} ago</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            <span className="font-bold text-lg">HOT TAKE BATTLE</span>
            <Zap className="h-4 w-4" />
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            #{battle.topic}
          </Badge>
        </div>
        <p className="text-sm opacity-90 mt-1">{battle.title}</p>
      </div>

      <CardContent className="p-4">
        {/* Battle Posts */}
        <div className="space-y-4">
          {/* Post 1 */}
          <div className={`border rounded-lg p-3 ${
            userParticipation?.stance === HotTakeStance.SUPPORT_POST1
              ? 'border-green-500 bg-green-500/5'
              : 'border-gray-200'
          }`}>
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={battle.post1?.creatorAvatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(battle.post1?.creatorName || 'Unknown')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{battle.post1?.creatorName || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">
                    {battle.post1?.timestamp ? formatDistanceToNow(battle.post1.timestamp) : '0'} ago
                  </span>
                </div>
                <p className={`text-sm ${showFullContent ? '' : 'line-clamp-2'}`}>
                  {battle.post1?.content || 'Content unavailable'}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{battle.post1Supporters} supporters ({post1Percentage}%)</span>
                  </div>
                  {session?.user?.id && (
                    <Button
                      size="sm"
                      variant={userParticipation?.stance === HotTakeStance.SUPPORT_POST1 ? "default" : "outline"}
                      onClick={() => handleJoinTeam(HotTakeStance.SUPPORT_POST1)}
                      disabled={isJoining}
                      className="h-6 px-2 text-xs"
                    >
                      {userParticipation?.stance === HotTakeStance.SUPPORT_POST1
                        ? `Leave Team ${battle.post1.creatorName.split(' ')[0]}`
                        : `Join Team ${battle.post1.creatorName.split(' ')[0]}`
                      }
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              <Zap className="h-4 w-4" />
              VS
              <Zap className="h-4 w-4" />
            </div>
          </div>

          {/* Post 2 */}
          <div className={`border rounded-lg p-3 ${
            userParticipation?.stance === HotTakeStance.SUPPORT_POST2
              ? 'border-green-500 bg-green-500/5'
              : 'border-gray-200'
          }`}>
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={battle.post2?.creatorAvatar} />
                <AvatarFallback className="text-xs">
                  {getInitials(battle.post2?.creatorName || 'Unknown')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{battle.post2?.creatorName || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">
                    {battle.post2?.timestamp ? formatDistanceToNow(battle.post2.timestamp) : '0'} ago
                  </span>
                </div>
                <p className={`text-sm ${showFullContent ? '' : 'line-clamp-2'}`}>
                  {battle.post2?.content || 'Content unavailable'}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{battle.post2Supporters} supporters ({post2Percentage}%)</span>
                  </div>
                  {session?.user?.id && (
                    <Button
                      size="sm"
                      variant={userParticipation?.stance === HotTakeStance.SUPPORT_POST2 ? "default" : "outline"}
                      onClick={() => handleJoinTeam(HotTakeStance.SUPPORT_POST2)}
                      disabled={isJoining}
                      className="h-6 px-2 text-xs"
                    >
                      {userParticipation?.stance === HotTakeStance.SUPPORT_POST2
                        ? `Leave Team ${battle.post2.creatorName.split(' ')[0]}`
                        : `Join Team ${battle.post2.creatorName.split(' ')[0]}`
                      }
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Stats & Actions */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{battle.totalParticipants} joined</span>
              </div>
              {battle.neutralTakes > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{battle.neutralTakes} other takes</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Trending in {battle.topic}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {session?.user?.id && !userParticipation && (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onCreateTake?.(battle.id)}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Add Your Take
              </Button>
            </div>
          )}

          {userParticipation && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
              <p className="text-sm text-green-700 font-medium">
                🎉 You're in this battle!
                {userParticipation.stance === HotTakeStance.SUPPORT_POST1 &&
                  ` Team ${battle.post1.creatorName.split(' ')[0]}`}
                {userParticipation.stance === HotTakeStance.SUPPORT_POST2 &&
                  ` Team ${battle.post2.creatorName.split(' ')[0]}`}
                {userParticipation.stance === HotTakeStance.CUSTOM_TAKE && ' with your own take'}
                {userParticipation.stance === HotTakeStance.NEUTRAL && ' with a neutral position'}
              </p>
            </div>
          )}

          {!session?.user?.id && (
            <p className="text-sm text-muted-foreground text-center py-2">
              <Button variant="link" className="h-auto p-0 text-sm">
                Sign in to join the battle
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}