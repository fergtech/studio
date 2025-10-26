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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  const handleCreateOption = (type: 'debate' | 'initiative' | 'society' | 'idea' | 'issue' | 'post') => {
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
      case 'idea':
        openCreateIdeaModal();
        break;
      case 'issue':
        openCreateIssueModal();
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

      {/* Mobile "Create" FAB - moved higher to avoid overlap with nav bar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 md:hidden z-50">
        <div className="relative">
          {/* Subtle pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s' }} />

          {/* Main FAB button */}
          <button
            onClick={() => setShowCreateSheet(true)}
            className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all active:scale-95 group overflow-hidden"
            aria-label="Create new content"
          >
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

            {/* Plus icon */}
            <Plus className={cn("w-8 h-8 transition-transform relative z-10", showCreateSheet && "rotate-45")} />
          </button>
        </div>
      </div>

      {/* Spacer for Mobile */}
      <div className="h-28 md:hidden" />

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
      <Sheet open={showCreateSheet} onOpenChange={setShowCreateSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-3xl">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-center text-xl font-bold">What do you want to create?</SheetTitle>
          </SheetHeader>

          {/* Grid of Create Options */}
          <div className="grid grid-cols-3 gap-6 pb-8 px-4">
            {/* Debate */}
            <button
              onClick={() => handleCreateOption('debate')}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-purple-500/10 active:scale-95 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Debate</span>
            </button>

            {/* Initiative */}
            <button
              onClick={() => handleCreateOption('initiative')}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-blue-500/10 active:scale-95 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                <Target className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Initiative</span>
            </button>

            {/* Society */}
            <button
              onClick={() => handleCreateOption('society')}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-emerald-500/10 active:scale-95 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-shadow">
                <Users className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Society</span>
            </button>

            {/* Idea */}
            <button
              onClick={() => handleCreateOption('idea')}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-yellow-500/10 active:scale-95 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/50 transition-shadow">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Idea</span>
            </button>

            {/* Issue */}
            <button
              onClick={() => handleCreateOption('issue')}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-red-500/10 active:scale-95 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:shadow-red-500/50 transition-shadow">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Issue</span>
            </button>

            {/* Post */}
            <button
              onClick={() => handleCreateOption('post')}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-cyan-500/10 active:scale-95 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/50 transition-shadow">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Post</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
