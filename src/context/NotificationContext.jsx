import { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const { 
    notifications, 
    unreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications 
  } = useSocket();

  // Check notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
    } else if (Notification.permission === 'default') {
      // Auto-request permission
      Notification.requestPermission().then(permission => {
        setBrowserNotificationsEnabled(permission === 'granted');
      });
    }
  }, []);

  // Load notification preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notificationPreferences');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setSoundEnabled(prefs.soundEnabled ?? true);
        setBrowserNotificationsEnabled(prefs.browserNotificationsEnabled ?? false);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('notificationPreferences', JSON.stringify({
      soundEnabled,
      browserNotificationsEnabled
    }));
  }, [soundEnabled, browserNotificationsEnabled]);

  // Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled) {
      try {
        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification) => {
    if (browserNotificationsEnabled && Notification.permission === 'granted') {
      try {
        const browserNotif = new Notification(`New message from ${notification.senderName}`, {
          body: notification.content.length > 100 ? 
            notification.content.substring(0, 100) + '...' : 
            notification.content,
          icon: '/favicon.ico',
          tag: `chat_${notification.chatId}`,
          badge: '/favicon.ico',
          silent: false,
          requireInteraction: false
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          browserNotif.close();
        }, 5000);

        // Handle click to open chat
        browserNotif.onclick = () => {
          window.focus();
          // Navigate to chat page
          const basePath = window.location.pathname.includes('/admin') ? '/admin' : '/client';
          window.location.href = `${basePath}/chat`;
          browserNotif.close();
        };
      } catch (error) {
        console.error('Error showing browser notification:', error);
      }
    }
  };

  // Handle new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.read) {
        // Play sound for new notifications
        playNotificationSound();
        
        // Show browser notification
        showBrowserNotification(latestNotification);
      }
    }
  }, [notifications, soundEnabled, browserNotificationsEnabled]);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setBrowserNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const toggleBrowserNotifications = async () => {
    if (!browserNotificationsEnabled && Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      setBrowserNotificationsEnabled(granted);
    } else {
      setBrowserNotificationsEnabled(!browserNotificationsEnabled);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.read);
  };

  const getNotificationsByChat = (chatId) => {
    return notifications.filter(n => n.chatId === chatId);
  };

  const value = {
    // Notification data
    notifications,
    unreadCount,
    
    // Preferences
    browserNotificationsEnabled,
    soundEnabled,
    
    // Functions
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    getUnreadNotifications,
    getNotificationsByChat,
    
    // Settings
    toggleBrowserNotifications,
    toggleSound,
    requestNotificationPermission,
    
    // Utils
    playNotificationSound,
    showBrowserNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};