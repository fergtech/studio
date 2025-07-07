"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { UserForDisplay } from '@/lib/types';

interface UserProfileProps {
  user: UserForDisplay & {
    bannerImageUrl?: string;
    isOwnProfile?: boolean;
    isFollowing?: boolean;
    followerCount?: number;
    followingCount?: number;
    postCount?: number;
    // No fullName, username, bio, or avatarUrl
  };
  onEditProfile?: () => void;
  onEditBanner?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMessage?: () => void;
}

export function UserProfile({ user, onEditProfile, onEditBanner, onFollow, onUnfollow, onMessage }: UserProfileProps) {
  const isOwnProfile = user.isOwnProfile;
  const isFollowing = user.isFollowing;

  return (
    <div className="relative w-full mb-8">
      {/* Banner */}
      <div className="relative h-40 sm:h-56 md:h-64 w-full rounded-t-xl overflow-hidden bg-muted">
        {user.bannerImageUrl ? (
          <Image src={user.bannerImageUrl} alt="Profile banner" fill className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/80 to-secondary/80" />
        )}
        {isOwnProfile && (
          <Button
            size="sm"
            variant="outline"
            className="absolute right-4 top-4 z-10 bg-white/80 hover:bg-white"
            onClick={onEditBanner}
          >
            Edit Cover Photo
          </Button>
        )}
      </div>
      {/* Avatar - overlaps banner and meta card */}
      <div className="absolute left-6 sm:left-12 -bottom-12 z-20">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
          <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
          <AvatarFallback>{user.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
      </div>
      {/* Meta Card */}
      <div className="mt-12 sm:mt-16 bg-white dark:bg-background rounded-xl shadow px-4 py-6 flex flex-col sm:flex-row items-center sm:items-end justify-between min-h-[120px] relative">
        <div className="flex flex-col items-center sm:items-start ml-32 sm:ml-40 w-full">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">{user.name}</h1>
            <div className="flex gap-2">
              {!isOwnProfile && !isFollowing && (
                <Button size="sm" onClick={onFollow}>Follow</Button>
              )}
              {!isOwnProfile && isFollowing && (
                <Button size="sm" variant="outline" onClick={onUnfollow}>Unfollow</Button>
              )}
              {!isOwnProfile && (
                <Button size="sm" variant="secondary" onClick={onMessage}>Message</Button>
              )}
              {isOwnProfile && (
                <Button size="sm" variant="outline" onClick={onEditProfile}>Edit Profile</Button>
              )}
            </div>
          </div>
          {/* Stats */}
          <div className="flex space-x-4 sm:space-x-6 text-sm mt-2">
            {typeof user.postCount === 'number' && (
              <div><span className="font-semibold">{user.postCount}</span> posts</div>
            )}
            {typeof user.followerCount === 'number' && (
              <div><span className="font-semibold">{user.followerCount}</span> followers</div>
            )}
            {typeof user.followingCount === 'number' && (
              <div><span className="font-semibold">{user.followingCount}</span> following</div>
            )}
          </div>
          {/* Optionally, show last active */}
          {user.lastActive && (
            <div className="text-xs text-muted-foreground mt-2">Last active: {user.lastActive.toLocaleString()}</div>
          )}
        </div>
      </div>
    </div>
  );
} 