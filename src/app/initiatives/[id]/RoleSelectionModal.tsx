'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from 'lucide-react';
import type { UserSelectableMembershipRole } from "@/lib/types";
import { cn } from "@/lib/utils"; // Import for cn

interface RoleSelectionModalProps {
  availableMembershipRoles: UserSelectableMembershipRole[];
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect: (roleType: UserSelectableMembershipRole) => void;
  title?: string; 
  description?: string; 
  currentRole?: UserSelectableMembershipRole; 
}

export function RoleSelectionModal({
  availableMembershipRoles,
  isOpen,
  onClose,
  onRoleSelect,
  title = "Join Initiative As", 
  description = "Select the capacity in which you'd like to join this initiative.", 
  currentRole,
}: RoleSelectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {availableMembershipRoles.map((roleType) => (
            <Card
              key={roleType}
              className={cn(
                "cursor-pointer hover:bg-muted/50 transition-colors",
                currentRole === roleType && "bg-muted/70 border-primary ring-2 ring-primary"
              )}
              onClick={() => {
                if (currentRole === roleType) return; // Prevent re-selecting current role if it's the same
                onRoleSelect(roleType);
                // Do not call onClose here; parent component (InitiativeClientPage) will close it after action.
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{roleType.charAt(0).toUpperCase() + roleType.slice(1).toLowerCase()}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentRole === roleType 
                        ? "This is your current role."
                        : `Select to become a ${roleType.toLowerCase()}.`}
                    </p>
                  </div>
                  {currentRole === roleType ? (
                     <Check className="h-5 w-5 text-primary" /> // Indicate current selection
                  ) : (
                    <Button // Changed to a Button for better accessibility and click handling if needed, though div itself is clickable
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Select role ${roleType}`}
                      // onClick is on the Card, so this button is more for visual cue
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}