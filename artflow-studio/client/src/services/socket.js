import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';

const socket = io(import.meta.env.VITE_SOCKET_URL || BACKEND_URL || '/', {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export const connectSocket = (userId, isAdmin) => {
  if (!socket.connected) socket.connect();
  socket.emit('join-user', userId);
  if (isAdmin) socket.emit('join-admin');
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export default socket;
