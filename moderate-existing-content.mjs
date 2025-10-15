#!/usr/bin/env node

/**
 * Moderate Existing Content Script
 *
 * Runs AI moderation on all existing content that hasn't been moderated yet
 * or needs re-moderation.
 *
 * Usage:
 * - Local: node moderate-existing-content.mjs
 * - Production: DATABASE_URL="..." node moderate-existing-content.mjs
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

// Import AI helper with Cloudflare + Gemini fallback
async function generateWithCloudflare(prompt) {
  try {
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!cfAccountId || !cfApiToken) {
      return { text: '', provider: 'error', success: false };
    }

    const modelUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;

    const response = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation AI assistant. Provide clear, structured responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 512,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      return { text: '', provider: 'error', success: false };
    }

    const result = await response.json();
    const generatedText = result.result?.response || '';

    if (generatedText) {
      return { text: generatedText, provider: 'cloudflare', success: true };
    }

    return { text: '', provider: 'error', success: false };
  } catch (error) {
    return { text: '', provider: 'error', success: false };
  }
}

async function generateWithGemini(prompt) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return { text: '', provider: 'error', success: false };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      return { text: '', provider: 'error', success: false };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return { text, provider: 'gemini', success: true };
  } catch (error) {
    return { text: '', provider: 'error', success: false };
  }
}

// Main AI generation function with Cloudflare primary, Gemini fallback
async function generateAIText(prompt) {
  // Try Cloudflare first (1M requests/day)
  const cfResult = await generateWithCloudflare(prompt);
  if (cfResult.success) {
    return cfResult;
  }

  // Fallback to Gemini (50 requests/day)
  console.log('⚠️ Cloudflare unavailable, falling back to Gemini...');
  const geminiResult = await generateWithGemini(prompt);
  if (geminiResult.success) {
    return geminiResult;
  }

  // Both failed
  console.error('❌ All AI providers failed');
  return { text: '', provider: 'error', success: false };
}

// Moderate text content
async function moderateText(content) {
  const moderationPrompt = `You are a content moderation AI. Analyze the following content for policy violations.

Content: "${content}"

Check for:
- Hate speech, harassment, discrimination
- Spam, scams, commercial solicitation
- Violence, graphic content, threats
- Adult/sexual content
- Misinformation, conspiracy theories
- Illegal activities

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

  const aiResponse = await generateAIText(moderationPrompt);

  if (!aiResponse.success) {
    console.warn('⚠️ AI moderation unavailable for this item');
    return {
      approved: true,
      confidence: 0.5,
      flags: ['moderation-unavailable'],
      reasoning: 'AI unavailable during batch moderation'
    };
  }

  try {
    // Parse JSON response
    let cleaned = aiResponse.text.trim();
    cleaned = cleaned.replace(/^```json\n?|\n?```$/gi, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const moderationResult = JSON.parse(jsonMatch[0]);

    const textThreshold = 0.7;
    const approved = moderationResult.confidence >= textThreshold && moderationResult.flags.length === 0;

    return {
      approved,
      confidence: moderationResult.confidence || 0.5,
      flags: moderationResult.flags || [],
      reasoning: moderationResult.reasoning
    };
  } catch (error) {
    console.warn('⚠️ Failed to parse AI response, defaulting to approved');
    return {
      approved: true,
      confidence: 0.5,
      flags: ['parse-error'],
      reasoning: 'Could not parse moderation result'
    };
  }
}

// Determine moderation status
function determineStatus(moderationResult) {
  const autoRejectThreshold = 0.3;
  const humanReviewThreshold = 0.6;

  const highRiskFlags = ['hate-speech', 'violence', 'adult-content', 'threats', 'illegal'];
  const hasHighRiskFlags = moderationResult.flags.some(flag => highRiskFlags.includes(flag));

  if (hasHighRiskFlags || moderationResult.confidence < autoRejectThreshold) {
    return 'rejected';
  } else if (moderationResult.confidence < humanReviewThreshold || moderationResult.flags.length > 0) {
    return 'pending_review';
  } else {
    return 'approved';
  }
}

// Check if URL is a video file
function isVideoUrl(url) {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

// Moderate posts
async function moderatePosts() {
  console.log('\n📝 Moderating GeneralPosts...');

  const posts = await prisma.generalPost.findMany({
    select: {
      id: true,
      content: true,
      media: { select: { url: true } }
    }
  });

  console.log(`Found ${posts.length} posts to moderate (all content)`);

  let approved = 0, rejected = 0, review = 0;

  for (const post of posts) {
    try {
      const result = await moderateText(post.content);

      // Check if post has video media - flag for human review
      const hasVideo = post.media?.some(m => isVideoUrl(m.url));
      if (hasVideo) {
        result.flags.push('video-content');
        result.reasoning = (result.reasoning || '') + ' | Video content requires human review';
      }

      const status = determineStatus(result);

      await prisma.generalPost.update({
        where: { id: post.id },
        data: {
          moderationStatus: status,
          moderationFlags: result.flags,
          moderationScore: result.confidence,
          moderationReasoning: result.reasoning
        }
      });

      if (status === 'approved') approved++;
      else if (status === 'rejected') rejected++;
      else review++;

      process.stdout.write(`\r✓ ${approved + rejected + review}/${posts.length} (✅ ${approved} | ❌ ${rejected} | ⏳ ${review})`);

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`\n❌ Error moderating post ${post.id}:`, error.message);
    }
  }

  console.log(`\n✅ Posts complete: ${approved} approved, ${rejected} rejected, ${review} pending review\n`);
}

// Moderate issues
async function moderateIssues() {
  console.log('\n🚨 Moderating Issues...');

  const issues = await prisma.issue.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      media: { select: { url: true } }
    }
  });

  console.log(`Found ${issues.length} issues to moderate (all content)`);

  let approved = 0, rejected = 0, review = 0;

  for (const issue of issues) {
    try {
      const content = `${issue.title}\n\n${issue.description}`;
      const result = await moderateText(content);

      // Check if issue has video media - flag for human review
      const hasVideo = issue.media?.some(m => isVideoUrl(m.url));
      if (hasVideo) {
        result.flags.push('video-content');
        result.reasoning = (result.reasoning || '') + ' | Video content requires human review';
      }

      const status = determineStatus(result);

      await prisma.issue.update({
        where: { id: issue.id },
        data: {
          moderationStatus: status,
          moderationFlags: result.flags,
          moderationScore: result.confidence,
          moderationReasoning: result.reasoning
        }
      });

      if (status === 'approved') approved++;
      else if (status === 'rejected') rejected++;
      else review++;

      process.stdout.write(`\r✓ ${approved + rejected + review}/${issues.length} (✅ ${approved} | ❌ ${rejected} | ⏳ ${review})`);

      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`\n❌ Error moderating issue ${issue.id}:`, error.message);
    }
  }

  console.log(`\n✅ Issues complete: ${approved} approved, ${rejected} rejected, ${review} pending review\n`);
}

// Moderate ideas
async function moderateIdeas() {
  console.log('\n💡 Moderating Ideas...');

  const ideas = await prisma.idea.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      media: { select: { url: true } }
    }
  });

  console.log(`Found ${ideas.length} ideas to moderate (all content)`);

  let approved = 0, rejected = 0, review = 0;

  for (const idea of ideas) {
    try {
      const content = `${idea.title}\n\n${idea.description}`;
      const result = await moderateText(content);

      // Check if idea has video media - flag for human review
      const hasVideo = idea.media?.some(m => isVideoUrl(m.url));
      if (hasVideo) {
        result.flags.push('video-content');
        result.reasoning = (result.reasoning || '') + ' | Video content requires human review';
      }

      const status = determineStatus(result);

      await prisma.idea.update({
        where: { id: idea.id },
        data: {
          moderationStatus: status,
          moderationFlags: result.flags,
          moderationScore: result.confidence,
          moderationReasoning: result.reasoning
        }
      });

      if (status === 'approved') approved++;
      else if (status === 'rejected') rejected++;
      else review++;

      process.stdout.write(`\r✓ ${approved + rejected + review}/${ideas.length} (✅ ${approved} | ❌ ${rejected} | ⏳ ${review})`);

      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`\n❌ Error moderating idea ${idea.id}:`, error.message);
    }
  }

  console.log(`\n✅ Ideas complete: ${approved} approved, ${rejected} rejected, ${review} pending review\n`);
}

// Main execution
async function main() {
  console.log('🛡️ Starting batch content moderation...\n');
  console.log('Database:', process.env.DATABASE_URL ? '✅ Custom URL' : '📍 Local .env');
  console.log('AI Provider:', process.env.GOOGLE_AI_API_KEY ? '✅ Gemini' : '❌ Missing API key\n');

  if (!process.env.GOOGLE_AI_API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY not found. Please set it in your environment or .env file.');
    process.exit(1);
  }

  try {
    await moderatePosts();
    await moderateIssues();
    await moderateIdeas();

    console.log('\n🎉 Batch moderation complete!\n');
    console.log('Next steps:');
    console.log('  1. Visit /admin/moderation to review flagged content');
    console.log('  2. Run this script again anytime to moderate new content\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
