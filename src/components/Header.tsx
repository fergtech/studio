"use client";

import Link from "next/link";
import { Box, Home, PlusCircle, RocketIcon, MegaphoneIcon, PlusIcon } from "lucide-react";
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

  console.log("Session data in Header:", session); // Log session data
  console.log("Session status:", status); // Log session status

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 sm:px-6 lg:px-8"> {/* Added responsive padding */}
        <div className="mr-auto flex items-center"> {/* Changed mr-4 to mr-auto to push nav to the right */}
          <Link href="/" className="flex items-center space-x-2">
            <Box className="h-6 w-6 text-primary" />
            <span className="font-bold">society+</span>
          </Link>
        </div>
        <nav className="flex items-center space-x-2 sm:space-x-4"> {/* Added responsive spacing */}
          <Link
            href="/"
            className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Home className="mr-1 h-4 w-4" />
            Home
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={() => openCreateInitiativeModal()} className="cursor-pointer">
                Create Initiative
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateIssueModal()} className="cursor-pointer">
                Create Issue
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateIdeaModal()} className="cursor-pointer">
                Create Idea
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isLoading ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          ) : session?.user ? (
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
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
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
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Initiative</DialogTitle>
            </DialogHeader>
            <CreateInitiativeForm setOpen={closeCreateInitiativeModal} />
          </DialogContent>
        </Dialog>

        <Dialog open={createIssueModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateIssueModal()}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Issue</DialogTitle>
            </DialogHeader>
            <IssueForm setOpen={closeCreateIssueModal} />
          </DialogContent>
        </Dialog>

        <Dialog open={createIdeaModal.isOpen} onOpenChange={(isOpen) => !isOpen && closeCreateIdeaModal()}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Idea</DialogTitle>
            </DialogHeader>
            <IdeaForm setOpen={closeCreateIdeaModal} />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}