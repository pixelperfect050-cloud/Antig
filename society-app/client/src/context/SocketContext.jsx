import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { captureError, addBreadcrumb } from '../utils/sentry';
import { SOCKET_URL } from '../lib/apiConfig';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let newSocket;
    if (user && user.societyId) {
      const socketUrl = SOCKET_URL;
      
      try {
        newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5
        });

        newSocket.on('connect', () => {
          console.log('Real-time connection established');
          const sid = user.societyId?._id || user.societyId;
          newSocket.emit('join_society', sid);
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
          captureError(err, { context: 'socket_connect_error', socketUrl });
        });

        setSocket(newSocket);
      } catch (err) {
        console.error('Failed to initialize socket:', err);
      }

      return () => {
        if (newSocket) newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
