'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Initiative } from "@/lib/types";

interface InitiativesListModalProps {
  isOpen: boolean;
  onClose: () => void;
  initiatives: Initiative[];
  title: string;
  emptyMessage: string;
}

export function InitiativesListModal({ isOpen, onClose, initiatives, title, emptyMessage }: InitiativesListModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {emptyMessage}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {initiatives.length > 0 ? (
            initiatives.map((initiative) => (
              <Link key={initiative.id} href={`/initiatives/${initiative.id}`} passHref>
                <Card className="flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden group h-[260px]">
                  {/* Background Image and Overlay */}
                  {initiative.imageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url(${initiative.imageUrl})` }}
                    >
                      <div className="absolute inset-0 bg-black/60" /> {/* Darker overlay */}
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" /> // Fallback gradient
                  )}

                  {/* Content Layer */}
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base line-clamp-2 text-white">{initiative.title}</CardTitle>
                      <CardDescription className="line-clamp-3 text-gray-200">{initiative.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Badge variant="outline" className="text-white border-white/50 bg-white/20 hover:bg-white/30">{initiative.status}</Badge>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 col-span-full text-center">{emptyMessage}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
