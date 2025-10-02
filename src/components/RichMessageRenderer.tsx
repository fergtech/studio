"use client";

import React from 'react';
import Image from 'next/image';
import { decodeMessage, RichMessage } from '@/lib/messageUtils';
import { Download, FileIcon, Image as ImageIcon, ExternalLink, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LinkPreview } from '@/components/ui/link-preview';

interface RichMessageRendererProps {
  text: string;
  className?: string;
  isOwnMessage?: boolean;
}

export function RichMessageRenderer({ text, className, isOwnMessage }: RichMessageRendererProps) {
  const message = decodeMessage(text);

  switch (message.type) {
    case 'text':
      return (
        <p className={cn("text-sm break-words whitespace-pre-wrap", className)}>
          {message.text}
        </p>
      );

    case 'image':
      return (
        <div className={cn("space-y-2", className)}>
          <div className="relative rounded-lg overflow-hidden bg-muted max-w-sm">
            <Image
              src={message.url}
              alt={message.fileName || 'Shared image'}
              width={400}
              height={300}
              className="w-full h-auto object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      );

    case 'video':
      return (
        <div className={cn("space-y-2", className)}>
          <div className="relative rounded-lg overflow-hidden bg-black max-w-sm">
            <video
              src={message.url}
              controls
              className="w-full h-auto"
              poster={message.thumbnail}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      );

    case 'file':
      return (
        <div className={cn("space-y-2", className)}>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className="flex-shrink-0">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              {message.fileSize && (
                <p className="text-xs text-muted-foreground">{message.fileSize}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              asChild
            >
              <a
                href={message.url}
                download={message.fileName}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      );

    case 'link':
      return (
        <div className={cn("space-y-2", className)}>
          {message.text && (
            <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
          )}
          {(message.title || message.description || message.image) ? (
            <LinkPreview
              metadata={{
                title: message.title || message.url,
                description: message.description,
                image: message.image,
                siteName: message.siteName,
                url: message.url,
              }}
              className="max-w-sm"
            />
          ) : (
            <a
              href={message.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate">{message.url}</span>
            </a>
          )}
        </div>
      );

    case 'mixed':
      return (
        <div className={cn("space-y-3", className)}>
          {message.text && (
            <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
          )}
          <div className="space-y-2">
            {message.media.map((item, index) => (
              <div key={index}>
                {item.type === 'image' ? (
                  <div className="relative rounded-lg overflow-hidden bg-muted max-w-sm">
                    <Image
                      src={item.url}
                      alt={item.fileName || `Image ${index + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                ) : item.type === 'video' ? (
                  <div className="relative rounded-lg overflow-hidden bg-black max-w-sm">
                    <video
                      src={item.url}
                      controls
                      className="w-full h-auto"
                      poster={item.thumbnail}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <FileIcon className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.fileName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                    >
                      <a
                        href={item.url}
                        download={item.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return <p className={cn("text-sm", className)}>{text}</p>;
  }
}
