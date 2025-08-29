'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from 'lucide-react';
import type { UserSelectableMembershipRole } from "@/lib/types";
import { cn } from "@/lib/utils"; // Import for cn
import { useState } from "react";

interface RoleSelectionModalProps {
  availableMembershipRoles: UserSelectableMembershipRole[];
  customRoles: string[];
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect: (roleType: UserSelectableMembershipRole, customRole: string | null) => void;
  title?: string; 
  description?: string; 
  currentRole?: UserSelectableMembershipRole; 
}

export function RoleSelectionModal({
  availableMembershipRoles,
  customRoles,
  isOpen,
  onClose,
  onRoleSelect,
  title = "Join Initiative As", 
  description = "Select the capacity in which you'd like to join this initiative.", 
  currentRole,
}: RoleSelectionModalProps) {
  const [selectedMembershipRole, setSelectedMembershipRole] = useState<UserSelectableMembershipRole | null>(null);
  const [selectedCustomRole, setSelectedCustomRole] = useState<string | null>(null);

  const handleSelect = () => {
    if (selectedMembershipRole) {
      onRoleSelect(selectedMembershipRole, selectedCustomRole);
    }
  };

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
          <div>
            <label className="block mb-2 font-medium">Select Membership Role</label>
            {availableMembershipRoles.map((roleType) => (
              <Card
                key={roleType}
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors mb-2",
                  selectedMembershipRole === roleType && "bg-muted/70 border-primary ring-2 ring-primary"
                )}
                onClick={() => setSelectedMembershipRole(roleType)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{roleType.charAt(0).toUpperCase() + roleType.slice(1).toLowerCase()}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedMembershipRole === roleType 
                          ? "This is your selected role."
                          : `Select to become a ${roleType.toLowerCase()}.`}
                      </p>
                    </div>
                    {selectedMembershipRole === roleType ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <label className="block mb-2 font-medium">Select Custom Role/Skill</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedCustomRole || ''}
              onChange={e => setSelectedCustomRole(e.target.value)}
            >
              <option value="">None</option>
              {customRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <Button
            className="mt-4"
            disabled={!selectedMembershipRole}
            onClick={handleSelect}
          >
            Join Initiative
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}