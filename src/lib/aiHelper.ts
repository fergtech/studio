/**
 * AI Helper - Unified AI provider with Cloudflare + Gemini fallback
 *
 * Provides AI text generation with automatic fallback:
 * 1. Cloudflare Workers AI (1M requests/day free)
 * 2. Google Gemini (50 requests/day free)
 * 3. Error handling with graceful degradation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIResponse {
  text: string;
  provider: 'cloudflare' | 'gemini' | 'error';
  success: boolean;
}

/**
 * Generate text using Cloudflare Workers AI (Llama 3.1 8B)
 */
async function generateWithCloudflare(prompt: string): Promise<AIResponse> {
  try {
    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!cfAccountId || !cfApiToken) {
      console.warn('⚠️ Cloudflare credentials not found, skipping');
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
            content: 'You are a helpful AI assistant. Provide clear, concise, and actionable responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2048,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ Cloudflare API error: ${response.status}`);
      return { text: '', provider: 'error', success: false };
    }

    const result = await response.json();
    const generatedText = result.result?.response || '';

    if (generatedText) {
      console.log('☁️ Cloudflare generation successful');
      return { text: generatedText, provider: 'cloudflare', success: true };
    }

    return { text: '', provider: 'error', success: false };
  } catch (error) {
    console.error('❌ Cloudflare generation error:', error);
    return { text: '', provider: 'error', success: false };
  }
}

/**
 * Generate text using Google Gemini AI
 */
async function generateWithGemini(prompt: string): Promise<AIResponse> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ Google AI API key not found');
      return { text: '', provider: 'error', success: false };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text) {
      console.log('🤖 Gemini generation successful');
      return { text, provider: 'gemini', success: true };
    }

    return { text: '', provider: 'error', success: false };
  } catch (error: any) {
    console.error('❌ Gemini generation error:', error);

    // Check for rate limiting
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      console.warn('⏳ Gemini rate limit hit');
    }

    return { text: '', provider: 'error', success: false };
  }
}

/**
 * Main AI generation function with automatic fallback
 * Tries Cloudflare first, then Gemini if Cloudflare fails
 */
export async function generateAIText(prompt: string): Promise<AIResponse> {
  console.log('🔍 Starting AI text generation...');

  // Try Cloudflare first
  const cfResult = await generateWithCloudflare(prompt);
  if (cfResult.success) {
    return cfResult;
  }

  // Fallback to Gemini
  console.log('🔄 Cloudflare unavailable, trying Gemini...');
  const geminiResult = await generateWithGemini(prompt);
  if (geminiResult.success) {
    return geminiResult;
  }

  // Both failed
  console.error('❌ All AI providers failed');
  return { text: '', provider: 'error', success: false };
}

/**
 * Generate JSON from AI with automatic parsing and validation
 */
export async function generateAIJSON<T = any>(prompt: string): Promise<{ data: T | null; success: boolean; provider: string }> {
  const result = await generateAIText(prompt);

  if (!result.success || !result.text) {
    return { data: null, success: false, provider: result.provider };
  }

  try {
    // Clean markdown code fences
    let cleaned = result.text.trim();
    cleaned = cleaned.replace(/^```json\n?|\n?```$/gi, '').trim();

    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    // Try to extract JSON array or object
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      console.error('Raw AI response:', result.text);
      return { data: null, success: false, provider: result.provider };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return { data: parsed, success: true, provider: result.provider };
    } catch (error) {
      // Log raw response for debugging
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result.text);
      return { data: null, success: false, provider: result.provider };
    }
  } catch (error) {
    console.error('Unexpected error in AI JSON parsing:', error);
    console.error('Raw AI response:', result.text);
    return { data: null, success: false, provider: result.provider };
  }
}

/**
 * Generate AI guidance with retry logic
 * Used for initiative guidance, goal suggestions, etc.
 */
export async function generateAIGuidance(prompt: string, maxRetries: number = 3): Promise<AIResponse> {
  let lastError: any = null;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to generate AI guidance...`);

      const result = await generateAIText(prompt);

      if (result.success) {
        console.log(`✅ AI guidance generated successfully on attempt ${attempt}`);
        return result;
      }

      lastError = new Error('AI generation returned empty result');

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);

      // Don't retry on rate limits
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        console.warn('⏳ Rate limit hit - stopping retries');
        break;
      }

      // Wait before retry
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`❌ All ${maxRetries} attempts failed. Last error:`, lastError);
  return { text: '', provider: 'error', success: false };
}
