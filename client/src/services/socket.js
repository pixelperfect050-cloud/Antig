import { io } from 'socket.io-client';

const socket = io('/', { autoConnect: false, transports: ['websocket', 'polling'] });

export const connectSocket = (userId, isAdmin) => {
  if (!socket.connected) socket.connect();
  socket.emit('join-user', userId);
  if (isAdmin) socket.emit('join-admin');
};

export const disconnectSocket = () => { socket.disconnect(); };

export default socket;
