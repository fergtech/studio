import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Lightbulb } from 'lucide-react';

export function TipsWidget() {
  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Lightbulb className="h-4 w-4" />
          Tips & Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3">
        <ul className="list-disc pl-4 space-y-0.5 text-xs text-muted-foreground">
          <li>💡 Follow users to see their activity.</li>
          <li>💡 Join initiatives to collaborate.</li>
          <li>💡 Share your progress to inspire others.</li>
        </ul>
      </CardContent>
    </Card>
  );
} 
