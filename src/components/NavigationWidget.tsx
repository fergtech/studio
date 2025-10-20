import { Home, Activity, Search, Users, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

export default function NavigationWidget() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigationItems = [
    { href: '/', icon: Home, label: 'Home', isActive: pathname === '/' },
    { href: '/activity', icon: Activity, label: 'Activity', isActive: pathname === '/activity', requiresAuth: true },
    { href: '/explore', icon: Search, label: 'Explore', isActive: pathname === '/explore' },
    { href: '/issues', icon: AlertTriangle, label: 'Issues', isActive: pathname.startsWith('/issues') },
    { href: '/ideas', icon: Lightbulb, label: 'Ideas', isActive: pathname.startsWith('/ideas') },
    { href: '/initiatives', icon: Target, label: 'Initiatives', isActive: pathname.startsWith('/initiatives') },
    { href: '/societies', icon: Users, label: 'Societies', isActive: pathname.startsWith('/societies') },
  ];

  const filteredNavItems = navigationItems.filter(item => !item.requiresAuth || (item.requiresAuth && session));

  return (
    <div className="space-y-1">
      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Navigation
        </h3>
      </div>
      <nav className="space-y-0.5">
        {filteredNavItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                item.isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <IconComponent className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}