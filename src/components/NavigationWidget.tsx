import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Activity, Search, Users, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationWidget() {
  const pathname = usePathname();

  const navigationItems = [
    { href: '/', icon: Home, label: 'Home', isActive: pathname === '/' },
    { href: '/activity', icon: Activity, label: 'Activity', isActive: pathname === '/activity' },
    { href: '/explore', icon: Search, label: 'Explore', isActive: pathname === '/explore' },
    { href: '/issues', icon: AlertTriangle, label: 'Issues', isActive: pathname.startsWith('/issues') },
    { href: '/ideas', icon: Lightbulb, label: 'Ideas', isActive: pathname.startsWith('/ideas') },
    { href: '/initiatives', icon: Target, label: 'Initiatives', isActive: pathname.startsWith('/initiatives') },
    { href: '/societies', icon: Users, label: 'Societies', isActive: pathname.startsWith('/societies') },
  ];

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Navigation
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-1">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.href}
              asChild
              variant={item.isActive ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start text-sm h-8"
            >
              <Link href={item.href} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}