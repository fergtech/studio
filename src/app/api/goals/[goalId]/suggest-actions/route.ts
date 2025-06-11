import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is available
import { generateSuggestedActionsAction } from '@/app/actions/aiActions'; // Import the AI action function

export async function GET(request: Request, { params }: { params: { goalId: string } }) {
  const awaitedParams = await params;
  const goalId = awaitedParams.goalId;

  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: {
        id: true,
        title: true,
        description: true,
        initiativeId: true, // Might be useful for context
        actions: { // Select existing actions
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Call AI function to generate suggested actions
    const suggestedActions = await generateSuggestedActionsAction(
      goal.title,
      goal.description,
      goal.actions // Pass existing actions
    );

    return NextResponse.json(suggestedActions);

  } catch (error) {
    console.error('Error fetching or generating suggested actions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 