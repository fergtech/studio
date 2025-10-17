/**
 * Content Moderation Service
 *
 * AI-powered moderation for all content types (text, images, videos)
 * Uses Cloudflare Workers AI (primary) + Gemini (fallback)
 */

import { generateAIText } from '@/lib/aiHelper';

export interface ModerationConfig {
  textThreshold: number;
  imageThreshold: number;
  autoRejectThreshold: number;
  humanReviewThreshold: number;
}

export interface ModerationResult {
  approved: boolean;
  confidence: number;
  flags: string[];
  reasoning?: string;
  requiresHumanReview: boolean;
  provider?: string;
}

export interface ModerationRequest {
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  userId: string;
  contentType: 'post' | 'comment' | 'initiative' | 'issue' | 'idea';
}

class ContentModerationService {
  private config: ModerationConfig = {
    textThreshold: 0.7,        // Min confidence to auto-approve
    imageThreshold: 0.6,       // Min confidence for images
    autoRejectThreshold: 0.3,  // Below this = auto-reject
    humanReviewThreshold: 0.6  // Between reject and approve = human review
  };

  /**
   * Main moderation function - handles all content types
   */
  async moderateContent(request: ModerationRequest): Promise<ModerationResult> {
    const results: Partial<ModerationResult>[] = [];

    console.log('🔍 Starting content moderation for:', request.contentType);

    // Text moderation
    if (request.content) {
      const textResult = await this.moderateText(request.content);
      results.push(textResult);
    }

    // Image moderation
    if (request.imageUrl) {
      const imageResult = await this.moderateImage(request.imageUrl);
      results.push(imageResult);
    }

    // Video moderation (extract frames + analyze)
    if (request.videoUrl) {
      const videoResult = await this.moderateVideo(request.videoUrl);
      results.push(videoResult);
    }

    // If no content to moderate, auto-approve
    if (results.length === 0) {
      return {
        approved: true,
        confidence: 1.0,
        flags: [],
        requiresHumanReview: false
      };
    }

    return this.combineResults(results);
  }

  /**
   * Moderate text content using AI (Cloudflare/Ollama + Gemini fallback)
   */
  async moderateText(content: string): Promise<Partial<ModerationResult>> {
    try {
      if (!content || content.trim().length === 0) {
        return { approved: true, confidence: 1.0, flags: [] };
      }

      console.log('📝 Moderating text content...');

      const moderationPrompt = `You are a content moderation AI. Analyze the following content for policy violations.

Content: "${content}"

Check for:
- Hate speech, harassment, discrimination
- Spam, scams, or aggressive commercial solicitation (NOTE: Legitimate discussion about housing, products, services, or marketplace activity in appropriate contexts is ALLOWED)
- Violence, graphic content, threats
- Adult/sexual content
- Misinformation, conspiracy theories
- Illegal activities

IMPORTANT: Do NOT flag content as "commercial" if it is:
- A legitimate discussion about housing, real estate, renting, or buying
- Sharing information about products/services in a discussion context
- Asking for recommendations or sharing experiences
- Community marketplace posts in appropriate topics

ONLY flag as "commercial" or "spam" if it contains:
- Aggressive advertising or promotional language
- Multiple links to commercial websites
- Obvious scam patterns or pyramid schemes
- Unsolicited business promotion in unrelated contexts

Respond ONLY with valid JSON in this exact format:
{
  "confidence": 0.85,
  "flags": ["spam", "commercial"],
  "reasoning": "Brief explanation of flags"
}

If content is acceptable, respond:
{
  "confidence": 0.95,
  "flags": [],
  "reasoning": "Content appears acceptable"
}`;

      // Use existing AI helper (Cloudflare primary, Gemini fallback)
      const aiResponse = await generateAIText(moderationPrompt);

      if (!aiResponse.success || !aiResponse.text) {
        console.warn('⚠️ AI moderation unavailable, defaulting to safe approval');
        return { approved: true, confidence: 0.5, flags: ['moderation-unavailable'] };
      }

      // Parse AI response
      let moderationResult;
      try {
        // Clean JSON response
        let cleaned = aiResponse.text.trim();
        cleaned = cleaned.replace(/^```json\n?|\n?```$/gi, '').trim();

        // Extract JSON object
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          moderationResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI moderation response:', parseError);
        console.log('Raw AI response:', aiResponse.text);
        // Default to safe approval on parse error
        return {
          approved: true,
          confidence: 0.5,
          flags: ['parse-error'],
          reasoning: 'Could not parse moderation result'
        };
      }

      const approved = moderationResult.confidence >= this.config.textThreshold &&
                      moderationResult.flags.length === 0;

      console.log(`✅ Text moderation complete: ${approved ? 'APPROVED' : 'FLAGGED'}`);

      return {
        approved,
        confidence: moderationResult.confidence || 0.5,
        flags: moderationResult.flags || [],
        reasoning: moderationResult.reasoning,
        provider: aiResponse.provider
      };

    } catch (error) {
      console.error('❌ Text moderation error:', error);
      // Fail open - approve but flag for review
      return {
        approved: true,
        confidence: 0.5,
        flags: ['moderation-error'],
        reasoning: 'Moderation system error'
      };
    }
  }

  /**
   * Moderate image using Cloudflare Workers AI (LLaVA vision model)
   */
  async moderateImageWithCloudflare(imageUrl: string): Promise<Partial<ModerationResult>> {
    try {
      console.log('☁️ Moderating image with Cloudflare Workers AI...');

      const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (!cfAccountId || !cfApiToken) {
        console.warn('⚠️ Cloudflare credentials not found, skipping');
        return { approved: true, confidence: 0.5, flags: ['cloudflare-unavailable'] };
      }

      // Fetch image as blob
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.warn(`⚠️ Failed to fetch image: ${imageResponse.status}`);
        return { approved: true, confidence: 0.5, flags: ['image-fetch-error'] };
      }

      const imageBlob = await imageResponse.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const imageArray = Array.from(new Uint8Array(arrayBuffer));

      // Call Cloudflare Workers AI with LLaVA vision model
      const modelUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`;

      const prompt = `Analyze this image for inappropriate content. Check for:
- Adult/sexual content or nudity
- Violence, gore, or graphic content
- Hate symbols or discriminatory imagery
- Weapons or threatening content
- Spam or commercial solicitation

Respond ONLY with valid JSON in this exact format:
{
  "flags": ["flag1", "flag2"],
  "reasoning": "Brief explanation"
}

If image is acceptable, respond:
{
  "flags": [],
  "reasoning": "Image appears acceptable"
}`;

      const cfResponse = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageArray,
          prompt: prompt,
          max_tokens: 256
        })
      });

      if (!cfResponse.ok) {
        console.warn(`⚠️ Cloudflare Vision API error: ${cfResponse.status}`);
        return { approved: true, confidence: 0.5, flags: ['cloudflare-vision-error'] };
      }

      const result = await cfResponse.json();
      const description = result.result?.description || result.description || '';

      if (!description) {
        console.warn('⚠️ No description returned from Cloudflare vision model');
        return { approved: true, confidence: 0.5, flags: ['no-vision-result'] };
      }

      // Parse JSON response
      let moderationResult;
      try {
        let cleaned = description.trim();
        cleaned = cleaned.replace(/^```json\n?|\n?```$/gi, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          moderationResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in Cloudflare vision response');
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse Cloudflare vision response:', description);
        return { approved: true, confidence: 0.5, flags: ['vision-parse-error'] };
      }

      const flags = moderationResult.flags || [];
      const confidence = flags.length === 0 ? 0.9 : 0.4;

      console.log(`☁️ Cloudflare vision moderation: ${flags.length === 0 ? 'CLEAN' : 'FLAGGED'}`);

      return {
        approved: confidence >= this.config.imageThreshold && flags.length === 0,
        confidence,
        flags,
        reasoning: moderationResult.reasoning,
        provider: 'cloudflare-vision'
      };

    } catch (error) {
      console.error('❌ Cloudflare image moderation error:', error);
      return {
        approved: true,
        confidence: 0.5,
        flags: ['cloudflare-image-error']
      };
    }
  }

  /**
   * Moderate image using Google Vision API (fallback)
   */
  async moderateImageWithVision(imageUrl: string): Promise<Partial<ModerationResult>> {
    try {
      console.log('👁️ Moderating image with Google Vision API...');

      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ Google Vision API key not found');
        return { approved: true, confidence: 0.5, flags: ['vision-unavailable'] };
      }

      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { source: { imageUri: imageUrl } },
              features: [
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'TEXT_DETECTION' }
              ]
            }]
          })
        }
      );

      if (!visionResponse.ok) {
        console.warn(`⚠️ Vision API error: ${visionResponse.status}`);
        return { approved: true, confidence: 0.5, flags: ['vision-error'] };
      }

      const visionResult = await visionResponse.json();
      const safeSearch = visionResult.responses?.[0]?.safeSearchAnnotation;
      const textDetection = visionResult.responses?.[0]?.textAnnotations;

      const flags: string[] = [];
      let confidence = 1.0;

      if (safeSearch) {
        if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.adult)) {
          flags.push('adult-content');
          confidence -= 0.5;
        }
        if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.violence)) {
          flags.push('violence');
          confidence -= 0.4;
        }
        if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.racy)) {
          flags.push('suggestive');
          confidence -= 0.3;
        }
      }

      if (textDetection && textDetection[0]) {
        const extractedText = textDetection[0].description;
        console.log('📝 Text detected in image, moderating...');
        const textModeration = await this.moderateText(extractedText);
        if (!textModeration.approved && textModeration.flags) {
          flags.push(...textModeration.flags, 'text-in-image');
          confidence = Math.min(confidence, textModeration.confidence || 0.5);
        }
      }

      console.log(`👁️ Vision API moderation: ${flags.length === 0 ? 'CLEAN' : 'FLAGGED'}`);

      return {
        approved: confidence >= this.config.imageThreshold && flags.length === 0,
        confidence: Math.max(0, confidence),
        flags,
        reasoning: flags.length > 0
          ? `Image flagged for: ${flags.join(', ')}`
          : 'Image passed moderation',
        provider: 'google-vision'
      };

    } catch (error) {
      console.error('❌ Google Vision moderation error:', error);
      return {
        approved: true,
        confidence: 0.5,
        flags: ['vision-error']
      };
    }
  }

  /**
   * Check if URL is a video file
   */
  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  }

  /**
   * Moderate image using Cloudflare (primary) + Google Vision (fallback)
   */
  async moderateImage(imageUrl: string): Promise<Partial<ModerationResult>> {
    try {
      if (!imageUrl) {
        return { approved: true, confidence: 1.0, flags: [] };
      }

      // Check if it's a video - if so, flag for human review
      if (this.isVideoUrl(imageUrl)) {
        console.log('🎥 Video detected, flagging for human review...');
        return {
          approved: false,
          confidence: 0.7,
          flags: ['video-content'],
          reasoning: 'Video content requires human review (automated video analysis not yet implemented)',
          requiresHumanReview: true
        };
      }

      console.log('🖼️ Moderating image content...');

      // Try Cloudflare Workers AI first (1M requests/day)
      const cfResult = await this.moderateImageWithCloudflare(imageUrl);
      if (cfResult.confidence && cfResult.confidence > 0.5) {
        return cfResult;
      }

      // Fallback to Google Vision API (1K requests/month)
      console.log('🔄 Cloudflare vision unavailable, trying Google Vision...');
      const visionResult = await this.moderateImageWithVision(imageUrl);
      return visionResult;

    } catch (error) {
      console.error('❌ Image moderation error:', error);
      return {
        approved: true,
        confidence: 0.5,
        flags: ['image-moderation-error']
      };
    }
  }

  /**
   * Moderate video (placeholder - extract frames and analyze)
   */
  async moderateVideo(videoUrl: string): Promise<Partial<ModerationResult>> {
    try {
      console.log('🎥 Video moderation requested for:', videoUrl);

      // For now, just flag for human review
      // Full implementation would extract frames and run image moderation on them
      return {
        approved: true,
        confidence: 0.7,
        flags: ['video-content'],
        reasoning: 'Video flagged for review (frame analysis not implemented yet)'
      };

    } catch (error) {
      console.error('❌ Video moderation error:', error);
      return {
        approved: true,
        confidence: 0.5,
        flags: ['video-moderation-error']
      };
    }
  }

  /**
   * Combine multiple moderation results into final decision
   */
  private combineResults(results: Partial<ModerationResult>[]): ModerationResult {
    if (results.length === 0) {
      return {
        approved: true,
        confidence: 1.0,
        flags: [],
        requiresHumanReview: false
      };
    }

    // Calculate average confidence
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;

    // Combine all flags
    const allFlags = results.flatMap(r => r.flags || []);
    const uniqueFlags = [...new Set(allFlags)];

    // High-risk flags that trigger strict review
    const highRiskFlags = [
      'hate-speech',
      'violence',
      'adult-content',
      'threats',
      'illegal'
    ];
    const hasHighRiskFlags = uniqueFlags.some(flag => highRiskFlags.includes(flag));

    // Decision logic
    let approved = true;
    let requiresHumanReview = false;

    if (hasHighRiskFlags || avgConfidence < this.config.autoRejectThreshold) {
      // Auto-reject high-risk content
      approved = false;
      requiresHumanReview = false;
    } else if (avgConfidence < this.config.humanReviewThreshold || uniqueFlags.length > 0) {
      // Borderline content - send to human review
      approved = false;
      requiresHumanReview = true;
    } else {
      // Clean content - auto-approve
      approved = true;
      requiresHumanReview = false;
    }

    // Combine reasoning
    const reasoning = this.generateReasoning(results, uniqueFlags, approved, requiresHumanReview);

    console.log(`📊 Final moderation decision: ${approved ? 'APPROVED' : 'FLAGGED'} (${requiresHumanReview ? 'Human Review' : 'Auto'})`);

    return {
      approved,
      confidence: avgConfidence,
      flags: uniqueFlags,
      requiresHumanReview,
      reasoning
    };
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    results: Partial<ModerationResult>[],
    flags: string[],
    approved: boolean,
    requiresHumanReview: boolean
  ): string {
    if (approved) {
      return 'Content passed automated moderation checks.';
    }

    if (requiresHumanReview) {
      return `Content flagged for human review: ${flags.join(', ') || 'low confidence score'}`;
    }

    return `Content violates community guidelines: ${flags.join(', ')}`;
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();
