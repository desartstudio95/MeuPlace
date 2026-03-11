import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function NotificationsPopover() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 sm:origin-top-right">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Notificações</h3>
              <p className="text-xs text-gray-500">Você tem {unreadCount} não lidas</p>
            </div>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                  onClick={markAllAsRead}
                  title="Marcar todas como lidas"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-600 hover:bg-red-50" 
                  onClick={clearNotifications}
                  title="Limpar todas"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-400 hover:text-gray-600" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {new Date(notification.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.link ? (
                        <Link 
                          to={notification.link} 
                          className="inline-block mt-2 text-xs font-medium text-brand-green hover:underline"
                          onClick={() => handleNotificationClick(notification.id, notification.link)}
                        >
                          Ver detalhes
                        </Link>
                      ) : (
                         !notification.read && (
                            <button 
                              className="mt-2 text-xs text-gray-400 hover:text-brand-green transition-colors"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Marcar como lida
                            </button>
                         )
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm">Nenhuma notificação no momento.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
