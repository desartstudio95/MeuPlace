import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { playNotificationSound } from '@/utils/sound';
import { toast } from 'sonner';
import { messaging, onMessageListener, db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  QueryDocumentSnapshot,
  DocumentData 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { NotificationType } from '@/types';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  date: string;
  type: NotificationType;
  category?: 'lead' | 'viewing' | 'property' | 'system' | 'chat';
  entityType?: 'lead' | 'viewing' | 'property' | 'system';
  entityId?: string;
  propertyId?: string;
  leadId?: string;
  viewingId?: string;
  link?: string;
  priority?: 'low' | 'normal' | 'high';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const PAGE_SIZE = 25;

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
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const lastVisibleDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Helper de mapeamento de documento Firestore
  const mapDocToNotification = (docSnap: any): Notification => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title || 'Notificação',
      message: data.message || '',
      type: (data.type || 'info') as NotificationType,
      category: data.category,
      entityType: data.entityType,
      entityId: data.entityId,
      propertyId: data.propertyId,
      leadId: data.leadId,
      viewingId: data.viewingId,
      read: data.read || false,
      date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      link: data.link || (data.leadId ? `/crm/leads/${data.leadId}` : undefined),
      priority: data.priority || 'normal'
    };
  };

  // 1. Escuta em tempo real da primeira página (PAGE_SIZE itens mais recentes)
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setHasMore(false);
      lastVisibleDocRef.current = null;
      return;
    }

    const q = query(
      collection(db, 'user_notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Notification[] = [];
      snapshot.forEach(docSnap => {
        items.push(mapDocToNotification(docSnap));
      });

      if (!snapshot.empty) {
        lastVisibleDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length >= PAGE_SIZE);
      } else {
        lastVisibleDocRef.current = null;
        setHasMore(false);
      }

      // Detecta novos itens não lidos adicionados em tempo real para alerta sonoro e toast
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notif = mapDocToNotification(change.doc);
          if (!notif.read) {
            playNotificationSound();
            if (notif.type === 'success' || notif.type === 'lead_received') {
              toast.success(notif.title, { description: notif.message });
            } else if (notif.type === 'error') {
              toast.error(notif.title, { description: notif.message });
            } else if (notif.type === 'warning') {
              toast.warning(notif.title, { description: notif.message });
            } else {
              toast.info(notif.title, { description: notif.message });
            }
          }
        }
      });

      setNotifications(prev => {
        // Preserva itens paginados previamente carregados além da página inicial
        const newIds = new Set(items.map(i => i.id));
        const olderItems = prev.filter(p => !newIds.has(p.id));
        return [...items, ...olderItems];
      });
    }, (error) => {
      console.warn('[NotificationContext] Erro ao subscrever notificações:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. FASE 8: Paginação baseada em Cursor (startAfter)
  const loadMore = async () => {
    if (!currentUser || !lastVisibleDocRef.current || isLoadingMore || !hasMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const nextQuery = query(
        collection(db, 'user_notifications'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisibleDocRef.current),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(nextQuery);
      if (snap.empty) {
        setHasMore(false);
        return;
      }

      const nextItems: Notification[] = [];
      snap.forEach(d => {
        nextItems.push(mapDocToNotification(d));
      });

      lastVisibleDocRef.current = snap.docs[snap.docs.length - 1];
      setHasMore(snap.docs.length >= PAGE_SIZE);

      setNotifications(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNext = nextItems.filter(item => !existingIds.has(item.id));
        return [...prev, ...uniqueNext];
      });
    } catch (e) {
      console.error('[NotificationContext] Erro ao carregar mais notificações:', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 3. Fallback para notificações locais anônimas / offline
  useEffect(() => {
    if (currentUser) return; // Utilizador autenticado utiliza exclusivamente Firestore
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error('Falha ao processar notificações do armazenamento local', e);
      }
    } else {
      addNotification({
        title: 'Bem-vindo ao Meu Place!',
        message: 'Configure alertas para receber notificações sobre novos imóveis em Moçambique.',
        type: 'info'
      });
    }
  }, [currentUser]);

  // Push notifications listener
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
          setupListener();
        }
      } catch (error) {
        // FCM opcional
      }
    };
    setupListener();
    return () => { isMounted = false; };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    setNotifications(prev => {
      const isDuplicate = prev.some(n => 
        !n.read && 
        n.title === notification.title && 
        n.message === notification.message
      );
      if (isDuplicate) return prev;

      const newNotification: Notification = {
        ...notification,
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_notif`,
        date: new Date().toISOString(),
        read: false,
      };

      playNotificationSound();

      if (notification.type === 'success' || notification.type === 'lead_received') {
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
    const notification = notifications.find(n => n.id === id);
    if (notification && currentUser) {
      try {
        const notificationRef = doc(db, 'user_notifications', id);
        await updateDoc(notificationRef, { read: true });
      } catch (e) {
        // Ignora se for notificação em memória
      }
    }
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    for (const n of unreadNotifications) {
      if (currentUser) {
        try {
          const notificationRef = doc(db, 'user_notifications', n.id);
          await updateDoc(notificationRef, { read: true });
        } catch {
          // Ignora
        }
      }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = async () => {
    for (const n of notifications) {
      if (currentUser) {
        try {
          const notificationRef = doc(db, 'user_notifications', n.id);
          await deleteDoc(notificationRef);
        } catch {
          // Ignora
        }
      }
    }
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasMore,
        isLoadingMore,
        loadMore,
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
