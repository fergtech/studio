import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle, Newspaper, Heart, Handshake } from 'lucide-react';
import Link from 'next/link';

export default function ResourcesWidget() {
  const resourceItems = [
    { 
      icon: Info, 
      label: 'About', 
      href: '/about',
      functional: true, // Functional - about page exists
      description: 'Learn about society+'
    },
    { 
      icon: HelpCircle, 
      label: 'Help & Support', 
      href: '/help',
      functional: false, // Mock - no help page yet
      description: 'Get help and tips'
    },
    { 
      icon: Newspaper, 
      label: 'News & Updates', 
      href: '/blog',
      functional: false, // Mock - no blog yet
      description: 'Latest platform updates'
    },
    { 
      icon: Heart, 
      label: 'Contribute', 
      href: '/contribute',
      functional: false, // Mock - no contribution page yet
      description: 'Volunteer & careers'
    },
    { 
      icon: Handshake, 
      label: 'Partner With Us', 
      href: '/partners',
      functional: false, // Mock - no partners page yet
      description: 'Business partnerships'
    },
  ];

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-1">
        {resourceItems.map((item) => {
          const IconComponent = item.icon;
          
          if (item.functional) {
            return (
              <Button
                key={item.label}
                asChild
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm h-auto p-2"
              >
                <Link href={item.href} className="flex items-start gap-2">
                  <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
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
              className="w-full justify-start text-sm h-auto p-2 opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="flex items-start gap-2">
                <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}