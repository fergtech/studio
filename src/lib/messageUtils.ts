/**
 * Message utility functions for encoding/decoding rich media messages
 * Stores images, files, and media as JSON in the text field
 */

export type MessageType = 'text' | 'image' | 'video' | 'file' | 'link' | 'mixed';

export interface BaseMessage {
  type: MessageType;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  text: string;
}

export interface ImageMessage extends BaseMessage {
  type: 'image';
  url: string;
  thumbnail?: string; // Optional base64 thumbnail for faster loading
  fileName?: string;
  width?: number;
  height?: number;
}

export interface VideoMessage extends BaseMessage {
  type: 'video';
  url: string;
  thumbnail?: string;
  fileName?: string;
  duration?: number;
}

export interface FileMessage extends BaseMessage {
  type: 'file';
  url: string;
  fileName: string;
  fileSize?: string;
  mimeType?: string;
}

export interface LinkMessage extends BaseMessage {
  type: 'link';
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  text?: string; // Optional accompanying text
}

export interface MixedMessage extends BaseMessage {
  type: 'mixed';
  text: string;
  media: Array<{
    type: 'image' | 'video' | 'file';
    url: string;
    fileName?: string;
    thumbnail?: string;
  }>;
}

export type RichMessage = TextMessage | ImageMessage | VideoMessage | FileMessage | LinkMessage | MixedMessage;

/**
 * Encode a rich message to store in the text field
 */
export function encodeMessage(message: RichMessage): string {
  if (message.type === 'text') {
    return message.text;
  }
  return JSON.stringify(message);
}

/**
 * Decode a message from the text field
 * Returns plain text or parsed rich message
 */
export function decodeMessage(text: string): RichMessage {
  if (!text) {
    return { type: 'text', text: '' };
  }

  // Try to parse as JSON
  if (text.startsWith('{') && text.includes('"type"')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.type && ['image', 'video', 'file', 'link', 'mixed'].includes(parsed.type)) {
        return parsed as RichMessage;
      }
    } catch {
      // If parsing fails, treat as plain text
    }
  }

  // Default to plain text
  return { type: 'text', text };
}

/**
 * Check if a message contains rich media
 */
export function hasRichMedia(text: string): boolean {
  const decoded = decodeMessage(text);
  return decoded.type !== 'text';
}

/**
 * Get a preview text for notifications (strip out media)
 */
export function getMessagePreview(text: string, maxLength: number = 50): string {
  const decoded = decodeMessage(text);

  switch (decoded.type) {
    case 'text':
      return decoded.text.length > maxLength
        ? decoded.text.substring(0, maxLength) + '...'
        : decoded.text;

    case 'image':
      return '📷 Sent an image';

    case 'video':
      return '🎥 Sent a video';

    case 'file':
      return `📄 Sent a file: ${decoded.fileName || 'file'}`;

    case 'link':
      const linkText = decoded.text || decoded.title || decoded.url;
      return `🔗 ${linkText.length > maxLength ? linkText.substring(0, maxLength) + '...' : linkText}`;

    case 'mixed':
      const preview = decoded.text || '📎 Sent media';
      return preview.length > maxLength
        ? preview.substring(0, maxLength) + '...'
        : preview;

    default:
      return text;
  }
}

/**
 * Create an image message
 */
export function createImageMessage(url: string, fileName?: string, thumbnail?: string): string {
  const message: ImageMessage = {
    type: 'image',
    url,
    fileName,
    thumbnail,
  };
  return encodeMessage(message);
}

/**
 * Create a video message
 */
export function createVideoMessage(url: string, fileName?: string, thumbnail?: string): string {
  const message: VideoMessage = {
    type: 'video',
    url,
    fileName,
    thumbnail,
  };
  return encodeMessage(message);
}

/**
 * Create a file message
 */
export function createFileMessage(url: string, fileName: string, fileSize?: string, mimeType?: string): string {
  const message: FileMessage = {
    type: 'file',
    url,
    fileName,
    fileSize,
    mimeType,
  };
  return encodeMessage(message);
}

/**
 * Create a link message with preview metadata
 */
export function createLinkMessage(url: string, metadata?: { title?: string; description?: string; image?: string; siteName?: string }, text?: string): string {
  const message: LinkMessage = {
    type: 'link',
    url,
    title: metadata?.title,
    description: metadata?.description,
    image: metadata?.image,
    siteName: metadata?.siteName,
    text,
  };
  return encodeMessage(message);
}

/**
 * Create a mixed message (text + media)
 */
export function createMixedMessage(text: string, media: Array<{ type: 'image' | 'file'; url: string; fileName?: string }>): string {
  const message: MixedMessage = {
    type: 'mixed',
    text,
    media,
  };
  return encodeMessage(message);
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
