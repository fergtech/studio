import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, TrendingUp, Star, Info, Shield } from 'lucide-react';
import Link from 'next/link';

export default function FooterLinksWidget() {
  const footerItems = [
    { 
      icon: MessageCircle, 
      label: 'Give Feedback', 
      href: '/feedback',
      functional: false, // Mock - no feedback page yet
    },
    { 
      icon: Users, 
      label: 'All Societies', 
      href: '/societies',
      functional: true, // Functional - societies page exists
    },
    { 
      icon: TrendingUp, 
      label: 'Top & Trending', 
      href: '/trending',
      functional: false, // Mock - no trending page yet
    },
    { 
      icon: Star, 
      label: 'Features', 
      href: '/features',
      functional: false, // Mock - no features page yet
    },
    { 
      icon: Info, 
      label: 'About', 
      href: '/about',
      functional: true, // Functional - about page exists
    },
    { 
      icon: Shield, 
      label: 'Privacy', 
      href: '/privacy',
      functional: false, // Mock - no privacy page yet
    },
  ];

  return (
    <Card>
      <CardContent className="py-3 px-3">
        <div className="grid grid-cols-2 gap-1">
          {footerItems.map((item) => {
            const IconComponent = item.icon;
            
            if (item.functional) {
              return (
                <Button
                  key={item.label}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start text-xs"
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <IconComponent className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                </Button>
              );
            }

            // Mock/disabled state
            return (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className="h-8 justify-start text-xs opacity-50 cursor-not-allowed"
                disabled
              >
                <IconComponent className="h-3.5 w-3.5 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </div>
        
        {/* Version/Copyright info */}
        <div className="mt-3 pt-2 border-t border-muted">
          <p className="text-xs text-muted-foreground text-center">
            society+ v1.0 • Built for changemakers
          </p>
        </div>
      </CardContent>
    </Card>
  );
}