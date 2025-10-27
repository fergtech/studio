import { Info, HelpCircle, Newspaper, Heart, Handshake, BookOpen } from 'lucide-react';
import Link from 'next/link';

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
      <aside className="hidden lg:block fixed top-36 right-10 w-72 z-20">
        <div className="bg-gray-900/70 rounded-2xl shadow-sm p-4 flex flex-col gap-3 border border-gray-700/50">
          <h3 className="text-lg font-semibold text-blue-200 mb-1 flex items-center gap-2">
            <BookOpen className="text-blue-300" /> Resources
          </h3>

        <div className="space-y-2">
          {resourceItems.map((item) => {
            const IconComponent = item.icon;
            const isExternal = item.href.startsWith('http');

            if (item.functional) {
              const linkContent = (
                <>
                  <IconComponent className="h-5 w-5 flex-shrink-0 text-blue-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </>
              );

                const linkClasses = "flex items-start gap-2 px-2 py-2 rounded-md transition-all duration-200 hover:bg-gray-700/30 group";

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

            return null;
          })}
        </div>

        {/* Company info footer */}
          <div className="mt-3 border-t border-gray-700/50 pt-3 text-xs text-gray-500 flex flex-col gap-1">
          <div className="text-center">© 2025 society+ (SocietyPlus)</div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://sp-info.pages.dev/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-gray-300">Privacy</a>
            <a href="https://sp-info.pages.dev/contact" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-gray-300">Feedback</a>
          </div>
        </div>
      </div>
    </aside>
  );
}