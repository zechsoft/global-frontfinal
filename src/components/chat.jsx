import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Send, Paperclip, Smile, MoreVertical, Search, Plus,
  UserPlus, Archive, MessageSquare, Users, Clock, CheckCheck,
  X, LogOut, Hash, AlertCircle, Loader2, Shield
} from 'lucide-react';

const API_BASE = 'https://global-backfinal.onrender.com/api';

export default function ChatPage() {
  const { authenticatedApiCall, user, logout } = useAuth();
  const {
    socket,
    isConnected,
    onlineUsers,
    sendMessage: socketSendMessage,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    isUserOnline
  } = useSocket();

  // State management
  const [message, setMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState('private');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('clients');
  const [typingUsers, setTypingUsers] = useState({});

  // Data states - optimized with lazy loading flags
  const [conversations, setConversations] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

  // Loading states for lazy loading
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [roomsLoaded, setRoomsLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // New room form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const loadingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  // OPTIMIZED: Stable current user with better caching
  const currentUser = useMemo(() => {
    if (user && (user._id || user.id)) {
      return {
        id: user._id || user.id,
        email: user.Email || user.email,
        name: user.userName || user.name,
        role: user.role
      };
    }

    // Only check storage if user context is empty
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && (parsedUser._id || parsedUser.id)) {
          return {
            id: parsedUser._id || parsedUser.id,
            email: parsedUser.Email || parsedUser.email,
            name: parsedUser.userName || parsedUser.name,
            role: parsedUser.role
          };
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }

    return null;
  }, [user]);

  // OPTIMIZED: Batch API calls with Promise.all for faster loading
  const loadEssentialData = useCallback(async () => {
    if (!currentUser?.id || !authenticatedApiCall) return;

    try {
      console.log('Loading essential data...');
      
      // Load conversations and rooms in parallel (most important data first)
      const [conversationsResult, roomsResult] = await Promise.allSettled([
        authenticatedApiCall(`${API_BASE}/chat/conversations`),
        authenticatedApiCall(`${API_BASE}/chat/rooms`)
      ]);

      if (conversationsResult.status === 'fulfilled') {
        setConversations(conversationsResult.value.conversations || []);
        setConversationsLoaded(true);
      } else {
        console.error('Failed to load conversations:', conversationsResult.reason);
        setConversations([]);
      }

      if (roomsResult.status === 'fulfilled') {
        setChatRooms(roomsResult.value.chatRooms || roomsResult.value.rooms || []);
        setRoomsLoaded(true);
      } else {
        console.error('Failed to load rooms:', roomsResult.reason);
        setChatRooms([]);
      }

    } catch (error) {
      console.error('Failed to load essential data:', error);
      setError('Failed to load chat data');
    }
  }, [currentUser?.id, authenticatedApiCall]);

  // OPTIMIZED: Lazy load user data only when needed
  const loadUserData = useCallback(async () => {
    if (!currentUser?.id || !authenticatedApiCall || usersLoaded) return;

    try {
      console.log('Loading user data...');
      
      // Try to load all users first (most efficient)
      const allUsersResult = await authenticatedApiCall(`${API_BASE}/get-all-users`).catch(() => null);
      
      if (allUsersResult?.users?.length > 0) {
        setAllUsers(allUsersResult.users);
        setUsersLoaded(true);
        return;
      }

      // Fallback to separate calls if all-users endpoint fails
      const [clientsResult, adminsResult] = await Promise.allSettled([
        authenticatedApiCall(`${API_BASE}/get-clients`),
        authenticatedApiCall(`${API_BASE}/get-admin`)
      ]);

      if (clientsResult.status === 'fulfilled') {
        setClients(clientsResult.value.users || []);
      }

      if (adminsResult.status === 'fulfilled') {
        setAdmins(adminsResult.value.users || []);
      }

      setUsersLoaded(true);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setUsersLoaded(true); // Mark as loaded to prevent retries
    }
  }, [currentUser?.id, authenticatedApiCall, usersLoaded]);

  // OPTIMIZED: Fast initial load - only essential data
  useEffect(() => {
    const initializeChat = async () => {
      if (loadingRef.current || initialLoadDoneRef.current || !currentUser?.id || !authenticatedApiCall) {
        return;
      }

      console.log('Initializing chat for user:', currentUser.id);
      loadingRef.current = true;
      setInitialLoading(true);
      setError('');

      try {
        // Load only essential data first
        await loadEssentialData();
        console.log('Essential data loaded - chat ready');
        
        initialLoadDoneRef.current = true;
        setInitialLoading(false);
        
        // Load user data in background after UI is ready
        setTimeout(() => {
          loadUserData();
        }, 100);

      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setError('Failed to initialize chat: ' + error.message);
        setInitialLoading(false);
      } finally {
        loadingRef.current = false;
      }
    };

    initializeChat();
  }, [currentUser?.id, authenticatedApiCall, loadEssentialData, loadUserData]);

  // OPTIMIZED: Debounced socket reconnection refresh
  useEffect(() => {
    let refreshTimeout;
    
    if (isConnected && currentUser?.id && initialLoadDoneRef.current && !loadingRef.current) {
      console.log('Socket reconnected, scheduling data refresh...');
      
      // Debounce refresh to avoid multiple rapid calls
      refreshTimeout = setTimeout(() => {
        Promise.allSettled([
          loadEssentialData()
        ]).catch(error => {
          console.error('Error refreshing data on socket reconnect:', error);
        });
      }, 500);
    }

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [isConnected, currentUser?.id, loadEssentialData]);

  // OPTIMIZED: Memoized API call functions to prevent recreation
  const selectPrivateChat = useCallback(async (conversation) => {
    if (!currentUser?.id || loading) return;

    setLoading(true);
    setError('');
    
    try {
      const otherUser = conversation.participants.find(p => p._id !== currentUser.id);
      console.log('Selecting private chat with:', otherUser?._id);

      const response = await authenticatedApiCall(`${API_BASE}/chat/conversations/${otherUser._id}`);
      setCurrentConversation(response.conversation);
      setCurrentRoom(null);
      setSelectedChat(conversation._id);
      setChatType('private');
    } catch (error) {
      setError('Failed to load conversation: ' + error.message);
      console.error('Select private chat error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, authenticatedApiCall, loading]);

  const selectChatRoom = useCallback(async (room) => {
    if (!currentUser?.id || loading) return;

    setLoading(true);
    setError('');
    
    try {
      console.log('Selecting chat room:', room._id);
      const response = await authenticatedApiCall(`${API_BASE}/chat/rooms/${room._id}`);
      setCurrentRoom(response.chatRoom);
      setCurrentConversation(null);
      setSelectedChat(room._id);
      setChatType('room');
    } catch (error) {
      setError('Failed to load chat room: ' + error.message);
      console.error('Select chat room error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, authenticatedApiCall, loading]);

  const startNewConversation = useCallback(async (userId) => {
    if (loading) return;
    
    try {
      setError('');
      setLoading(true);

      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      if (!userId || userId === currentUser.id) {
        throw new Error('Invalid target user');
      }

      // Ensure user data is loaded before starting conversation
      if (!usersLoaded) {
        await loadUserData();
      }

      console.log('Starting new conversation with user:', userId);
      const response = await authenticatedApiCall(`${API_BASE}/chat/conversations/${userId}`);
      setCurrentConversation(response.conversation);
      setCurrentRoom(null);
      setSelectedChat(response.conversation._id);
      setChatType('private');
      setShowNewChatDialog(false);

      // Refresh conversations in background
      setTimeout(() => {
        loadEssentialData();
      }, 100);
    } catch (error) {
      setError('Failed to start conversation: ' + error.message);
      console.error('Start new conversation error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, authenticatedApiCall, loading, usersLoaded, loadUserData, loadEssentialData]);

  const createNewRoom = useCallback(async () => {
    if (!newRoomName.trim() || loading) return;

    try {
      setError('');
      setLoading(true);

      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating new room:', newRoomName);
      const response = await authenticatedApiCall(`${API_BASE}/chat/rooms`, {
        method: 'POST',
        body: JSON.stringify({
          name: newRoomName.trim(),
          description: newRoomDescription.trim()
        })
      });

      setNewRoomName('');
      setNewRoomDescription('');
      setShowNewRoomDialog(false);

      // Refresh rooms in background
      setTimeout(() => {
        loadEssentialData();
      }, 100);
      
      if (response.chatRoom) {
        selectChatRoom(response.chatRoom);
      }
    } catch (error) {
      setError('Failed to create room: ' + error.message);
      console.error('Create new room error:', error);
    } finally {
      setLoading(false);
    }
  }, [newRoomName, newRoomDescription, currentUser?.id, authenticatedApiCall, loading, loadEssentialData, selectChatRoom]);

  const joinRoom = useCallback(async (roomId) => {
    if (loading) return;
    
    try {
      setError('');
      console.log('Joining room:', roomId);

      await authenticatedApiCall(`${API_BASE}/chat/rooms/${roomId}/join`, { method: 'POST' });
      
      // Refresh rooms in background
      setTimeout(() => {
        loadEssentialData();
      }, 100);

      if (currentRoom && currentRoom._id === roomId) {
        selectChatRoom({ _id: roomId });
      }
    } catch (error) {
      setError('Failed to join room: ' + error.message);
      console.error('Join room error:', error);
    }
  }, [authenticatedApiCall, loading, loadEssentialData, currentRoom, selectChatRoom]);

  const leaveRoom = useCallback(async (roomId) => {
    if (loading) return;
    
    try {
      setError('');
      console.log('Leaving room:', roomId);

      await authenticatedApiCall(`${API_BASE}/chat/rooms/${roomId}/leave`, { method: 'POST' });
      
      // Refresh rooms in background
      setTimeout(() => {
        loadEssentialData();
      }, 100);

      if (currentRoom && currentRoom._id === roomId) {
        setCurrentRoom(null);
        setSelectedChat(null);
      }
    } catch (error) {
      setError('Failed to leave room: ' + error.message);
      console.error('Leave room error:', error);
    }
  }, [authenticatedApiCall, loading, loadEssentialData, currentRoom]);

  // OPTIMIZED: Socket event handlers remain the same but with better performance
  useEffect(() => {
    if (!socket || !currentUser?.id) return;

    const handleReceivePrivateMessage = (data) => {
      console.log('Received private message:', data);
      
      if (data.tempId) {
        setCurrentConversation(prev => {
          if (!prev || prev._id !== data.conversationId) return prev;
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg._id !== data.tempId)
          };
        });
      }

      setCurrentConversation(prev => {
        if (!prev || prev._id !== data.conversationId) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), data.message]
        };
      });

      setConversations(prev => prev.map(conv => {
        if (conv._id === data.conversationId) {
          return {
            ...conv,
            lastMessage: data.message
          };
        }
        return conv;
      }));
    };

    const handleReceiveRoomMessage = (data) => {
      console.log('Received room message:', data);
      
      if (data.tempId) {
        setCurrentRoom(prev => {
          if (!prev || prev._id !== data.roomId) return prev;
          return {
            ...prev,
            messages: prev.messages.filter(msg => msg._id !== data.tempId)
          };
        });
      }

      setCurrentRoom(prev => {
        if (!prev || prev._id !== data.roomId) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), data.message]
        };
      });
    };

    const handleConversationUpdated = (updatedConversation) => {
      console.log('Conversation updated:', updatedConversation._id);
      setConversations(prev => prev.map(conv =>
        conv._id === updatedConversation._id ? updatedConversation : conv
      ));
    };

    const handleRoomUpdated = (updatedRoom) => {
      console.log('Room updated:', updatedRoom._id);
      setChatRooms(prev => prev.map(room =>
        room._id === updatedRoom._id ? updatedRoom : room
      ));
    };

    const handleUserTyping = (data) => {
      const chatId = chatType === 'private' ? currentConversation?._id : currentRoom?._id;
      const typingChatId = data.conversationId || data.roomId;
      
      if (chatId === typingChatId && data.userId !== currentUser.id) {
        setTypingUsers(prev => ({
          ...prev,
          [typingChatId]: {
            ...prev[typingChatId],
            [data.userId]: data.userName
          }
        }));

        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = { ...prev };
            if (updated[typingChatId]) {
              delete updated[typingChatId][data.userId];
              if (Object.keys(updated[typingChatId]).length === 0) {
                delete updated[typingChatId];
              }
            }
            return updated;
          });
        }, 3000);
      }
    };

    socket.on('receive-private-message', handleReceivePrivateMessage);
    socket.on('receive-room-message', handleReceiveRoomMessage);
    socket.on('conversation-updated', handleConversationUpdated);
    socket.on('room-updated', handleRoomUpdated);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('receive-private-message', handleReceivePrivateMessage);
      socket.off('receive-room-message', handleReceiveRoomMessage);
      socket.off('conversation-updated', handleConversationUpdated);
      socket.off('room-updated', handleRoomUpdated);
      socket.off('user-typing', handleUserTyping);
    };
  }, [socket, currentUser?.id, chatType, currentConversation?._id, currentRoom?._id]);

  // Join rooms when chat is selected
  useEffect(() => {
    if (!socket || !selectedChat || !currentUser?.id) return;

    if (chatType === 'private' && currentConversation) {
      console.log('Joining conversation:', currentConversation._id);
      socket.emit('join-conversation', currentConversation._id);
      markMessagesAsRead && markMessagesAsRead(currentConversation._id);
    } else if (chatType === 'room' && currentRoom) {
      console.log('Joining room:', currentRoom._id);
      socket.emit('join-room', currentRoom._id);
      markMessagesAsRead && markMessagesAsRead(currentRoom._id, true);
    }

    return () => {
      if (chatType === 'private' && currentConversation) {
        socket.emit('leave-conversation', currentConversation._id);
      } else if (chatType === 'room' && currentRoom) {
        socket.emit('leave-room', currentRoom._id);
      }
    };
  }, [socket, selectedChat, chatType, currentConversation?._id, currentRoom?._id, markMessagesAsRead, currentUser?.id]);

  // OPTIMIZED: Improved message sending
  const sendMessage = useCallback(async () => {
    if (!message.trim() || !currentUser?.id || loading) return;

    const messageText = message;
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setMessage('');

    const tempMessage = {
      _id: tempId,
      content: messageText,
      sender: {
        _id: currentUser.id,
        userName: currentUser.name,
        id: currentUser.id
      },
      timestamp: new Date(),
      sending: true
    };

    try {
      setError('');

      if (chatType === 'private' && currentConversation) {
        setCurrentConversation(prev => ({
          ...prev,
          messages: [...(prev.messages || []), tempMessage]
        }));

        console.log('Sending private message to conversation:', currentConversation._id);
        socketSendMessage({
          conversationId: currentConversation._id,
          content: messageText,
          tempId
        });

      } else if (chatType === 'room' && currentRoom) {
        setCurrentRoom(prev => ({
          ...prev,
          messages: [...(prev.messages || []), tempMessage]
        }));

        console.log('Sending room message to room:', currentRoom._id);
        socketSendMessage({
          roomId: currentRoom._id,
          content: messageText,
          tempId
        });
      }

    } catch (error) {
      setError('Failed to send message: ' + error.message);
      setMessage(messageText);

      // Remove temp message on error
      if (chatType === 'private' && currentConversation) {
        setCurrentConversation(prev => ({
          ...prev,
          messages: prev.messages.filter(msg => msg._id !== tempId)
        }));
      } else if (chatType === 'room' && currentRoom) {
        setCurrentRoom(prev => ({
          ...prev,  
          messages: prev.messages.filter(msg => msg._id !== tempId)
        }));
      }

      console.error('Send message error:', error);
    }
  }, [message, currentUser?.id, chatType, currentConversation, currentRoom, socketSendMessage, loading]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleTyping = useCallback(() => {
    if (!socket || !selectedChat) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (chatType === 'private' && currentConversation) {
      startTyping && startTyping(currentConversation._id);
    } else if (chatType === 'room' && currentRoom) {
      startTyping && startTyping(currentRoom._id, true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (chatType === 'private' && currentConversation) {
        stopTyping && stopTyping(currentConversation._id);
      } else if (chatType === 'room' && currentRoom) {
        stopTyping && stopTyping(currentRoom._id, true);
      }
    }, 1000);
  }, [socket, selectedChat, chatType, currentConversation, currentRoom, startTyping, stopTyping]);

  // Utility functions
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  }, []);

  const getCurrentMessages = useCallback(() => {
    if (chatType === 'private' && currentConversation) {
      return currentConversation.messages || [];
    }
    if (chatType === 'room' && currentRoom) {
      return currentRoom.messages || [];
    }
    return [];
  }, [chatType, currentConversation, currentRoom]);

  const getCurrentChatName = useCallback(() => {
    if (chatType === 'private' && currentConversation) {
      const otherUser = currentConversation.participants.find(p => p._id !== currentUser?.id);
      return otherUser?.userName || 'Unknown User';
    }
    if (chatType === 'room' && currentRoom) {
      return currentRoom.name;
    }
    return 'Select a chat';
  }, [chatType, currentConversation, currentRoom, currentUser?.id]);

  const isCurrentUserInRoom = useCallback((room) => {
    if (!currentUser?.id || !room.participants) return false;
    return room.participants.some(p => (p._id || p) === currentUser.id);
  }, [currentUser?.id]);

  const isMessageFromCurrentUser = useCallback((msg) => {
    if (!currentUser?.id || !msg.sender) return false;

    const senderId = msg.sender._id || msg.sender.id || msg.sender;
    const currentUserId = currentUser.id;

    return senderId === currentUserId;
  }, [currentUser?.id]);

  const getTypingIndicator = useCallback(() => {
    if (!selectedChat) return null;

    const chatId = chatType === 'private' ? currentConversation?._id : currentRoom?._id;
    const typingUsersInChat = typingUsers[chatId];

    if (!typingUsersInChat || Object.keys(typingUsersInChat).length === 0) {
      return null;
    }

    const names = Object.values(typingUsersInChat);
    let text = '';

    if (names.length === 1) {
      text = `${names[0]} is typing...`;
    } else if (names.length === 2) {
      text = `${names[0]} and ${names[1]} are typing...`;
    } else {
      text = `${names[0]}, ${names[1]}, and others are typing...`;
    }

    return (
      <div className="flex items-center px-4 py-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        {text}
      </div>
    );
  }, [selectedChat, chatType, currentConversation?._id, currentRoom?._id, typingUsers]);

  // OPTIMIZED: Memoized computed values with proper dependencies
  const allChats = useMemo(() => [
    ...conversations.map(conv => ({
      ...conv,
      type: 'private',
      name: conv.participants.find(p => p._id !== currentUser?.id)?.userName || 'Unknown',
      avatar: conv.participants.find(p => p._id !== currentUser?.id)?.userName?.charAt(0) || 'U'
    })),
    ...chatRooms.map(room => ({
      ...room,
      type: 'room',
      name: room.name,
      avatar: room.name.charAt(0)
    }))
  ], [conversations, chatRooms, currentUser?.id]);

  const filteredChats = useMemo(() => 
    allChats.filter(chat =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [allChats, searchTerm]
  );

  // OPTIMIZED: Load users on demand when dialog opens
  const handleNewChatDialog = useCallback(() => {
    setShowNewChatDialog(true);
    // Load user data if not already loaded
    if (!usersLoaded) {
      loadUserData();
    }
  }, [usersLoaded, loadUserData]);

  const getCurrentUsers = useCallback(() => {
    if (allUsers.length > 0) {
      return allUsers;
    }
    
    const users = userType === 'clients' ? clients : admins;
    return users;
  }, [userType, clients, admins, allUsers]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [getCurrentMessages, scrollToBottom]);

  // OPTIMIZED: Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    try {
      setError('');
      console.log('Manual refresh triggered');
      
      await Promise.allSettled([
        loadEssentialData(),
        loadUserData()
      ]);
      
      console.log('Manual refresh completed');
    } catch (error) {
      console.error('Manual refresh error:', error);
      setError('Failed to refresh data');
    }
  }, [loadEssentialData, loadUserData]);

  // OPTIMIZED: Faster loading screen - shows immediately while essential data loads
  if (initialLoading && (!conversationsLoaded && !roomsLoaded)) {
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading Chat
            </h3>
            <p className="text-gray-600 text-sm">
              Connecting to your conversations...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please log in to access the chat feature
            </p>
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow-sm border overflow-hidden">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 max-w-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError('')} className="ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Chat Sidebar */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleNewChatDialog}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="New Chat"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNewRoomDialog(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="New Room"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleManualRefresh}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Refresh"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {initialLoading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-sm">Loading conversations...</span>
                </div>
              ) : (
                "No conversations found"
              )}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={`${chat.type}-${chat._id}`}
                onClick={() => chat.type === 'private' ? selectPrivateChat(chat) : selectChatRoom(chat)}
                className={`p-4 border-b cursor-pointer transition-colors ${
                  selectedChat === chat._id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                      chat.type === 'room' ? 'bg-purple-500' : 'bg-green-500'
                    }`}>
                      {chat.type === 'room' ? <Hash className="w-6 h-6" /> : chat.avatar}
                    </div>
                    {chat.type === 'private' && isUserOnline && isUserOnline(chat.participants?.find(p => p._id !== currentUser?.id)?._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                      {chat.type === 'private' && isUserOnline && (
                        <span className={`w-2 h-2 rounded-full ${
                          isUserOnline(chat.participants?.find(p => p._id !== currentUser?.id)?._id) 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}></span>
                      )}
                    </div>
                    {chat.type === 'room' && (
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center">
                          <Users className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">
                            {chat.participants?.length || 0} members
                          </span>
                        </div>
                        {!isCurrentUserInRoom(chat) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinRoom(chat._id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 rounded"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  chatType === 'room' ? 'bg-purple-500' : 'bg-green-500'
                }`}>
                  {chatType === 'room' ? <Hash className="w-5 h-5" /> : getCurrentChatName().charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{getCurrentChatName()}</h3>
                  {chatType === 'room' && currentRoom && (
                    <p className="text-sm text-gray-500">{currentRoom.participants?.length || 0} members</p>
                  )}
                  {chatType === 'private' && (
                    <p className="text-sm text-gray-500">
                      {isUserOnline && isUserOnline(currentConversation?.participants?.find(p => p._id !== currentUser?.id)?._id) ? 'Online' : 'Offline'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {chatType === 'room' && currentRoom && isCurrentUserInRoom(currentRoom) && (
                  <button
                    onClick={() => leaveRoom(currentRoom._id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    title="Leave Room"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {getCurrentMessages().map((msg, index) => {
                const isFromCurrentUser = isMessageFromCurrentUser(msg);
                const showAvatar = index === 0 || 
                  getCurrentMessages()[index - 1]?.sender?._id !== msg.sender?._id;

                return (
                  <div
                    key={msg._id || `msg-${index}`}
                    className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                      isFromCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      {!isFromCurrentUser && showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                          {msg.sender?.userName?.charAt(0) || 'U'}
                        </div>
                      )}
                      {!isFromCurrentUser && !showAvatar && (
                        <div className="w-8 h-8"></div>
                      )}

                      <div className={`px-4 py-2 rounded-lg max-w-full ${
                        isFromCurrentUser
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none shadow-sm'
                      }`}>
                        {!isFromCurrentUser && showAvatar && (
                          <div className="text-xs font-medium mb-1 text-gray-600">
                            {msg.sender?.userName || 'Unknown'}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(msg.timestamp)}</span>
                          {isFromCurrentUser && (
                            <>
                              {msg.sending ? (
                                <Clock className="w-3 h-3" />
                              ) : (
                                <CheckCheck className="w-3 h-3" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {getTypingIndicator()}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="1"
                    style={{ maxHeight: '120px' }}
                  />
                </div>

                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || loading}
                  className={`p-2 rounded-full transition-colors ${
                    message.trim() && !loading
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Chat
              </h3>
              <p className="text-gray-600">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      {showNewChatDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-96 flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Start New Conversation</h3>
                <button
                  onClick={() => setShowNewChatDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {allUsers.length === 0 && (clients.length > 0 || admins.length > 0) && (
                <div className="mt-4">
                  <div className="flex border-b">
                    <button
                      onClick={() => setUserType('clients')}
                      className={`px-4 py-2 text-sm font-medium ${
                        userType === 'clients'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Clients ({clients.length})
                    </button>
                    <button
                      onClick={() => setUserType('admins')}
                      className={`px-4 py-2 text-sm font-medium ${
                        userType === 'admins'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Admins ({admins.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!usersLoaded ? (
                <div className="text-center text-gray-500 py-8">
                  <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p>Loading users...</p>
                </div>
              ) : getCurrentUsers().length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="mb-4">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No users found</p>
                  </div>
                  <button
                    onClick={loadUserData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Refresh Users
                  </button>
                </div>
              ) : (
                getCurrentUsers()
                  .filter(u => u._id !== currentUser?.id)
                  .map((targetUser) => (
                    <div
                      key={targetUser._id}
                      onClick={() => startNewConversation(targetUser._id)}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {(targetUser.userName || targetUser.name || 'U').charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {targetUser.userName || targetUser.name || 'Unknown User'}
                          </h4>
                          {targetUser.role === 'admin' && (
                            <Shield className="w-4 h-4 text-blue-500" />
                          )}
                          {isUserOnline && isUserOnline(targetUser._id) && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {targetUser.Email || targetUser.email || 'No email'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {targetUser.role || 'user'}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Room Dialog */}
      {showNewRoomDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Room</h3>
                <button
                  onClick={() => setShowNewRoomDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter room name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    placeholder="Enter room description..."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowNewRoomDialog(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewRoom}
                    disabled={!newRoomName.trim() || loading}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      newRoomName.trim() && !loading
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}