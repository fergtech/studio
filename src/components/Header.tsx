"use client";

import Link from "next/link";
import { PlusCircle, Home, User, Box } from "lucide-react";
import { useState } from "react"; // Import useState
import { useSession, signOut } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // Import DialogFooter if needed for separate actions
} from "@/components/ui/dialog"; // Import Dialog components
import { Button } from "@/components/ui/button"; // Import Button if needed for trigger
import { CreateInitiativeForm } from "@/components/CreateInitiativeForm"; // Ensure correct path
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  console.log("Header component rendering - Simplified");
  const [isCreateInitiativeOpen, setIsCreateInitiativeOpen] = useState(false); // State for dialog
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' }); // Redirect to home after sign out
  };

  // Function to get initials from name
  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Box className="h-6 w-6 text-primary" />
            <span className="font-bold">society+</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center justify-end space-x-4">
          <Link
            href="/"
            className="flex items-center rounded-md p-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Home className="mr-1 h-4 w-4" />
            Home
          </Link>

          {/* Dialog for Create Initiative */}
          <Dialog open={isCreateInitiativeOpen} onOpenChange={setIsCreateInitiativeOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default" // Use default button style
                size="icon" // Make it icon-sized
                className="rounded-md bg-primary p-2 text-primary-foreground shadow transition-colors hover:bg-primary/90 h-9 w-9" // Adjusted size and styling
                aria-label="Create Initiative"
              >
                <PlusCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]"> {/* Adjust max width as needed */}
              <DialogHeader>
                <DialogTitle>Create New Initiative</DialogTitle>
                <DialogDescription>
                  Start a new project and invite collaborators from your community.
                </DialogDescription>
              </DialogHeader>
              {/* Render the form inside the dialog content */}
              <CreateInitiativeForm setOpen={setIsCreateInitiativeOpen} />
              {/* DialogFooter can be used here if the form doesn't include its own buttons */}
              {/* <DialogFooter>
                <Button type="submit" form="create-initiative-form">Save changes</Button>
              </DialogFooter> */}
            </DialogContent>
          </Dialog>

          {isLoading ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div> // Skeleton loader
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
                {/* Add links to profile, settings etc. here */}
                {session.user && (session.user as any).username && ( // Check if user and their username exist in the session
                  <DropdownMenuItem asChild>
                    {/* Link to /profile/[username] using the username from the session */}
                    <Link href={`/profile/${(session.user as any).username}`}>Profile</Link>
                  </DropdownMenuItem>
                )}
                {/* Fallback to /profile/me if username is not in session, or remove if username is guaranteed */}
                {session.user && !(session.user as any).username && (
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/me`}>Profile (Legacy)</Link> 
                  </DropdownMenuItem>
                )}
                {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}