export type SocialPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK';

export type SocialPostStatus = 'PENDING' | 'POSTING' | 'SUCCESS' | 'FAILED';

export type ContentType = 'idea' | 'issue' | 'initiative' | 'post';

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformUserId: string;
  platformUsername?: string;
  accessToken: string; // Will be encrypted
  refreshToken?: string; // Will be encrypted
  tokenExpiresAt?: Date;
  scope: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialPost {
  id: string;
  userId: string;
  socialAccountId: string;
  contentType: ContentType;
  contentId: string;
  platform: SocialPlatform;
  platformPostId?: string;
  platformPostUrl?: string;
  caption?: string;
  imageUrl?: string;
  status: SocialPostStatus;
  errorMessage?: string;
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    reach?: number;
    impressions?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareContentRequest {
  contentType: ContentType;
  contentId: string;
  platforms: SocialPlatform[];
  customCaption?: string;
  imageSize?: 'story' | 'feed' | 'facebook';
}

export interface ShareContentResponse {
  success: boolean;
  results: {
    platform: SocialPlatform;
    success: boolean;
    postId?: string;
    postUrl?: string;
    error?: string;
  }[];
}

export interface InstagramMediaContainerResponse {
  id: string; // Container ID for publishing
}

export interface InstagramPublishResponse {
  id: string; // Published media ID
}

export interface FacebookPostResponse {
  id: string; // Post ID
  post_url?: string;
}

export interface PlatformAdapter {
  uploadImage(imageUrl: string, caption?: string): Promise<string>; // Returns platform post ID
  getPostUrl(postId: string): Promise<string>;
  getMetrics?(postId: string): Promise<SocialPost['metrics']>;
}
