import { Info, HelpCircle, Newspaper, Heart, Handshake } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ResourcesWidget() {
  const resourceItems = [
    {
      icon: Info,
      label: 'About',
      href: 'https://sp-info.pages.dev/about',
      functional: true,
      description: 'Learn about society+'
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      href: 'https://sp-info.pages.dev/help',
      functional: true,
      description: 'Get help and tips'
    },
    {
      icon: Newspaper,
      label: 'News & Updates',
      href: 'https://sp-info.pages.dev/blog',
      functional: true,
      description: 'Latest platform updates'
    },
    {
      icon: Heart,
      label: 'Contribute',
      href: 'https://sp-info.pages.dev/contribute',
      functional: true,
      description: 'Volunteer & careers'
    },
    {
      icon: Handshake,
      label: 'Partner With Us',
      href: 'https://sp-info.pages.dev/partner',
      functional: true,
      description: 'Business partnerships'
    },
  ];

  return (
    <div className="space-y-1">
      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Resources
        </h3>
      </div>
      <div className="space-y-0.5">
        {resourceItems.map((item) => {
          const IconComponent = item.icon;
          const isExternal = item.href.startsWith('http');

          if (item.functional) {
            const linkContent = (
              <>
                <IconComponent className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </>
            );

            const linkClasses = "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-accent/50 group";

            return isExternal ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
              >
                {linkContent}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={linkClasses}
              >
                {linkContent}
              </Link>
            );
          }

          // Mock/disabled state
          return (
            <div
              key={item.label}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg opacity-50 cursor-not-allowed"
            >
              <IconComponent className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}