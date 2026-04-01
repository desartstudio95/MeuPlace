import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { playNotificationSound } from '@/utils/sound';
import { toast } from 'sonner';
import { messaging, onMessageListener } from '@/lib/firebase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from local storage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Failed to parse notifications from local storage', e);
      }
    } else {
      // Add a welcome notification if empty
      addNotification({
        title: 'Bem-vindo ao Meu Place!',
        message: 'Configure alertas para receber notificações sobre novos imóveis.',
        type: 'info'
      });
    }
  }, []);

  // Listen for Firebase messages
  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessageListener().then((payload: any) => {
        if (payload?.notification) {
          addNotification({
            title: payload.notification.title || 'Nova Notificação',
            message: payload.notification.body || '',
            type: 'info',
            link: payload.data?.link
          });
        }
      });
      return () => {
        // cleanup if needed
      };
    }
  }, []);

  // Save notifications to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    setNotifications(prev => {
      // Check if there's already an identical unread notification
      const isDuplicate = prev.some(n => 
        !n.read && 
        n.title === notification.title && 
        n.message === notification.message
      );
      
      if (isDuplicate) return prev;
      
      const newNotification: Notification = {
        ...notification,
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        read: false,
      };
      
      playNotificationSound();

      // Trigger browser push notification if supported and granted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new window.Notification(notification.title, {
            body: notification.message,
            icon: '/vite.svg' // Using default vite icon as fallback
          });
        } catch (e) {
          console.error('Error showing push notification:', e);
        }
      }

      // Show toast notification
      if (notification.type === 'success') {
        toast.success(notification.title, { description: notification.message });
      } else if (notification.type === 'error') {
        toast.error(notification.title, { description: notification.message });
      } else if (notification.type === 'warning') {
        toast.warning(notification.title, { description: notification.message });
      } else {
        toast.info(notification.title, { description: notification.message });
      }
      
      return [newNotification, ...prev];
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
