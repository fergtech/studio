import { Server } from 'socket.io';

let io: Server | null = null;
// Use NEXT_PUBLIC_SOCKET_SERVER_URL for consistency with client, default to 9003
const socketServerDefaultUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';
// Client URL for CORS, default to Next.js dev server
const clientUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// In-memory map of online users (userId -> socketId[])
const onlineUsers: Record<string, Set<string>> = {};
const userLastSeen: Record<string, number> = {}; // userId -> timestamp

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

      // Track which user this socket belongs to
      let currentUserId: string | null = null;

      // Join user-specific room for notifications
      socket.on('joinUserRoom', (userId: string) => {
        socket.join(`user_${userId}`);
        currentUserId = userId;
        // Add to online users
        if (!onlineUsers[userId]) onlineUsers[userId] = new Set();
        onlineUsers[userId].add(socket.id);
        broadcastOnlineUsers();
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

      // Add checkUserStatus event for real-time profile checks
      socket.on('userHeartbeat', (userId: string) => {
        userLastSeen[userId] = Date.now();
      });

      socket.on('checkUserStatus', (userId: string, callback: (isOnline: boolean) => void) => {
        const lastSeen = userLastSeen[userId];
        const isOnline = lastSeen && (Date.now() - lastSeen < 5 * 60 * 1000); // 5 minutes
        callback(!!isOnline);
      });

      socket.on('disconnect', () => {
        if (currentUserId && onlineUsers[currentUserId]) {
          onlineUsers[currentUserId].delete(socket.id);
          if (onlineUsers[currentUserId].size === 0) {
            delete onlineUsers[currentUserId];
          }
          broadcastOnlineUsers();
        }
        console.log('A user disconnected:', socket.id);
      });
    });
  }

  return io;
};

function broadcastOnlineUsers() {
  if (io) {
    const onlineUserIds = Object.keys(onlineUsers);
    io.emit('onlineUsers', onlineUserIds);
  }
}

export const getSocketInstance = () => io;

// Function to emit notifications to specific users
export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(`user_${userId}`).emit('newNotification', notification);
  }
};
