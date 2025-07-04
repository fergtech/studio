import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { actionId, status, completedById } = body;

    if (!actionId || !status) {
      return NextResponse.json({ error: 'Action ID and status are required' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = { status };
    if (status === 'Done') {
      updateData.completedAt = new Date();
      if (completedById) updateData.completedById = completedById;
    } else {
      updateData.completedAt = null;
      updateData.completedById = null;
    }

    // 1. Update the action status
    const updatedAction = await prisma.action.update({
      where: { id: actionId },
      data: updateData,
    });

    // 2. Get the goalId and initiativeId for this action
    const action = await prisma.action.findUnique({
      where: { id: actionId },
      select: { goalId: true, initiativeId: true },
    });
    if (!action || !action.goalId || !action.initiativeId) {
      return NextResponse.json({ error: 'Action or related goal/initiative not found' }, { status: 404 });
    }

    // 3. Get all actions for the goal
    const allActions = await prisma.action.findMany({
      where: { goalId: action.goalId },
      select: { id: true, status: true },
    });
    const totalActions = allActions.length;
    const completedActions = allActions.filter(a => a.status === 'Done').length;
    const goalProgress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
    const goalStatus = completedActions === totalActions && totalActions > 0 ? 'Completed' : 'InProgress';

    // 4. Update the goal's progress and status
    const updatedGoal = await prisma.goal.update({
      where: { id: action.goalId },
      data: {
        progress: goalProgress,
        status: goalStatus,
      },
    });

    // 5. Get all goals for the initiative
    const allGoals = await prisma.goal.findMany({
      where: { initiativeId: action.initiativeId },
      select: { id: true, progress: true },
    });
    const initiativeProgress = allGoals.length > 0
      ? Math.round(allGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / allGoals.length)
      : 0;

    // 6. Update the initiative's progress
    await prisma.initiative.update({
      where: { id: action.initiativeId },
      data: { progress: initiativeProgress },
    });

    return NextResponse.json({
      action: updatedAction,
      goal: updatedGoal,
      initiativeProgress,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating action status:', error);
    return NextResponse.json({ error: 'Failed to update action status', details: error.message }, { status: 500 });
  }
} 
