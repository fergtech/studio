import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { actionId, status } = body;

    if (!actionId || !status) {
      return NextResponse.json({ error: 'Action ID and status are required' }, { status: 400 });
    }

    const updatedAction = await prisma.action.update({
      where: { id: actionId },
      data: { status },
    });

    return NextResponse.json(updatedAction, { status: 200 });
  } catch (error: any) {
    console.error('Error updating action status:', error);
    return NextResponse.json({ error: 'Failed to update action status', details: error.message }, { status: 500 });
  }
}
