'use client';

import React, { useState } from 'react';
import { Home, Plus, User, Settings, LogOut, Sun, Moon, Search, MessageSquare, Target, Users, Lightbulb, AlertTriangle, FileText, X, Bell } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useModal } from '@/context/ModalContext';
import { cn } from '@/lib/utils';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { SearchModal } from '../SearchModal';
import { CreateDrawerModal } from './CreateDrawerModal';
import NotificationBell from '@/components/NotificationBell';

// Mock user avatars matching main feed pattern
const mockUserAvatars: Record<string, string | undefined> = {
  "user1": "https://i.pravatar.cc/40?u=user1",
  "user3": "https://i.pravatar.cc/40?u=user3",
  "user5": "https://i.pravatar.cc/40?u=user5",
  "user7": "https://i.pravatar.cc/40?u=user7",
};

export function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    openCreateDebateTopicModal,
    openCreateInitiativeModal,
    openCreateSocietyModal,
    openCreateIdeaModal,
    openCreateIssueModal,
    openCreateTopicPostModal
  } = useModal();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Get avatar URL with fallback pattern matching main feed
  const getAvatarUrl = (userId?: string, sessionImage?: string | null) => {
    return sessionImage || mockUserAvatars[userId || ''] || "https://i.pravatar.cc/40?u=anonymous";
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const isLoading = status === 'loading';

  // Handle create option selection
  const handleCreateOption = (type: 'debate' | 'initiative' | 'society' | 'post') => {
    setShowCreateSheet(false);
    switch (type) {
      case 'debate':
        openCreateDebateTopicModal();
        break;
      case 'initiative':
        openCreateInitiativeModal();
        break;
      case 'society':
        openCreateSocietyModal();
        break;
      case 'post':
        openCreateTopicPostModal('general');
        break;
    }
  };

  return (
    <>
      {/* Search Modal - Disabled in favor of /explore navigation */}
      {/* <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} /> */}

      {/* Mobile Nav Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-t border-border flex items-center justify-around md:hidden z-40">
        <Link href="/" className={cn("flex flex-col items-center gap-1 text-muted-foreground transition-colors", pathname === '/' && 'text-primary')}>
          <Home className="h-6 w-6" />
          <span className="text-xs">Home</span>
        </Link>

        {/* Create Button */}
        <button
          suppressHydrationWarning={true}
          onClick={() => setShowCreateSheet(true)}
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary to-primary/90 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xs">Create</span>
        </button>

        <Link href="/explore" className={cn("flex flex-col items-center gap-1 text-muted-foreground transition-colors", pathname === '/explore' && 'text-primary')}>
          <Search className="h-6 w-6" />
          <span className="text-xs">Explore</span>
        </Link>

        {/* Profile Popover */}
        {isLoading ? (
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
        ) : session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("flex flex-col items-center gap-1 text-muted-foreground transition-colors", (pathname.startsWith('/u/') || pathname.startsWith('/profile')) && 'text-primary')}>
                <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={getAvatarUrl(session.user.id, session.user.image)} 
                      alt={session.user.name || 'User'} 
                    />
                    <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                  </Avatar>
                <span className="text-xs">Profile</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <DropdownMenuLabel>
                <div className="font-normal text-sm text-muted-foreground">Signed in as</div>
                <div className="font-semibold truncate">{session.user.name}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={`/profile/${session.user.username || session.user.id}`} passHref>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/messages" passHref>
                <DropdownMenuItem className="cursor-pointer">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Messages</span>
                </DropdownMenuItem>
              </Link>
              <NotificationBell />
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute ml-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>Toggle Theme</span>
              </DropdownMenuItem>
              <Link href={`/profile/${session.user.username || session.user.id}/edit`} passHref>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/api/auth/signin" passHref>
            <div className={cn("flex flex-col items-center gap-1 text-muted-foreground transition-colors")}>
              <User className="h-6 w-6" />
              <span className="text-xs">Sign In</span>
            </div>
          </Link>
        )}
      </div>

      {/* Desktop Floating Nav Bar */}
      <div className="hidden md:flex fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 h-14 px-3 bg-background/80 backdrop-blur-lg border rounded-full shadow-lg">
          {/* Logo/Branding */}
          <Link href="/" className="flex items-center gap-2 px-3 py-2">
            <Image src="/apple-touch-icon.png" alt="society+ logo" width={28} height={28} className="rounded-md" />
            <span className="font-semibold text-base">society+</span>
          </Link>

          <div className="w-px h-8 bg-border/50 mx-1" />

          {/* Home */}
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full gap-2",
                pathname === '/' && 'bg-primary/10 text-primary'
              )}
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Button>
          </Link>

          {/* Create Button with subtle animation */}
          <div className="relative mx-1">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
            <Button
              onClick={() => setShowCreateSheet(true)}
              className="relative rounded-full gap-2 bg-gradient-to-br from-primary via-primary to-primary/90 hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Create</span>
            </Button>
          </div>

          {/* Explore */}
          <Link href="/explore">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full gap-2",
                pathname === '/explore' && 'bg-primary/10 text-primary'
              )}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Explore</span>
            </Button>
          </Link>

          {isLoading ? (
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
          ) : session?.user ? (
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
              <DropdownMenuContent align="end" className="w-56 mb-2">
                <DropdownMenuLabel>
                  <div className="font-normal text-sm text-muted-foreground">Signed in as</div>
                  <div className="font-semibold truncate">{session.user.name}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={`/profile/${session.user.username || session.user.id}`} passHref>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/messages" passHref>
                  <DropdownMenuItem className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </DropdownMenuItem>
                </Link>
                <NotificationBell />
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute ml-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>Toggle Theme</span>
                </DropdownMenuItem>
                <Link href={`/profile/${session.user.username || session.user.id}/edit`} passHref>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/api/auth/signin" passHref>
              <Button variant="outline" className="rounded-full">Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Create Content Bottom Sheet (Mobile) & Modal (Desktop) */}
      <CreateDrawerModal
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
        onSelect={handleCreateOption}
      />
    </>
  );
}
