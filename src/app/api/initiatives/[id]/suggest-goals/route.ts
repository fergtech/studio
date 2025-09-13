import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is available
import { generateSuggestedGoalsAction } from '@/app/actions/aiActions'; // Import the AI action function

// Placeholder function to simulate AI goal generation
async function generateSuggestedGoals(initiativeTitle: string, initiativeDescription: string | null, existingGoals: Array<{ title: string; description: string | null }>): Promise<Array<{ title: string; description: string }>> {
  console.log('Simulating AI goal generation for initiative:', initiativeTitle);
  console.log('Existing goals:', existingGoals);

  // Basic simulation based on initiative title
  const suggestions: Array<{ title: string; description: string }> = [];

  if (initiativeTitle.toLowerCase().includes('community')) {
    suggestions.push({ title: 'Increase community engagement', description: 'Develop strategies to boost participation in forums and events.' });
  }

  if (initiativeTitle.toLowerCase().includes('funding')) {
    suggestions.push({ title: 'Secure funding for phase 2', description: 'Prepare grant applications and approach potential investors.' });
  }

   if (initiativeTitle.toLowerCase().includes('product')) {
    suggestions.push({ title: 'Launch beta version', description: 'Finalize development and gather user feedback.' });
  }

  // Add some generic suggestions if none based on title
  if (suggestions.length === 0) {
     suggestions.push({ title: 'Improve team collaboration', description: 'Implement new communication tools and practices.' });
     suggestions.push({ title: 'Define key metrics for success', description: 'Establish measurable indicators for initiative progress.' });
  }

  // Limit to a maximum of 3 suggestions
  return suggestions.slice(0, 3);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const awaitedParams = await params;
  const initiativeId = awaitedParams.id;

  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
      select: {
        id: true,
        title: true,
        description: true,
        goals: { // Select existing goals
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    // Use the AI function to generate suggested goals
    const suggestedGoals = await generateSuggestedGoalsAction(
      initiative.title,
      initiative.description,
      initiative.goals // Pass existing goals
    );

    return NextResponse.json(suggestedGoals);

  } catch (error) {
    console.error('Error fetching or generating suggested goals:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 