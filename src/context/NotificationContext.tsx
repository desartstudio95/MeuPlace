import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { playNotificationSound } from '@/utils/sound';
import { toast } from 'sonner';
import { messaging, onMessageListener, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

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
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for Firestore notifications
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'user_notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const notification = {
            id: change.doc.id,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            read: data.read || false,
            date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            link: data.link
          };

          // Add to local state if not already there
          setNotifications(prev => {
            const exists = prev.some(n => n.id === notification.id);
            if (exists) return prev;
            
            // Play sound and show toast for new notifications
            if (!notification.read) {
              playNotificationSound();
              if (notification.type === 'success') {
                toast.success(notification.title, { description: notification.message });
              } else if (notification.type === 'error') {
                toast.error(notification.title, { description: notification.message });
              } else {
                toast.info(notification.title, { description: notification.message });
              }
            }
            
            return [notification, ...prev];
          });
        } else if (change.type === 'modified') {
          const data = change.doc.data();
          setNotifications(prev => prev.map(n => n.id === change.doc.id ? { ...n, read: data.read } : n));
        } else if (change.type === 'removed') {
          setNotifications(prev => prev.filter(n => n.id !== change.doc.id));
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

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
    let isMounted = true;
    
    const setupListener = async () => {
      try {
        const payload: any = await onMessageListener();
        if (isMounted && payload?.notification) {
          addNotification({
            title: payload.notification.title || 'Nova Notificação',
            message: payload.notification.body || '',
            type: 'info',
            link: payload.data?.link
          });
          // Set up next listener
          setupListener();
        }
      } catch (error) {
        console.error('Error in onMessageListener:', error);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
    };
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

  const markAsRead = async (id: string) => {
    // Update Firestore if it's a Firestore notification
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      try {
        const notificationRef = doc(db, 'user_notifications', id);
        await updateDoc(notificationRef, { read: true });
      } catch (e) {
        // Might be a local notification, ignore error
      }
    }

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    for (const n of unreadNotifications) {
      try {
        const notificationRef = doc(db, 'user_notifications', n.id);
        await updateDoc(notificationRef, { read: true });
      } catch (e) {
        // Ignore
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = async () => {
    for (const n of notifications) {
      try {
        const notificationRef = doc(db, 'user_notifications', n.id);
        await deleteDoc(notificationRef);
      } catch (e) {
        // Ignore
      }
    }
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
