const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined their room`);
    });

    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log('🛡️  Admin joined admin room');
    });

    socket.on('disconnect', () => console.log(`❌ Client disconnected: ${socket.id}`));
  });

  return io;
};

const getIO = () => io;

module.exports = { initializeSocket, getIO };
