import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';

export default function TrendingWidget() {
  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="h-4 w-4" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3">
        <div className="text-xs text-muted-foreground">Trending content coming soon.</div>
      </CardContent>
    </Card>
  );
} 
