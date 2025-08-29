// Simple Socket.IO server for testing
const { createServer } = require('http');

const server = createServer((req, res) => {
  // Basic HTTP server for health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Socket server running' }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Try to require socket.io from node_modules
try {
  const { Server } = require('./node_modules/socket.io/dist/index.js');
  
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:9002"], // Allow Next.js app
      methods: ["GET", "POST"]
    },
    path: '/api/socketio'
  });

  // In-memory map of online users (userId -> socketId[])
  const onlineUsers = {};
  const userLastSeen = {}; // userId -> timestamp

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Track which user this socket belongs to
    let currentUserId = null;

    // Join user-specific room for notifications
    socket.on('joinUserRoom', (userId) => {
      socket.join(`user_${userId}`);
      currentUserId = userId;
      // Add to online users
      if (!onlineUsers[userId]) onlineUsers[userId] = new Set();
      onlineUsers[userId].add(socket.id);
      broadcastOnlineUsers();
      console.log(`User ${userId} joined their notification room`);
    });

    // Join initiative-specific room for initiative chat
    socket.on('joinInitiativeRoom', (initiativeId) => {
      socket.join(`initiative_${initiativeId}`);
      console.log(`User ${socket.id} joined initiative room: initiative_${initiativeId}`);
    });

    // Handle initiative chat messages (now scoped to initiative room)
    socket.on('sendMessage', (message) => {
      console.log('Received message:', message);
      if (message.initiativeId) {
        io.to(`initiative_${message.initiativeId}`).emit('receiveMessage', message);
      }
    });

    // Handle direct message conversations
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    });

    socket.on('sendDirectMessage', (message) => {
      // Emit to the specific conversation room
      const conversationId = message.conversationId;
      if (conversationId) {
        io.to(conversationId).emit('receiveDirectMessage', message);
      }
    });

    // Add checkUserStatus event for real-time profile checks
    socket.on('userHeartbeat', (userId) => {
      userLastSeen[userId] = Date.now();
    });

    socket.on('checkUserStatus', (userId, callback) => {
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

  function broadcastOnlineUsers() {
    const onlineUserIds = Object.keys(onlineUsers);
    io.emit('onlineUsers', onlineUserIds);
  }

  const PORT = 9003;
  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });

  // Function to emit notifications to specific users
  const emitNotification = (userId, notification) => {
    io.to(`user_${userId}`).emit('newNotification', notification);
  };

  module.exports = { emitNotification };

} catch (error) {
  console.error('Socket.IO not available, starting basic HTTP server only:', error.message);
  
  const PORT = 9003;
  server.listen(PORT, () => {
    console.log(`Basic HTTP server running on port ${PORT} (Socket.IO not available)`);
    console.log('Visit http://localhost:9003/health to check status');
  });
}