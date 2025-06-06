import { Server } from 'socket.io';

let io: Server | null = null;
// Use NEXT_PUBLIC_SOCKET_SERVER_URL for consistency with client, default to 9003
const socketServerDefaultUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';
// Client URL for CORS, default to Next.js dev server
const clientUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const initializeSocket = (server: any) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: [clientUrl, socketServerDefaultUrl], // Allow both client and socket server URLs
      },
      path: '/api/socketio'
    });

    io.on('connection', (socket: import('socket.io').Socket) => {
      console.log('A user connected:', socket.id);

      socket.on('sendMessage', (message) => {
        if (io) {
          io.emit('receiveMessage', message);
        }
      });

      socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
      });
    });
  }

  return io;
};

export const getSocketInstance = () => io;
