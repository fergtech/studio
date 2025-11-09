"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Settings, LogOut, User, MessageSquare, Edit, Shield } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useModal } from '@/context/ModalContext';
import NotificationBell from '@/components/NotificationBell';
import { ToggleTheme } from '@/components/ToggleTheme';

// Mock user avatars matching main feed pattern
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
};

interface UserControlsWidgetProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

export default function UserControlsWidget({ collapsed = false, isMobile = false }: UserControlsWidgetProps) {
  const { data: session, status } = useSession();
  const [userRoles, setUserRoles] = useState<{ isAdmin: boolean; isModerator: boolean } | null>(null);
  const {
    openCreateInitiativeModal,
    openCreateIssueModal,
    openCreateIdeaModal,
    openCreateSocietyModal,
    openCreateDebateTopicModal,
    openCreateTopicPostModal,
  } = useModal();

  // Fetch user roles when session is available
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/me');
          if (response.ok) {
            const userData = await response.json();
            setUserRoles({
              isAdmin: userData.isAdmin || false,
              isModerator: userData.isModerator || false
            });
          }
        } catch (error) {
          console.error('Failed to fetch user roles:', error);
        }
      }
    };

    fetchUserRoles();
  }, [session?.user?.id]);

  const isLoading = status === 'loading';

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Generate fallback initials matching main feed pattern
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  // Get avatar URL with fallback pattern matching main feed
  const getAvatarUrl = (userId?: string, sessionImage?: string | null) => {
    return sessionImage || mockUserAvatars[userId || ''] || "https://i.pravatar.cc/40?u=anonymous";
  };

  if (isMobile) {
    return (
      <div className="flex items-center justify-end w-full space-x-1">
        {isLoading ? (
          <div className="flex items-center space-x-1">
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
          </div>
        ) : session?.user ? (
          <>
            <ToggleTheme />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Create">
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">
                  Create Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateSocietyModal()} className="cursor-pointer">
                  Create Society
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateDebateTopicModal()} className="cursor-pointer">
                  Create Debate Topic
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateTopicPostModal('general')} className="cursor-pointer">
                  Create Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden" title="Account">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={getAvatarUrl(session.user.id, session.user.image)} 
                      alt={session.user.name || 'User'} 
                    />
                    <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Signed in as</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {session.user && (session.user as any).username ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${(session.user as any).username}`}>
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/me`}>
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${session.user.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/messages`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Link>
                </DropdownMenuItem>
                {(userRoles?.isModerator || userRoles?.isAdmin) && (
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/moderation`}>
                      <Shield className="h-4 w-4 mr-2" />
                      Moderation
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <ToggleTheme />
            <Button variant="default" size="sm" asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="space-y-2">
        {/* Create Button - Collapsed */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" title="Create">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuItem onClick={() => openCreateDebateTopicModal()} className="cursor-pointer">
              Create Debate Topic
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateTopicPostModal('general')} className="cursor-pointer">
              Create Post
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">
              Create Project
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => openCreateSocietyModal()} className="cursor-pointer">
              Create Society
            </DropdownMenuItem>
            
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications - Collapsed */}
        <div className="flex justify-center">
          <NotificationBell />
        </div>

        {/* User Menu - Collapsed */}
        {isLoading ? (
          <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
        ) : session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={getAvatarUrl(session.user.id, session.user.image)} 
                    alt={session.user.name || 'User'} 
                  />
                  <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.user.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session.user && (session.user as any).username && (
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${(session.user as any).username}`}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
              )}
              {session.user && !(session.user as any).username && (
                <DropdownMenuItem asChild>
                  <Link href={`/profile/me`}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
              )}
              {/* Profile (Legacy) - commented out
              {session.user && !(session.user as any).username && (
                <DropdownMenuItem asChild>
                  <Link href={`/profile/me`}>Profile (Legacy)</Link>
                </DropdownMenuItem>
              )}
              */}
              <DropdownMenuItem asChild>
                <Link href={`/profile/${session.user.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/messages`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Link>
              </DropdownMenuItem>
              {(userRoles?.isModerator || userRoles?.isAdmin) && (
                <DropdownMenuItem asChild>
                  <Link href={`/admin/moderation`}>
                    <Shield className="h-4 w-4 mr-2" />
                    Moderation
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="space-y-2">
            <Button variant="default" size="sm" className="h-10 w-10 p-0" title="Sign Up" asChild>
              <Link href="/register">
                <PlusCircle className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="h-10 w-10 p-0" title="Log In" asChild>
              <Link href="/login">
                <User className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Theme Toggle - Collapsed */}
        <div className="flex justify-center">
          <ToggleTheme />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Profile & Controls */}
      {isLoading ? (
        <div className="flex items-center gap-3 px-3">
          <div className="h-10 w-10 bg-muted/50 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-muted/50 rounded animate-pulse mb-1.5"></div>
            <div className="h-3 bg-muted/50 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      ) : session?.user ? (
        <div className="space-y-3">
          {/* User Info & Profile */}
          <div className="flex items-center gap-3 px-3">
            <Link
              href={session.user && (session.user as any).username ? `/profile/${(session.user as any).username}` : '/profile/me'}
              className="flex items-center gap-3 flex-1 min-w-0 hover:bg-accent/50 rounded-lg p-2 -m-2 transition-all duration-200 group"
            >
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-200">
                  <AvatarImage
                    src={getAvatarUrl(session.user.id, session.user.image)}
                    alt={session.user.name || 'User'}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{session.user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent/50 rounded-lg transition-colors">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {session.user && (session.user as any).username && (
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${(session.user as any).username}`}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                {session.user && !(session.user as any).username && (
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/me`}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${session.user.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/messages`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Link>
                </DropdownMenuItem>
                {(userRoles?.isModerator || userRoles?.isAdmin) && (
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/moderation`}>
                      <Shield className="h-4 w-4 mr-2" />
                      Moderation
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 px-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="flex-1 gap-2 shadow-sm">
                  <PlusCircle className="h-4 w-4" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuItem onClick={() => openCreateDebateTopicModal()} className="cursor-pointer">
                  Create Debate Topic
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateTopicPostModal('general')} className="cursor-pointer">
                  Create Post
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">
                  Create Project
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => openCreateSocietyModal()} className="cursor-pointer">
                  Create Society
                </DropdownMenuItem>
                
              </DropdownMenuContent>
            </DropdownMenu>
            <NotificationBell />
            <ToggleTheme />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Guest Welcome Banner */}
          <div className="mx-3 p-4 bg-gradient-to-br from-primary/90 to-primary text-primary-foreground rounded-xl shadow-lg">
            <h3 className="font-bold text-base mb-2">Join Society+</h3>
            <p className="text-sm mb-4 opacity-90">
              Create posts, join projects, and make real impact!
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild size="sm" variant="secondary" className="w-full shadow-sm font-semibold">
                <Link href="/register">Sign Up</Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="w-full hover:bg-white/10">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex justify-center">
            <ToggleTheme />
          </div>
        </div>
      )}
    </div>
  );
}