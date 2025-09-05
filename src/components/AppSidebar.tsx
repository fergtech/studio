"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import NavigationWidget from '@/components/NavigationWidget';
import SmartSuggestionsWidget from '@/components/SmartSuggestionsWidget';
import LocationBasedWidget from '@/components/LocationBasedWidget';
import ResourcesWidget from '@/components/ResourcesWidget';
import FooterLinksWidget from '@/components/FooterLinksWidget';
import UserControlsWidget from '@/components/UserControlsWidget';
import { cn } from '@/lib/utils';

// Define available widget types
export type SidebarWidgetType = 
  | 'navigation'
  | 'suggestions' 
  | 'location'
  | 'resources'
  | 'footer'
  | 'userControls';

interface AppSidebarProps {
  widgets?: SidebarWidgetType[];
  className?: string;
  children?: React.ReactNode;
  context?: {
    type?: 'home' | 'profile' | 'society' | 'initiative' | 'activity' | 'chat' | 'debate' | 'explore' | 'idea' | 'issue' | 'societies' | 'profile-edit';
    data?: any;
  };
  onCollapseChange?: (collapsed: boolean) => void;
}

// Widget component mapping
const getWidgetComponent = (type: SidebarWidgetType, context?: any, collapsed?: boolean) => {
  switch (type) {
    case 'navigation':
      return <NavigationWidget key={type} />;
    case 'suggestions':
      return <SmartSuggestionsWidget key={type} />;
    case 'location':
      return <LocationBasedWidget key={type} />;
    case 'resources':
      return <ResourcesWidget key={type} />;
    case 'footer':
      return <FooterLinksWidget key={type} />;
    case 'userControls':
      return <UserControlsWidget key={type} collapsed={collapsed} />;
    default:
      return null;
  }
};

function AppSidebar({ 
  widgets = ['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer'], 
  className,
  children,
  context,
  onCollapseChange
}: AppSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const handleCollapseToggle = () => {
    const newCollapsed = !desktopCollapsed;
    setDesktopCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const renderWidgets = () => {
    return (
      <>
        {widgets.map((widgetType) => getWidgetComponent(widgetType, context, desktopCollapsed)).filter(Boolean)}
        {children}
      </>
    );
  };

  return (
    <>
      {/* Desktop Sidebar - Fixed Position */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-card/50 border-r border-border transition-all duration-300 fixed left-0 top-0 h-screen z-40",
        desktopCollapsed ? "w-16" : "w-80 xl:w-96",
        className
      )}>
        {/* App Logo and Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!desktopCollapsed ? (
            <>
              <Link href="/" className="flex items-center space-x-2">
                <img src="/apple-touch-icon.png" alt="Society+ logo" className="h-6 w-6 rounded-full" />
                <span className="font-bold text-lg">society+</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseToggle}
                className="h-8 w-8 p-0 hover:bg-muted flex-shrink-0"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-1 w-full">
              <Link href="/" className="flex items-center justify-center">
                <img src="/apple-touch-icon.png" alt="Society+ logo" className="h-6 w-6 rounded-full hover:scale-110 transition-transform" />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseToggle}
                className="h-6 w-6 p-0 hover:bg-muted"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Sidebar Content */}
        <div className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300/20 hover:scrollbar-thumb-gray-300/40 space-y-4",
          desktopCollapsed ? "px-2" : "px-4 lg:px-6"
        )}>
          {!desktopCollapsed && renderWidgets()}
          {desktopCollapsed && (
            <div className="space-y-2">
              {/* Collapsed state - no content, just the chevron button in header handles expand */}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar - Only visible on mobile/tablet screens */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="fixed top-4 left-4 z-50 lg:hidden bg-background/95 backdrop-blur-sm border shadow-lg rounded-full px-3 py-2 h-12 flex items-center justify-center gap-2 hover:bg-background/90 transition-all duration-200 min-w-fit"
            aria-label="Open sidebar"
          >
            <img src="/apple-touch-icon.png" alt="Society+ logo" className="h-6 w-6 rounded-full flex-shrink-0" />
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 max-h-screen overflow-y-auto">
          <SheetTitle className="sr-only">Sidebar Menu</SheetTitle>
          
          {/* Mobile Header with Logo */}
          <div className="flex items-center p-4 border-b border-border">
            <Link href="/" className="flex items-center space-x-2" onClick={() => setSidebarOpen(false)}>
              <img src="/apple-touch-icon.png" alt="Society+ logo" className="h-6 w-6 rounded-full" />
              <span className="font-bold text-lg">society+</span>
            </Link>
          </div>
          
          <div className="space-y-4 p-4">
            {renderWidgets()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Export both default and named for compatibility
export default AppSidebar;
export { AppSidebar };