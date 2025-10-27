import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MessageSquare, Target, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateDrawerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: "debate" | "initiative" | "society" | "post") => void;
}

export function CreateDrawerModal({ open, onOpenChange, onSelect }: CreateDrawerModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={
          cn(
            "h-auto max-h-[80vh] rounded-t-3xl p-0 border-none bg-gradient-to-br from-background to-muted/60",
            // Desktop: center modal, max width, shadow, rounded
            "md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:translate-x-[-50%] md:translate-y-[-50%] md:rounded-3xl md:shadow-2xl md:max-w-2xl md:w-full md:p-8 md:border md:bg-background/95 md:backdrop-blur-lg"
          )
        }
      >
        <SheetHeader className="pb-6">
          <SheetTitle className="text-center text-xl font-bold">What do you want to create?</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-6 pb-8 px-4 md:px-0">
          {/* Debate */}
          <button
            onClick={() => onSelect("debate")}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-purple-500/10 active:scale-95 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">Debate</span>
          </button>
          {/* Initiative */}
          <button
            onClick={() => onSelect("initiative")}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-blue-500/10 active:scale-95 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
              <Target className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">Initiative</span>
          </button>
          {/* Society */}
          <button
            onClick={() => onSelect("society")}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-emerald-500/10 active:scale-95 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 transition-shadow">
              <Users className="w-8 h-8 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">Society</span>
          </button>
          {/* Post */}
          <button
            onClick={() => onSelect("post")}
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
  );
}
