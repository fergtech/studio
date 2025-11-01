"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import NavigationWidget from '@/components/NavigationWidget';
import ResourcesWidget from '@/components/ResourcesWidget';
import FooterLinksWidget from '@/components/FooterLinksWidget';
import UserControlsWidget from '@/components/UserControlsWidget';
import { cn } from '@/lib/utils';

// Define available widget types
export type SidebarWidgetType =
  | 'navigation'
  | 'resources'
  | 'footer'
  | 'userControls';

interface AppSidebarProps {
  widgets?: SidebarWidgetType[];
  className?: string;
  children?: React.ReactNode;
  context?: {
    type?: 'home' | 'profile' | 'society' | 'initiative' | 'initiatives' | 'activity' | 'chat' | 'messages' | 'debates' | 'explore' | 'idea' | 'issue' | 'ideas' | 'issues' | 'societies' | 'profile-edit' | 'topic' | 'goal' | 'post';
    data?: any;
  };
  onCollapseChange?: (collapsed: boolean) => void;
}

// Determine default collapsed state based on page context
export const getDefaultCollapsedState = (context?: AppSidebarProps['context']): boolean => {
  if (!context?.type) return false; // Default to open if no context

  // Utility/Discovery pages - default to open (false = not collapsed)
  const utilityPages = ['home', 'explore', 'profile', 'profile-edit', 'chat', 'topic', 'debates', 'ideas', 'issues', 'societies', 'initiatives', 'post', 'messages'];

  // Core engagement pages - default to closed (true = collapsed)
  const corePages = ['society', 'initiative', 'activity', 'debate', 'idea', 'issue', 'goal'];

  if (utilityPages.includes(context.type)) {
    return false; // Open by default
  }

  if (corePages.includes(context.type)) {
    return true; // Closed by default
  }

  // Default to closed for unknown page types
  return true;
};

// Widget component mapping
const getWidgetComponent = (type: SidebarWidgetType, context?: any, collapsed?: boolean, isMobile?: boolean) => {
  switch (type) {
    case 'navigation':
      return <NavigationWidget key={type} />;
    case 'resources':
      return <ResourcesWidget key={type} />;
    case 'footer':
      return <FooterLinksWidget key={type} />;
    case 'userControls':
      return <UserControlsWidget key={type} collapsed={collapsed} isMobile={isMobile} />;
    default:
      return null;
  }
};

function AppSidebar({ 
  widgets = ['userControls', 'navigation', 'resources', 'footer'], 
  className,
  children,
  context,
  onCollapseChange
}: AppSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => getDefaultCollapsedState(context));

  const handleCollapseToggle = () => {
    const newCollapsed = !desktopCollapsed;
    setDesktopCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const renderWidgets = (isMobile = false) => {
    return (
      <>
        {widgets.map((widgetType) => getWidgetComponent(widgetType, context, isMobile ? false : desktopCollapsed, isMobile)).filter(Boolean)}
        {children}
      </>
    );
  };

  return (
    <>
      {/* Desktop Sidebar - Fixed Position */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-background/80 backdrop-blur-xl border-r border-border/40 transition-all duration-300 fixed left-0 top-0 h-screen z-40",
        desktopCollapsed ? "w-16" : "w-72 xl:w-80",
        className
      )}>
        {/* App Logo and Header */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-border/30">
          {!desktopCollapsed ? (
            <>
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative">
                  <Image
                    src="/apple-touch-icon.png"
                    alt="Society+ logo"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-lg group-hover:scale-105 transition-transform duration-200"
                    priority
                  />
                </div>
                <span className="font-semibold text-lg tracking-tight">society+</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseToggle}
                className="h-8 w-8 p-0 hover:bg-accent/50 rounded-lg transition-colors flex-shrink-0"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full">
              <Link href="/" className="flex items-center justify-center group">
                <Image
                  src="/apple-touch-icon.png"
                  alt="Society+ logo"
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-lg hover:scale-110 transition-transform duration-200"
                  priority
                />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseToggle}
                className="h-7 w-7 p-0 hover:bg-accent/50 rounded-lg transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar Content */}
        <div className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-foreground/10 hover:scrollbar-thumb-foreground/20",
          desktopCollapsed ? "px-2 py-4" : "px-3 py-4"
        )}>
          {!desktopCollapsed && (
            <div className="space-y-3">
              {renderWidgets()}
            </div>
          )}
          {desktopCollapsed && (
            <div className="space-y-2">
              {/* Collapsed state - no content, just the chevron button in header handles expand */}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar removed: no sidebar or toggle on mobile/tablet screens */}
    </>
  );
}

// Export both default and named for compatibility
export default AppSidebar;
export { AppSidebar };