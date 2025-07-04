import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from 'lucide-react';

export default function SuggestionsWidget() {
  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4" />
          Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3">
        <div className="text-xs text-muted-foreground">Suggestions coming soon.</div>
      </CardContent>
    </Card>
  );
} 
