const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join_society', (societyId) => {
      socket.join(societyId);
      console.log(`Socket ${socket.id} joined society: ${societyId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const emitToSociety = (societyId, event, data) => {
  if (io) {
    io.to(societyId).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToSociety
};
