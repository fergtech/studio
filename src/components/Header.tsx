"use client";

import Link from "next/link";
import Image from "next/image";
import { Box, Home, PlusCircle, RocketIcon, MegaphoneIcon, PlusIcon, Menu, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AzureAvatar } from "@/components/ui/azure-image";
import { useSession, signOut } from 'next-auth/react';
import { useModal } from '@/context/ModalContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateInitiativeForm } from '@/components/CreateInitiativeForm';
import { IssueForm } from '@/components/IssueForm';
import { IdeaForm } from '@/components/IdeaForm';
import { useRouter, usePathname } from 'next/navigation';
import { ToggleTheme } from "@/components/ToggleTheme";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { HomeIcon } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Activity } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { CreateSocietyForm } from '@/components/CreateSocietyForm';
import { CreateDebateTopicForm } from '@/components/CreateDebateTopicForm';
import { useState, useEffect } from 'react';

export function Header() {
  if (process.env.NODE_ENV === 'development') {
    console.log("Header component rendering");
  }
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const {
    openCreateInitiativeModal,
    createInitiativeModal,
    closeCreateInitiativeModal,
    openCreateIssueModal,
    closeCreateIssueModal,
    createIssueModal,
    openCreateIdeaModal,
    closeCreateIdeaModal,
    createIdeaModal,
    // Add society modal handlers
    openCreateSocietyModal,
    closeCreateSocietyModal,
    createSocietyModal,
    // Add debate topic modal handlers
    openCreateDebateTopicModal,
    closeCreateDebateTopicModal,
    createDebateTopicModal,
  } = useModal();
  const router = useRouter();
  const pathname = usePathname();
  const isLoading = status === 'loading';

  // Fetch current user data to get up-to-date profile photo
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (session?.user?.id && status === 'authenticated') {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
          } else {
            console.warn('Failed to fetch current user data, using session data');
          }
        } catch (error) {
          console.error('Error fetching current user data:', error);
          // Reset to null to use session data as fallback
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

  // Add handler to emit custom event for feed update
  const handleFeedItemCreated = (item: any) => {
    window.dispatchEvent(new CustomEvent('feed:itemCreated', { detail: item }));
  };

  if (process.env.NODE_ENV === 'development') {
    console.log("Session data in Header:", session);
    console.log("Session status:", status);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/apple-touch-icon.png" alt="Society+ logo" width={24} height={24} className="h-6 w-6 rounded-full" priority />
            <span className="font-bold">society+</span>
          </Link>
        </div>
        {/* Mobile menu moved to bottom-right floating button */}
        <div className="hidden lg:flex items-center space-x-2 sm:space-x-4">
          <Link href="/" className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Home className="h-4 w-4" />
          </Link>
          {session?.user && (
            <Link href="/activity" className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              <Activity className="h-4 w-4" />
            </Link>
          )}
          <Link href="/explore" className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Search className="h-4 w-4" />
          </Link>
          <Link href="/societies" className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Users className="h-4 w-4" />
          </Link>
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" suppressHydrationWarning={true}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">Create Initiative</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateIssueModal()} className="cursor-pointer">Create Issue</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateIdeaModal()} className="cursor-pointer">Create Idea</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateSocietyModal()} className="cursor-pointer">Create Society</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCreateDebateTopicModal()} className="cursor-pointer">Create Debate Topic</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isLoading ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          ) : session?.user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full overflow-hidden" suppressHydrationWarning={true}>
                    {(currentUser?.image ?? session.user.image) ? (
                      <AzureAvatar 
                        src={currentUser?.image ?? session.user.image ?? ''} 
                        alt={currentUser?.name ?? session.user.name ?? 'User'} 
                        size={32}
                        className="h-8 w-8"
                      />
                    ) : (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(currentUser?.name ?? session.user.name)}</AvatarFallback>
                      </Avatar>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
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
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/api/auth/signin">Sign In</Link>
              </Button>
            </div>
          )}
          <ToggleTheme />
        </div>
      </div>

      {/* Mobile floating menu button - COMMENTED OUT - Using AppSidebar globally instead */}
      {/*
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <nav className="flex flex-col gap-0 p-0">
              <div className="p-4 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</span>
              </div>
              <Link href="/" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                <Home className="h-5 w-5" /> Home
              </Link>
              {session?.user && (
                <Link href="/activity" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  <Activity className="h-5 w-5" /> Activity
                </Link>
              )}
              <Link href="/explore" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                <Search className="h-5 w-5" /> Explore
              </Link>
              <Link href="/societies" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                <Users className="h-5 w-5" /> Societies
              </Link>
              <Separator className="my-2" />
              {session?.user && (
                <>
                  <div className="p-4 pt-0 pb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="lg" className="w-[85%] mx-auto flex items-center justify-center gap-2 mb-2">
                        <PlusCircle className="h-5 w-5" /> Create
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start" forceMount>
                      <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">Create Initiative</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCreateIssueModal()} className="cursor-pointer">Create Issue</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCreateIdeaModal()} className="cursor-pointer">Create Idea</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCreateSocietyModal()} className="cursor-pointer">Create Society</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCreateDebateTopicModal()} className="cursor-pointer">Create Debate Topic</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Separator className="my-2" />
                </>
              )}
              <div className="p-4 pt-0 pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</span>
              </div>
              <div className="flex flex-col gap-2 px-4 pb-4">
                {isLoading ? (
                  <div className="h-8 w-20 bg-muted rounded animate-pulse my-2"></div>
                ) : session?.user ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <NotificationBell />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden">
                            {(currentUser?.image ?? session.user.image) ? (
                              <AzureAvatar 
                                src={currentUser?.image ?? session.user.image ?? ''} 
                                alt={currentUser?.name ?? session.user.name ?? 'User'} 
                                size={36}
                                className="h-9 w-9"
                              />
                            ) : (
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>{getInitials(currentUser?.name ?? session.user.name)}</AvatarFallback>
                              </Avatar>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start" forceMount>
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
                    </div>
                  </>
                ) : (
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/api/auth/signin">Sign In</Link>
                  </Button>
                )}
                <div className="mt-2"><ToggleTheme /></div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      */}
    </header>
  );
}
