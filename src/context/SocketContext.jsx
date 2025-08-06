import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, getAuthToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log('SocketProvider - User changed:', user?.email || 'none');
    console.log('SocketProvider - Token available:', !!getAuthToken());
    
    if (user?.email && getAuthToken()) {
      console.log('SocketProvider - Connecting socket for user:', user.email);
      connectSocket();
    } else {
      console.log('SocketProvider - Disconnecting socket, user or token missing');
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, getAuthToken]);

  const connectSocket = () => {
    try {
      console.log('Attempting to connect socket...');
      
      setConnectionError(null);
      
      if (socketRef.current) {
        console.log('Disconnecting existing socket');
        socketRef.current.disconnect();
      }

      const token = getAuthToken();
      if (!token) {
        console.error('No auth token available for socket connection');
        setConnectionError('No authentication token available');
        return;
      }

      console.log('Creating new socket connection with token');
      const newSocket = io('https://global-backfinal.onrender.com', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: false,
        timeout: 20000,
        forceNew: true
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected successfully:', newSocket.id);
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          setConnectionError('Disconnected by server');
        } else if (reason === 'transport close' || reason === 'transport error') {
          attemptReconnection();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
        setConnectionError(error.message);
        attemptReconnection();
      });

      // User status events
      newSocket.on('online-users', (users) => {
        console.log('Online users updated:', users);
        setOnlineUsers(users);
      });

      // Typing events
      newSocket.on('user-typing', (data) => {
        console.log('User typing event:', data);
        setTypingUsers(prev => ({
          ...prev,
          [data.conversationId || data.roomId]: {
            ...prev[data.conversationId || data.roomId],
            [data.userId]: data.userName
          }
        }));
      });

      newSocket.on('user-stopped-typing', (data) => {
        console.log('User stopped typing event:', data);
        setTypingUsers(prev => {
          const updated = { ...prev };
          if (updated[data.conversationId || data.roomId]) {
            delete updated[data.conversationId || data.roomId][data.userId];
            if (Object.keys(updated[data.conversationId || data.roomId]).length === 0) {
              delete updated[data.conversationId || data.roomId];
            }
          }
          return updated;
        });
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        setConnectionError(error.message || 'Socket error occurred');
      });

    } catch (error) {
      console.error('Error connecting socket:', error);
      setConnectionError(error.message);
    }
  };

  const attemptReconnection = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      setConnectionError('Failed to reconnect after multiple attempts');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    console.log(`Attempting reconnection in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    
    setReconnectAttempts(prev => prev + 1);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (user?.email && getAuthToken()) {
        connectSocket();
      }
    }, delay);
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      console.log('Disconnecting socket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
      setTypingUsers({});
      setConnectionError(null);
      setReconnectAttempts(0);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const sendMessage = (data) => {
    if (socket && isConnected) {
      console.log('Sending message via socket:', data);
      if (data.conversationId) {
        socket.emit('send-private-message', data);
      } else if (data.roomId) {
        socket.emit('send-room-message', data);
      }
    } else {
      console.warn('Cannot send message - socket not connected');
      throw new Error('Socket not connected. Please check your connection.');
    }
  };

  const markMessagesAsRead = (chatId, isRoom = false) => {
    if (socket && isConnected) {
      console.log('Marking messages as read:', { chatId, isRoom });
      if (isRoom) {
        socket.emit('mark-messages-read', { roomId: chatId });
      } else {
        socket.emit('mark-messages-read', { conversationId: chatId });
      }
    }
  };

  const startTyping = (chatId, isRoom = false) => {
    if (socket && isConnected) {
      console.log('Start typing:', { chatId, isRoom });
      if (isRoom) {
        socket.emit('typing-start', { roomId: chatId });
      } else {
        socket.emit('typing-start', { conversationId: chatId });
      }
    }
  };

  const stopTyping = (chatId, isRoom = false) => {
    if (socket && isConnected) {
      console.log('Stop typing:', { chatId, isRoom });
      if (isRoom) {
        socket.emit('typing-stop', { roomId: chatId });
      } else {
        socket.emit('typing-stop', { conversationId: chatId });
      }
    }
  };

  const isUserOnline = (userId) => {
    const online = onlineUsers.includes(userId);
    console.log('Check if user online:', userId, online);
    return online;
  };

  const manualReconnect = () => {
    setReconnectAttempts(0);
    setConnectionError(null);
    if (user?.email && getAuthToken()) {
      connectSocket();
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    connectionError,
    reconnectAttempts,
    maxReconnectAttempts,
    sendMessage,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    isUserOnline,
    connectSocket,
    disconnectSocket,
    manualReconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};