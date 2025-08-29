'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { 
  UserPlus, 
  Users, 
  MessageSquare, 
  Star, 
  Target, 
  CheckCircle, 
  TrendingUp,
  MapPin
} from 'lucide-react';

// Types for meta actions that match the unified feed structure
interface UpdateAction {
  type: 'update';
  id: string;
  timestamp: Date;
  data: {
    id: string;
    type: string;
    content: string;
    details?: any;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
    };
    initiative: {
      id: string;
      title: string;
    };
  };
}

interface FollowAction {
  type: 'follow';
  id: string;
  timestamp: Date;
  data: {
    id: string;
    createdAt: Date;
    follower: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
    };
    following: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
    };
  };
}

interface InitiativeJoinAction {
  type: 'initiativeJoin';
  id: string;
  timestamp: Date;
  data: {
    id: string;
    createdAt: Date;
    role: string;
    customRole?: string | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      username: string | null;
    };
    initiative: {
      id: string;
      title: string;
    };
  };
}

type MetaAction = UpdateAction | FollowAction | InitiativeJoinAction;

interface MetaActionCardProps {
  action: MetaAction;
  currentUserId?: string;
}

const getActionIcon = (action: MetaAction) => {
  switch (action.type) {
    case 'update':
      const updateType = action.data.type;
      switch (updateType) {
        case 'join':
          return <Users className="h-4 w-4" />;
        case 'post':
          return <MessageSquare className="h-4 w-4" />;
        case 'milestone':
        case 'milestone_creation':
        case 'milestone_status':
          return <Target className="h-4 w-4" />;
        case 'step_completion':
          return <CheckCircle className="h-4 w-4" />;
        case 'endorsement':
          return <Star className="h-4 w-4" />;
        case 'status':
          return <TrendingUp className="h-4 w-4" />;
        default:
          return <MessageSquare className="h-4 w-4" />;
      }
    case 'follow':
      return <UserPlus className="h-4 w-4" />;
    case 'initiativeJoin':
      return <Users className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

const getActionColor = (action: MetaAction) => {
  switch (action.type) {
    case 'update':
      const updateType = action.data.type;
      switch (updateType) {
        case 'join':
        case 'initiativeJoin':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'post':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'milestone':
        case 'milestone_creation':
        case 'milestone_status':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'step_completion':
          return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'endorsement':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'status':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    case 'follow':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'initiativeJoin':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getActionText = (action: MetaAction) => {
  switch (action.type) {
    case 'update':
      const updateType = action.data.type;
      const userName = action.data.user.name || 'Someone';
      const initiativeName = action.data.initiative.title;
      
      switch (updateType) {
        case 'join':
          return `${userName} joined ${initiativeName}`;
        case 'post':
          return `${userName} posted in ${initiativeName}`;
        case 'milestone':
        case 'milestone_creation':
          return `${userName} created a milestone in ${initiativeName}`;
        case 'milestone_status':
          return `${userName} updated a milestone in ${initiativeName}`;
        case 'step_completion':
          return `${userName} completed a step in ${initiativeName}`;
        case 'endorsement':
          return `${userName} endorsed ${initiativeName}`;
        case 'status':
          return `${userName} updated the status of ${initiativeName}`;
        case 'role_add':
          return `${userName} was assigned a role in ${initiativeName}`;
        case 'resource_share':
          return `${userName} shared a resource in ${initiativeName}`;
        default:
          return `${userName} updated ${initiativeName}`;
      }
    case 'follow':
      const followerName = action.data.follower.name || 'Someone';
      const followingName = action.data.following.name || 'someone';
      return `${followerName} started following ${followingName}`;
    case 'initiativeJoin':
      const joinUserName = action.data.user.name || 'Someone';
      const joinInitiativeName = action.data.initiative.title;
      const role = action.data.customRole || action.data.role;
      return `${joinUserName} joined ${joinInitiativeName} as ${role}`;
    default:
      return 'Activity occurred';
  }
};

export function MetaActionCard({ action, currentUserId }: MetaActionCardProps) {
  const timeAgo = formatDistanceToNow(
    typeof action.timestamp === 'string' 
      ? parseISO(action.timestamp) 
      : action.timestamp,
    { addSuffix: true }
  );

  const getPrimaryUser = (action: MetaAction) => {
    switch (action.type) {
      case 'update':
        return action.data.user;
      case 'follow':
        return action.data.follower;
      case 'initiativeJoin':
        return action.data.user;
      default:
        return null;
    }
  };

  const getSecondaryUser = (action: MetaAction) => {
    switch (action.type) {
      case 'follow':
        return action.data.following;
      default:
        return null;
    }
  };

  const getInitiativeLink = (action: MetaAction) => {
    switch (action.type) {
      case 'update':
      case 'initiativeJoin':
        return `/initiatives/${action.data.initiative.id}`;
      default:
        return null;
    }
  };

  const primaryUser = getPrimaryUser(action);
  const secondaryUser = getSecondaryUser(action);
  const initiativeLink = getInitiativeLink(action);

  return (
    <div className="w-full max-w-[500px] bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        {/* Primary User Avatar */}
        {primaryUser && (primaryUser.username || primaryUser.id) && (
          <Link href={`/profile/${primaryUser.username || primaryUser.id}`}>
            <Avatar className="h-10 w-10 hover:opacity-80 transition-opacity">
              <AvatarImage src={primaryUser.image || undefined} alt={primaryUser.name || 'User'} />
              <AvatarFallback>
                {primaryUser.name ? primaryUser.name.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}

        {/* Action Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(action)}`}>
              {getActionIcon(action)}
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          <p className="text-sm text-foreground mb-2">
            {getActionText(action)}
          </p>

          {/* Secondary User (for follows) */}
          {secondaryUser && (secondaryUser.username || secondaryUser.id) && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">following</span>
              <Link href={`/profile/${secondaryUser.username || secondaryUser.id}`}>
                <Avatar className="h-6 w-6 hover:opacity-80 transition-opacity">
                  <AvatarImage src={secondaryUser.image || undefined} alt={secondaryUser.name || 'User'} />
                  <AvatarFallback>
                    {secondaryUser.name ? secondaryUser.name.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Link 
                href={`/profile/${secondaryUser.username || secondaryUser.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {secondaryUser.name || 'User'}
              </Link>
            </div>
          )}

          {/* Initiative Link */}
          {initiativeLink && (
            <Link 
              href={initiativeLink}
              className="inline-flex items-center text-sm text-primary hover:underline mt-1"
            >
              <MapPin className="h-3 w-3 mr-1" />
              View Initiative
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 
