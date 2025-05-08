'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from 'lucide-react';
import type { Initiative, Role } from "@/lib/types";

interface RoleSelectionModalProps {
  initiative: Initiative;
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect: (role: Role) => void;
}

export function RoleSelectionModal({
  initiative,
  isOpen,
  onClose,
  onRoleSelect
}: RoleSelectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Join Initiative</DialogTitle>
          <DialogDescription>
            Select a role to join this initiative
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {initiative.roles.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {
                onRoleSelect(role);
                onClose();
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{role.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 