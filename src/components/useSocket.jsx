// hooks/useSocket.js - Install with: npm install socket.io-client
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (serverUrl, userId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!userId || !serverUrl) return;

    // Create socket connection
    socketRef.current = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setIsConnected(true);
      socket.emit('join', userId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Online users
    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [serverUrl, userId]);

  const joinConversation = (conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-conversation', conversationId);
    }
  };

  const joinRoom = (roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
    }
  };

  const sendPrivateMessage = (conversationId, content, tempId) => {
    if (socketRef.current) {
      socketRef.current.emit('send-private-message', {
        conversationId,
        content,
        tempId
      });
    }
  };

  const sendRoomMessage = (roomId, content, tempId) => {
    if (socketRef.current) {
      socketRef.current.emit('send-room-message', {
        roomId,
        content,
        tempId
      });
    }
  };

  const startTyping = (conversationId, roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-start', { conversationId, roomId });
    }
  };

  const stopTyping = (conversationId, roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing-stop', { conversationId, roomId });
    }
  };

  const markMessagesRead = (conversationId, roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('mark-messages-read', { conversationId, roomId });
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    joinRoom,
    leaveRoom,
    sendPrivateMessage,
    sendRoomMessage,
    startTyping,
    stopTyping,
    markMessagesRead
  };
};