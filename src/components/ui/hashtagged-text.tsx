'use client';

import Link from 'next/link';
import { extractHashtags } from '@/utils/hashtagUtils';

interface HashtaggedTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with clickable hashtags
 * Example: "Hello #world" -> "Hello <a href="/topics/world">#world</a>"
 */
export function HashtaggedText({ text, className }: HashtaggedTextProps) {
  if (!text) return null;

  // Extract hashtags
  const hashtags = extractHashtags(text);

  if (hashtags.length === 0) {
    // No hashtags, return plain text
    return <span className={className}>{text}</span>;
  }

  // Split text and replace hashtags with links
  const parts: (string | JSX.Element)[] = [];
  let remainingText = text;
  let keyCounter = 0;

  // Process each hashtag
  hashtags.forEach(hashtag => {
    const hashtagPattern = new RegExp(`#${hashtag}(?=\\s|$)`, 'i');
    const match = remainingText.match(hashtagPattern);

    if (match) {
      const fullHashtag = match[0]; // e.g., "#housing"
      const index = remainingText.indexOf(fullHashtag);

      // Add text before hashtag
      if (index > 0) {
        parts.push(remainingText.substring(0, index));
      }

      // Add clickable hashtag
      parts.push(
        <Link
          key={`hashtag-${keyCounter++}`}
          href={`/topics/${hashtag.toLowerCase()}`}
          className="text-blue-400 hover:text-blue-300 hover:underline font-semibold"
          onClick={(e) => e.stopPropagation()} // Prevent parent click handlers
        >
          {fullHashtag}
        </Link>
      );

      // Update remaining text
      remainingText = remainingText.substring(index + fullHashtag.length);
    }
  });

  // Add any remaining text
  if (remainingText) {
    parts.push(remainingText);
  }

  return <span className={className}>{parts}</span>;
}
