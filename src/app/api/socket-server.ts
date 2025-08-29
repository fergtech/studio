/**
 * This file initializes the WebSocket server for real-time communication.
 * It creates an HTTP server and initializes the socket server from @/lib/socket.
 * This is meant to be called when the application starts.
 */
import { initializeSocket } from '@/lib/socket';
import { createServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

const server = createServer();
initializeSocket(server);
server.listen(9003, () => console.log('WebSocket server running on port 9003'));

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'WebSocket server initialized' });
}
