import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the backend WebSocket server
    // The URL should ideally come from an environment variable
    const backendUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:3001';
    const newSocket = io(backendUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      transports: ['websocket'], // Prefer WebSocket
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.IO: Connected to backend successfully.', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('Socket.IO: Disconnected from backend.', reason);
      setIsConnected(false);
      // Handle specific disconnect reasons if needed
      if (reason === 'io server disconnect') {
        // The server deliberately disconnected the socket
        newSocket.connect(); // Optionally attempt to reconnect
      }
      // else the client will automatically try to reconnect
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO: Connection error.', error);
      setIsConnected(false);
      // Potentially display a global error to the user or retry connection manually
    });

    // Example: Listen for a generic backend log for initial setup verification
    newSocket.on('backend:log', (logEntry) => {
        console.log(`[BACKEND LOG - ${logEntry.type}] ${logEntry.timestamp}: ${logEntry.message}`);
    });


    // Cleanup on component unmount
    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('backend:log');
      setIsConnected(false);
      console.log('Socket.IO: Disconnected and cleaned up on unmount.');
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
