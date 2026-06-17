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

    const modelUrl = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8`;

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
        max_tokens: 4096,
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
 * Includes automatic fallback to Gemini if Cloudflare fails
 */
export async function generateAIJSON<T = any>(prompt: string): Promise<{ data: T | null; success: boolean; provider: string }> {
  let result = await generateAIText(prompt);

  if (!result.success || !result.text) {
    return { data: null, success: false, provider: result.provider };
  }

  // Track if we should try Gemini fallback
  let shouldTryGemini = false;

  try {
    // Clean markdown code fences
    let cleaned = result.text.trim();
    cleaned = cleaned.replace(/^```json\n?|\n?```$/gi, '').trim();

    // Replace smart quotes with regular quotes
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"'); // Replace " and "
    cleaned = cleaned.replace(/[\u2018\u2019]/g, "'"); // Replace ' and '

    // Remove any zero-width characters
    cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    // Fix common AI JSON generation errors
    // Fix missing closing brace before array end: "text"\n] -> "text"\n}\n]
    // This handles the pattern where AI forgets to close the last object in an array
    cleaned = cleaned.replace(/(")\s*\n\s*(\])(?!\s*[}\]])/g, '$1\n  }\n$2');

    // Try to extract JSON array or object (greedy match to get complete JSON)
    const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      console.error('Raw AI response:', result.text);
      return { data: null, success: false, provider: result.provider };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return { data: parsed, success: true, provider: result.provider };
    } catch (error: any) {
      // Log raw response for debugging
      console.error('Failed to parse AI JSON response:', error);
      console.error('Raw AI response:', result.text);
      console.error('Extracted JSON match:', jsonMatch[0]);

      // Show character codes around the error position if available
      if (error.message && error.message.includes('position')) {
        const posMatch = error.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          const start = Math.max(0, pos - 50);
          const end = Math.min(jsonMatch[0].length, pos + 50);
          const snippet = jsonMatch[0].substring(start, end);
          console.error(`\n📍 Context around position ${pos}:`);
          console.error(snippet);
          console.error(`\n🔍 Character codes around error:`);
          for (let i = Math.max(0, pos - 10); i < Math.min(jsonMatch[0].length, pos + 10); i++) {
            const char = jsonMatch[0][i];
            console.error(`  [${i}] '${char}' (code: ${char.charCodeAt(0)})`);
          }
        }
      }

      // Check if response looks truncated
      const rawJson = jsonMatch[0];
      if (rawJson.endsWith(',') || !rawJson.trim().match(/[\]}]$/)) {
        console.error('⚠️ JSON appears truncated - response may have hit token limit');
        console.error('Consider increasing max_tokens or requesting fewer items');
      }

      // If Cloudflare failed, try Gemini as fallback
      if (result.provider === 'cloudflare') {
        shouldTryGemini = true;
      } else {
        return { data: null, success: false, provider: result.provider };
      }
    }
  } catch (error) {
    console.error('Unexpected error in AI JSON parsing:', error);
    console.error('Raw AI response:', result.text);

    // If Cloudflare failed, try Gemini as fallback
    if (result.provider === 'cloudflare') {
      shouldTryGemini = true;
    } else {
      return { data: null, success: false, provider: result.provider };
    }
  }

  // Try Gemini fallback if Cloudflare JSON parsing failed
  if (shouldTryGemini) {
    console.log('🔄 Cloudflare JSON parsing failed, trying Gemini fallback...');
    const geminiResult = await generateWithGemini(prompt);

    if (geminiResult.success && geminiResult.text) {
      // Try to parse Gemini's response with the same cleaning logic
      try {
        let cleaned = geminiResult.text.trim();
        cleaned = cleaned.replace(/^```json\n?|\n?```$/gi, '').trim();
        cleaned = cleaned.replace(/[\u201C\u201D]/g, '"');
        cleaned = cleaned.replace(/[\u2018\u2019]/g, "'");
        cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
        cleaned = cleaned.replace(/(")\s*\n\s*(\])(?!\s*[}\]])/g, '$1\n  }\n$2');

        const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Gemini fallback successful!');
          return { data: parsed, success: true, provider: 'gemini' };
        }
      } catch (geminiError) {
        console.error('❌ Gemini fallback also failed:', geminiError);
      }
    }
  }

  return { data: null, success: false, provider: result.provider };
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

      // Guidance needs a capable model — try Gemini first, fall back to Cloudflare
      let result = await generateWithGemini(prompt);
      if (!result.success) {
        console.log('🔄 Gemini unavailable for guidance, trying Cloudflare...');
        result = await generateWithCloudflare(prompt);
      }

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
