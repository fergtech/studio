"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AzureAvatar } from '@/components/ui/azure-image';
import { PlusCircle, Settings, LogOut, User } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useModal } from '@/context/ModalContext';
import NotificationBell from '@/components/NotificationBell';
import { ToggleTheme } from '@/components/ToggleTheme';

interface UserControlsWidgetProps {
  collapsed?: boolean;
}

export default function UserControlsWidget({ collapsed = false }: UserControlsWidgetProps) {
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const {
    openCreateInitiativeModal,
    openCreateIssueModal,
    openCreateIdeaModal,
    openCreateSocietyModal,
    openCreateDebateTopicModal,
  } = useModal();

  const isLoading = status === 'loading';

  // Fetch current user data to get up-to-date profile photo
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (session?.user?.id && status === 'authenticated') {
        try {
          console.log('UserControlsWidget: Fetching current user data for:', session.user.id);
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            console.log('UserControlsWidget: Received user data:', {
              name: userData.name,
              email: userData.email,
              image: userData.image,
              sessionImage: session.user.image
            });
            setCurrentUser(userData);
          } else {
            console.error('UserControlsWidget: Failed to fetch user data:', response.status);
          }
        } catch (error) {
          console.error('Error fetching current user data:', error);
          setCurrentUser(null);
        }
      } else if (status !== 'loading') {
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, [session?.user?.id, status]);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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
            <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">
              Create Initiative
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateIssueModal()} className="cursor-pointer">
              Create Issue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateIdeaModal()} className="cursor-pointer">
              Create Idea
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateSocietyModal()} className="cursor-pointer">
              Create Society
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreateDebateTopicModal()} className="cursor-pointer">
              Create Debate Topic
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
                {(currentUser?.image ?? session.user.image) ? (
                  <AzureAvatar 
                    key={currentUser?.image ?? session.user.image ?? 'fallback'}
                    src={currentUser?.image ?? session.user.image ?? ''} 
                    alt={currentUser?.name ?? session.user.name ?? 'User'} 
                    size={40}
                    className="h-10 w-10"
                    onError={() => console.error('Failed to load avatar image:', currentUser?.image ?? session.user.image)}
                  />
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(currentUser?.name ?? session.user.name)}</AvatarFallback>
                  </Avatar>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.name ?? session.user.name ?? 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser?.email ?? session.user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session.user && (session.user as any).username && (
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${(session.user as any).username}`}>Profile</Link>
                </DropdownMenuItem>
              )}
              {session.user && !(session.user as any).username && (
                <DropdownMenuItem asChild>
                  <Link href={`/profile/me`}>Profile (Legacy)</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" className="h-10 w-10 p-0" title="Sign In" asChild>
            <Link href="/api/auth/signin">
              <User className="h-4 w-4" />
            </Link>
          </Button>
        )}

        {/* Theme Toggle - Collapsed */}
        <div className="flex justify-center">
          <ToggleTheme />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Account</h3>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-3">
        {/* Create Actions */}
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="w-full justify-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="center">
              <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">
                Create Initiative
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateIssueModal()} className="cursor-pointer">
                Create Issue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateIdeaModal()} className="cursor-pointer">
                Create Idea
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateSocietyModal()} className="cursor-pointer">
                Create Society
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateDebateTopicModal()} className="cursor-pointer">
                Create Debate Topic
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Profile & Controls */}
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        ) : session?.user ? (
          <div className="space-y-3">
            {/* User Info & Profile */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {(currentUser?.image ?? session.user.image) ? (
                  <AzureAvatar 
                    key={currentUser?.image ?? session.user.image ?? 'fallback'}
                    src={currentUser?.image ?? session.user.image ?? ''} 
                    alt={currentUser?.name ?? session.user.name ?? 'User'} 
                    size={40}
                    className="h-10 w-10 rounded-full"
                    onError={() => console.error('Failed to load avatar image:', currentUser?.image ?? session.user.image)}
                  />
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(currentUser?.name ?? session.user.name)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser?.name ?? session.user.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.email ?? session.user.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
                        Profile (Legacy)
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
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <NotificationBell />
              <ToggleTheme />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button variant="outline" asChild className="w-full">
              <Link href="/api/auth/signin">Sign In</Link>
            </Button>
            <div className="flex justify-center">
              <ToggleTheme />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}