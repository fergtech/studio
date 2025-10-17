'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { SocialPlatform } from '@/types/social';

interface PlatformSelectorProps {
  selected: SocialPlatform[];
  onChange: (platforms: SocialPlatform[]) => void;
}

const PLATFORMS = [
  {
    id: 'INSTAGRAM' as SocialPlatform,
    name: 'Instagram',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
      </svg>
    ),
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'FACEBOOK' as SocialPlatform,
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
      </svg>
    ),
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    id: 'TIKTOK' as SocialPlatform,
    name: 'TikTok',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    gradient: 'from-black to-gray-800',
  },
];

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const handleToggle = (platform: SocialPlatform) => {
    if (selected.includes(platform)) {
      onChange(selected.filter(p => p !== platform));
    } else {
      onChange([...selected, platform]);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {PLATFORMS.map((platform) => {
        const isSelected = selected.includes(platform.id);
        const isDisabled = platform.id === 'TIKTOK'; // TikTok coming soon

        return (
          <div
            key={platform.id}
            className={`
              relative border-2 rounded-lg p-4 cursor-pointer transition-all
              ${isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !isDisabled && handleToggle(platform.id)}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-white
                bg-gradient-to-br ${platform.gradient}
              `}>
                {platform.icon}
              </div>

              <Label className="text-sm font-medium cursor-pointer">
                {platform.name}
              </Label>

              {isDisabled && (
                <span className="text-xs text-muted-foreground">
                  Coming soon
                </span>
              )}

              <Checkbox
                checked={isSelected}
                disabled={isDisabled}
                className="absolute top-2 right-2"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
