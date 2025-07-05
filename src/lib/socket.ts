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

      // Join user-specific room for notifications
      socket.on('joinUserRoom', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their notification room`);
      });

      // Join initiative-specific room for initiative chat
      socket.on('joinInitiativeRoom', (initiativeId: string) => {
        socket.join(`initiative_${initiativeId}`);
        console.log(`User ${socket.id} joined initiative room: initiative_${initiativeId}`);
      });

      // Handle initiative chat messages (now scoped to initiative room)
      socket.on('sendMessage', (message) => {
        if (io && message.initiativeId) {
          io.to(`initiative_${message.initiativeId}`).emit('receiveMessage', message);
        }
      });

      // Handle direct message conversations
      socket.on('joinConversation', (conversationId: string) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation: ${conversationId}`);
      });

      socket.on('sendDirectMessage', (message) => {
        if (io) {
          // Emit to the specific conversation room
          const conversationId = message.conversationId;
          if (conversationId) {
            io.to(conversationId).emit('receiveDirectMessage', message);
          }
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

// Function to emit notifications to specific users
export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(`user_${userId}`).emit('newNotification', notification);
  }
};
