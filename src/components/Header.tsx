"use client";

import Link from "next/link";
import { Box, Home, PlusCircle, RocketIcon, MegaphoneIcon, PlusIcon, Menu, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from 'next-auth/react';
import { useModal } from '@/context/ModalContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateInitiativeForm } from '@/components/CreateInitiativeForm';
import { IssueForm } from '@/components/IssueForm';
import { IdeaForm } from '@/components/IdeaForm';
import { useRouter, usePathname } from 'next/navigation';
import { ToggleTheme } from "@/components/ToggleTheme";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { HomeIcon } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { Activity } from "lucide-react";
import { Separator } from '@/components/ui/separator';

export function Header() {
  console.log("Header component rendering");
  const { data: session, status } = useSession();
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
  } = useModal();
  const router = useRouter();
  const pathname = usePathname();
  const isLoading = status === 'loading';

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

  console.log("Session data in Header:", session); // Log session data
  console.log("Session status:", status); // Log session status

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mr-auto">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/apple-touch-icon.png" alt="Society+ logo" className="h-6 w-6 rounded-full" />
            <span className="font-bold">society+</span>
          </Link>
        </div>
        <div className="flex lg:hidden ml-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <nav className="flex flex-col gap-0 p-0">
                <div className="p-4 pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</span>
                </div>
                <Link href="/" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  <Home className="h-5 w-5" /> Home
                </Link>
                <Link href="/activity" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  <Activity className="h-5 w-5" /> Activity
                </Link>
                <Link href="/explore" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  <Search className="h-5 w-5" /> Explore
                </Link>
                <Separator className="my-2" />
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
                  </DropdownMenuContent>
                </DropdownMenu>
                <Separator className="my-2" />
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
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? 'User'} />
                                <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                              </Avatar>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56" align="start" forceMount>
                            <DropdownMenuLabel className="font-normal">
                              <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{session.user.name ?? 'User'}</p>
                                <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
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
        <nav className="hidden lg:flex items-center space-x-2 sm:space-x-4">
          <Link href="/" className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Home className="h-4 w-4" />
          </Link>
          <Link href="/activity" className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Activity className="h-4 w-4" />
          </Link>
          <Link href="/explore" className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Search className="h-4 w-4" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">Create Initiative</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateIssueModal()} className="cursor-pointer">Create Issue</DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateIdeaModal()} className="cursor-pointer">Create Idea</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isLoading ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          ) : session?.user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "User"} />
                      <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name ?? 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
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
        </nav>
        <Dialog open={createInitiativeModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateInitiativeModal()}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Initiative</DialogTitle>
            </DialogHeader>
            <CreateInitiativeForm setOpen={closeCreateInitiativeModal} onCreated={handleFeedItemCreated} />
          </DialogContent>
        </Dialog>
        <Dialog open={createIssueModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateIssueModal()}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Issue</DialogTitle>
            </DialogHeader>
            <IssueForm setOpen={closeCreateIssueModal} onCreated={handleFeedItemCreated} />
          </DialogContent>
        </Dialog>
        <Dialog open={createIdeaModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateIdeaModal()}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Idea</DialogTitle>
            </DialogHeader>
            <IdeaForm setOpen={closeCreateIdeaModal} onCreated={handleFeedItemCreated} />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
