import { prisma } from "@/lib/prisma";
import { Initiative } from "@/lib/types";
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import the library

export async function getOrCreateAiGuidance(initiativeId: string): Promise<{ success: boolean; guidance?: string; error?: string }> {
  try {
    // Fetch the initiative, including the existing aiGuidance if any
    const initiative = await prisma.initiative.findUnique({
      where: {
        id: initiativeId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        aiGuidance: true, // Select the new field
      },
    });

    if (!initiative) {
      return { success: false, error: "Initiative not found." };
    }

    // 1. Check if guidance exists and return it
    if (initiative.aiGuidance) {
      console.log(`AI guidance already exists for initiative ${initiativeId}. Returning existing.`);
      return { success: true, guidance: initiative.aiGuidance };
    }

    // 2. If guidance doesn't exist, prepare prompt
    console.log(`Generating AI guidance for initiative ${initiativeId}.`);
    const prompt = `As an expert community facilitator and strategic advisor, analyze this initiative and create a comprehensive guidance document:

    Initiative: "${initiative.title}"
    Description: ${initiative.description}

    Please provide a strategic analysis and guidance including:

    1. Initiative Review:
     - Key goals and objectives analysis
     - Current progress evaluation
     - Milestone tracking insights
     - Resource utilization assessment

    2. Strategic Recommendations:
     - 3-4 high-impact next steps
     - Resource optimization suggestions
     - Risk mitigation strategies
     - Success metrics to track

    3. Participant Engagement Guide:
     - Getting started steps
     - Collaboration opportunities
     - Best practices and tips
     - Ways to contribute effectively

    4. Growth and Scaling:
     - Progress acceleration strategies
     - Resource scaling suggestions
     - Impact maximization tips
     - Long-term sustainability plans

    Format using markdown with:
    - Clear hierarchical headings
    - Bulleted actionable items
    - Emphasis on measurable outcomes
    - Professional yet encouraging tone

    Keep the guidance practical, data-driven, and focused on achieving initiative goals.`;

    // 3. Call Gemini API
    const apiKey = process.env.GOOGLE_AI_API_KEY; // Get API key from environment variables
    if (!apiKey) {
      console.error("GOOGLE_AI_API_KEY environment variable not set.");
      return { success: false, error: "AI API key not configured." };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the gemini-1.5-flash model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    let generatedGuidance = "";
    
    // Retry logic with exponential backoff
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} to call Gemini API for guidance generation...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        generatedGuidance = response.text();
        console.log(`Gemini API guidance response received successfully on attempt ${attempt}.`);
        break; // Success, exit retry loop
        
      } catch (aiError: any) {
        lastError = aiError;
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, aiError);
        
        // Check if this is a retryable error
        const isRetryable = (
          aiError.status === 503 || 
          aiError.message?.includes('503') || 
          aiError.message?.includes('overloaded') ||
          aiError.message?.includes('Service Unavailable') ||
          aiError.status === 429 ||
          aiError.message?.includes('429') ||
          aiError.message?.includes('quota')
        );
        
        if (!isRetryable || attempt === maxRetries) {
          break; // Non-retryable error or max retries reached
        }
        
        // Wait with exponential backoff before retrying
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Handle final error if all retries failed
    if (!generatedGuidance && lastError) {
      console.error("Error calling Gemini API after all retries:", lastError);
      
      // Handle specific API errors
      if (lastError.message?.includes('503') || lastError.message?.includes('overloaded')) {
        return { success: false, error: "AI service is currently overloaded. Please try again in a few minutes." };
      } else if (lastError.message?.includes('429') || lastError.message?.includes('quota')) {
        return { success: false, error: "AI service quota exceeded. Please try again later." };
      } else if (lastError.message?.includes('401') || lastError.message?.includes('authentication')) {
        return { success: false, error: "AI service authentication error. Please contact support." };
      } else {
        return { success: false, error: "Failed to generate AI guidance. Please try again later." };
      }
    }

    // 4. Save generated guidance to initiative
    const updatedInitiative = await prisma.initiative.update({
      where: {
        id: initiativeId,
      },
      data: {
        aiGuidance: generatedGuidance,
      },
      select: {
        aiGuidance: true,
      },
    });

    // 5. Return generated guidance
    console.log(`AI guidance generated and saved for initiative ${initiativeId}.`);
    return { success: true, guidance: updatedInitiative.aiGuidance || generatedGuidance };

  } catch (error) {
    console.error("Error in getOrCreateAiGuidance:", error);
    return { success: false, error: "Failed to get or create AI guidance." };
  }
}

export async function generateSuggestedGoalsAction(
  initiativeTitle: string,
  initiativeDescription: string | null,
  existingGoals: Array<{ title: string; description: string | null }>
): Promise<Array<{ title: string; description: string }>> {
  console.log('Generating suggested goals with AI for initiative:', initiativeTitle);

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_AI_API_KEY environment variable not set.");
    return []; // Return empty array if API key is not configured
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const existingGoalsText = existingGoals.map(goal => `Title: ${goal.title}${goal.description ? '\nDescription: ' + goal.description : ''}`).join('\n\n');

  const prompt = `As a helpful AI assistant specializing in goal setting for initiatives, suggest 3 to 5 specific, actionable, and relevant goals for the following initiative. Consider the initiative's description and its current goals to avoid suggesting duplicates or overly similar goals.

Initiative Title: "${initiativeTitle}"
Initiative Description: ${initiativeDescription || 'No description provided.'}

Existing Goals (if any):
${existingGoalsText || 'None'}

Please provide the suggested goals in a JSON array format, where each element is an object with 'title' and 'description' keys. For example: [{ "title": "Goal Title 1", "description": "Goal Description 1" }, { "title": "Goal Title 2", "description": "Goal Description 2" }]. Ensure the output is valid JSON and contains ONLY the JSON array.
`;

  // Retry logic with exponential backoff
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to call Gemini API for suggested goals...`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("Raw AI suggested goals response:", text);

      // Improved: Try to extract the first valid JSON array from the response
      let jsonString = text.trim();
      // Remove markdown code fences if present
      jsonString = jsonString.replace(/^```json[\r\n]+/i, '').replace(/```$/i, '').trim();
      // Try to find the first JSON array in the string
      const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        console.error("No JSON array found in AI response:", jsonString);
        return [];
      }
      let suggestedGoals;
      try {
        suggestedGoals = JSON.parse(arrayMatch[0]);
      } catch (parseError) {
        console.error("Failed to parse JSON array from AI response:", arrayMatch[0], parseError);
        return [];
      }

      // Validate the parsed structure (basic check)
      if (!Array.isArray(suggestedGoals) || suggestedGoals.some(goal => typeof goal.title !== 'string' || typeof goal.description !== 'string')) {
        console.error("AI response is not in the expected format:", suggestedGoals);
        return [];
      }

      // Limit to a maximum of 5 suggestions, just in case the AI returns more
      console.log(`Successfully generated ${suggestedGoals.length} suggested goals on attempt ${attempt}`);
      return suggestedGoals.slice(0, 5);

    } catch (aiError: any) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, aiError);
      
      // Check if this is a retryable error
      const isRetryable = (
        aiError.status === 503 || 
        aiError.message?.includes('503') || 
        aiError.message?.includes('overloaded') ||
        aiError.message?.includes('Service Unavailable') ||
        aiError.status === 429 ||
        aiError.message?.includes('429') ||
        aiError.message?.includes('quota')
      );
      
      if (!isRetryable || attempt === maxRetries) {
        console.error("Non-retryable error or max retries reached for suggested goals:", aiError);
        return [];
      }
      
      // Wait with exponential backoff before retrying
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return [];
}

export async function generateSuggestedActionsAction(
  goalTitle: string,
  goalDescription: string | null,
  existingActions: Array<{ title: string; description: string | null }>
): Promise<Array<{ title: string; description: string }>> {
  console.log('Generating suggested actions with AI for goal:', goalTitle);

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_AI_API_KEY environment variable not set.");
    return []; // Return empty array if API key is not configured
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const existingActionsText = existingActions.map(action => `Title: ${action.title}${action.description ? '\nDescription: ' + action.description : ''}`).join('\n\n');

  const prompt = `As a helpful AI assistant specializing in breaking down goals into actionable steps, suggest 3 to 5 specific, actionable, and relevant actions for the following goal. Consider the goal's description and its current actions to avoid suggesting duplicates or overly similar actions.

Goal Title: "${goalTitle}"
Goal Description: ${goalDescription || 'No description provided.'}

Existing Actions (if any):
${existingActionsText || 'None'}

Please provide the suggested actions in a JSON array format, where each element is an object with 'title' and 'description' keys. For example: [{ "title": "Action Title 1", "description": "Action Description 1" }, { "title": "Action Title 2", "description": "Action Description 2" }]. Ensure the output is valid JSON and contains ONLY the JSON array.
`;

  // Retry logic with exponential backoff
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to call Gemini API for suggested actions...`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("Raw AI suggested actions response:", text);

      // Attempt to parse the JSON response, stripping markdown fences if present
      const jsonString = text.replace(/^```json\n/m, '').replace(/\n```$/m, '').trim();

      const suggestedActions = JSON.parse(jsonString);

      // Validate the parsed structure
      if (!Array.isArray(suggestedActions) || suggestedActions.some(action => typeof action.title !== 'string' || typeof action.description !== 'string')) {
         console.error("AI response for suggested actions is not in the expected format:", suggestedActions);
         return []; // Return empty array if parsing or validation fails
      }

      // Limit to a maximum of 5 suggestions
      console.log(`Successfully generated ${suggestedActions.length} suggested actions on attempt ${attempt}`);
      return suggestedActions.slice(0, 5);

    } catch (aiError: any) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, aiError);
      
      // Check if this is a retryable error
      const isRetryable = (
        aiError.status === 503 || 
        aiError.message?.includes('503') || 
        aiError.message?.includes('overloaded') ||
        aiError.message?.includes('Service Unavailable') ||
        aiError.status === 429 ||
        aiError.message?.includes('429') ||
        aiError.message?.includes('quota')
      );
      
      if (!isRetryable || attempt === maxRetries) {
        console.error("Non-retryable error or max retries reached for suggested actions:", aiError);
        return [];
      }
      
      // Wait with exponential backoff before retrying
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return [];
} 
