import { prisma } from "@/lib/prisma";
import { Initiative } from "@/lib/types";
import { generateAIGuidance, generateAIJSON } from '@/lib/aiHelper'; // Import AI helper with Cloudflare fallback

export async function getOrCreateAiGuidance(initiativeId: string, forceRegenerate: boolean = false): Promise<{ success: boolean; guidance?: string; error?: string }> {
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

    // 1. Check if guidance exists and return it (unless force regenerate)
    if (initiative.aiGuidance && !forceRegenerate) {
      console.log(`AI guidance already exists for initiative ${initiativeId}. Returning existing.`);
      return { success: true, guidance: initiative.aiGuidance };
    }

    // If forcing regeneration, log it
    if (forceRegenerate) {
      console.log(`Force regenerating AI guidance for initiative ${initiativeId}.`);
    }

    // 2. If guidance doesn't exist, prepare prompt
    console.log(`Generating AI guidance for initiative ${initiativeId}.`);
    const prompt = `As an expert strategic advisor, analyze this project and create a comprehensive guidance document that works for both solo and collaborative efforts:

    Project: "${initiative.title}"
    Description: ${initiative.description}

    Please provide a strategic analysis and guidance including:

    1. Project Review:
     - Key goals and objectives analysis
     - Current progress evaluation
     - Milestone tracking insights
     - Resource utilization assessment

    2. Strategic Recommendations:
     - 3-4 high-impact next steps
     - Resource optimization suggestions
     - Risk mitigation strategies
     - Success metrics to track

    3. Getting Started & Engagement:
     - Initial steps to make progress
     - How to stay motivated and organized
     - Best practices for solo work or collaboration
     - Ways to involve others if desired (optional)

    4. Growth and Scaling:
     - Progress acceleration strategies
     - Options for expanding (solo or with a team)
     - Impact maximization tips
     - Long-term sustainability plans (personal or collaborative)

    Format using markdown with:
    - Clear hierarchical headings
    - Bulleted actionable items
    - Emphasis on measurable outcomes
    - Encouraging tone that works for solo or group efforts

    Keep the guidance practical, adaptable, and focused on achieving project goals whether working alone or with others.`;

    // 3. Call AI API (Cloudflare + Gemini fallback)
    const aiResult = await generateAIGuidance(prompt, 3);

    if (!aiResult.success || !aiResult.text) {
      console.error("AI guidance generation failed after all retries");
      return { success: false, error: "Failed to generate AI guidance. Please try again later." };
    }

    const generatedGuidance = aiResult.text;
    console.log(`✅ AI guidance generated via ${aiResult.provider}`);

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

  const existingGoalsText = existingGoals.map(goal => `Title: ${goal.title}${goal.description ? '\nDescription: ' + goal.description : ''}`).join('\n\n');

  const prompt = `As a helpful AI assistant specializing in goal setting for initiatives, suggest 3 to 5 specific, actionable, and relevant goals for the following initiative. Consider the initiative's description and its current goals to avoid suggesting duplicates or overly similar goals.

Initiative Title: "${initiativeTitle}"
Initiative Description: ${initiativeDescription || 'No description provided.'}

Existing Goals (if any):
${existingGoalsText || 'None'}

Please provide the suggested goals in a JSON array format, where each element is an object with 'title' and 'description' keys. For example: [{ "title": "Goal Title 1", "description": "Goal Description 1" }, { "title": "Goal Title 2", "description": "Goal Description 2" }]. Ensure the output is valid JSON and contains ONLY the JSON array.
`;

  // Use AI helper with Cloudflare + Gemini fallback
  const aiResult = await generateAIJSON<Array<{ title: string; description: string }>>(prompt);

  if (!aiResult.success || !aiResult.data) {
    console.error("AI goal generation failed");
    return [];
  }

  const suggestedGoals = aiResult.data;
  console.log(`✅ AI goals generated via ${aiResult.provider}`);

  // Validate the parsed structure
  if (!Array.isArray(suggestedGoals) || suggestedGoals.some(goal => typeof goal.title !== 'string' || typeof goal.description !== 'string')) {
    console.error("AI response is not in the expected format:", suggestedGoals);
    return [];
  }

  // Limit to a maximum of 5 suggestions
  console.log(`Successfully generated ${suggestedGoals.length} suggested goals`);
  return suggestedGoals.slice(0, 5);
}

export async function generateSuggestedActionsAction(
  goalTitle: string,
  goalDescription: string | null,
  existingActions: Array<{ title: string; description: string | null }>
): Promise<Array<{ title: string; description: string }>> {
  console.log('Generating suggested actions with AI for goal:', goalTitle);

  const existingActionsText = existingActions.map(action => `Title: ${action.title}${action.description ? '\nDescription: ' + action.description : ''}`).join('\n\n');

  const prompt = `As a helpful AI assistant specializing in breaking down goals into actionable steps, suggest 3 to 5 specific, actionable, and relevant actions for the following goal. Consider the goal's description and its current actions to avoid suggesting duplicates or overly similar actions.

Goal Title: "${goalTitle}"
Goal Description: ${goalDescription || 'No description provided.'}

Existing Actions (if any):
${existingActionsText || 'None'}

Please provide the suggested actions in a JSON array format, where each element is an object with 'title' and 'description' keys. For example: [{ "title": "Action Title 1", "description": "Action Description 1" }, { "title": "Action Title 2", "description": "Action Description 2" }]. Ensure the output is valid JSON and contains ONLY the JSON array.
`;

  // Use AI helper with Cloudflare + Gemini fallback
  const aiResult = await generateAIJSON<Array<{ title: string; description: string }>>(prompt);

  if (!aiResult.success || !aiResult.data) {
    console.error("AI action generation failed");
    return [];
  }

  const suggestedActions = aiResult.data;
  console.log(`✅ AI actions generated via ${aiResult.provider}`);

  // Validate the parsed structure
  if (!Array.isArray(suggestedActions) || suggestedActions.some(action => typeof action.title !== 'string' || typeof action.description !== 'string')) {
    console.error("AI response is not in the expected format:", suggestedActions);
    return [];
  }

  // Limit to a maximum of 5 suggestions
  console.log(`Successfully generated ${suggestedActions.length} suggested actions`);
  return suggestedActions.slice(0, 5);
} 
