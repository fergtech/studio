import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin, Target, Lightbulb, Handshake, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock data for location-based content - in real implementation, this would come from APIs
const MOCK_LOCATION_DATA = {
  primary: {
    name: "Harford County",
    counts: {
      issues: 12,
      ideas: 8,
      initiatives: 5,
      societies: 3
    }
  },
  neighboring: [
    { name: "Baltimore County", distance: "15 miles" },
    { name: "Cecil County", distance: "20 miles" },
    { name: "York County", distance: "25 miles" }
  ]
};

export default function LocationBasedWidget() {
  const { primary, neighboring } = MOCK_LOCATION_DATA;

  const categoryItems = [
    { 
      icon: Target, 
      label: 'Issues', 
      count: primary.counts.issues, 
      href: '/explore?type=issues&location=harford-county',
      color: 'text-red-600'
    },
    { 
      icon: Lightbulb, 
      label: 'Ideas', 
      count: primary.counts.ideas, 
      href: '/explore?type=ideas&location=harford-county',
      color: 'text-yellow-600'
    },
    { 
      icon: Handshake, 
      label: 'Initiatives', 
      count: primary.counts.initiatives, 
      href: '/explore?type=initiatives&location=harford-county',
      color: 'text-blue-600'
    },
    { 
      icon: Users, 
      label: 'Societies', 
      count: primary.counts.societies, 
      href: '/societies',
      color: 'text-green-600'
    },
  ];

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <MapPin className="h-4 w-4" />
          Local Content
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-3">
        {/* Primary Location */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-sm">{primary.name}</h4>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Your area</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {categoryItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 flex flex-col items-start text-left hover:bg-muted/50 disabled:opacity-50"
                  disabled={item.href.includes('explore') || item.href.includes('?')} // Mock disabled state for non-existent pages
                  asChild={item.href === '/societies'}
                >
                  {item.href === '/societies' ? (
                    <Link href={item.href} className="w-full">
                      <div className="flex items-center gap-1.5 mb-1">
                        <IconComponent className={`h-3.5 w-3.5 ${item.color}`} />
                        <span className="font-medium text-xs">{item.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.count}</span>
                    </Link>
                  ) : (
                    <div className="w-full cursor-not-allowed">
                      <div className="flex items-center gap-1.5 mb-1">
                        <IconComponent className={`h-3.5 w-3.5 ${item.color}`} />
                        <span className="font-medium text-xs">{item.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.count}</span>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Neighboring Areas */}
        <div>
          <h4 className="font-semibold text-sm mb-2 text-muted-foreground">Nearby Areas</h4>
          <div className="space-y-1">
            {neighboring.map((area) => (
              <Button
                key={area.name}
                variant="ghost"
                size="sm"
                className="w-full justify-between h-7 text-xs hover:bg-muted/30 disabled:opacity-50"
                disabled // Mock disabled state - no functionality yet
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {area.name}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">{area.distance}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs h-7 text-muted-foreground hover:text-foreground disabled:opacity-50"
          disabled // Mock disabled - no "explore by location" page yet
        >
          View all locations →
        </Button>
      </CardContent>
    </Card>
  );
}