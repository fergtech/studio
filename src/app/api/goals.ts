import { NextApiRequest, NextApiResponse } from 'next';
import { createGoal } from '@/lib/prisma/mutations';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { initiativeId, title, description } = req.body;
    try {
      const goal = await createGoal({
        initiativeId,
        title,
        description,
        status: 'NotStarted', // Updated value
        ownerId: session.user.id, // Ensure user is authenticated
      });
      res.status(200).json(goal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create goal' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
