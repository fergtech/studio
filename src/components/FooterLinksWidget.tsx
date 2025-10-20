import { MessageCircle, Users, TrendingUp, Star, Info, Shield } from 'lucide-react';
import Link from 'next/link';

export default function FooterLinksWidget() {
  const footerItems = [
    {
      icon: MessageCircle,
      label: 'Give Feedback',
      href: 'https://sp-info.pages.dev/contact',
      functional: true,
    },
    {
      icon: Users,
      label: 'All Societies',
      href: '/societies',
      functional: true,
    },
    {
      icon: TrendingUp,
      label: 'Top & Trending',
      href: '/trending',
      functional: false,
    },
    {
      icon: Star,
      label: 'Features',
      href: 'https://sp-info.pages.dev/features',
      functional: true,
    },
    {
      icon: Info,
      label: 'About',
      href: 'https://sp-info.pages.dev/about/',
      functional: true,
    },
    {
      icon: Shield,
      label: 'Privacy',
      href: 'https://sp-info.pages.dev/privacy',
      functional: true,
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-1">
        {footerItems.map((item) => {
          const IconComponent = item.icon;
          const isExternal = item.href.startsWith('http');

          if (item.functional) {
            const linkContent = (
              <>
                <IconComponent className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </>
            );

            const linkClasses = "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200";

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
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground opacity-40 cursor-not-allowed"
            >
              <IconComponent className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Version/Copyright info */}
      <div className="pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground/70 text-center font-medium">
          society+ v1.0 • Built for changemakers
        </p>
      </div>
    </div>
  );
}