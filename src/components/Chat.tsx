import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { X, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { playNotificationSound } from '@/utils/sound';

interface Message {
  id: string;
  roomId: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
}

interface ChatProps {
  propertyId: string;
  agentName: string;
  onClose: () => void;
}

export function Chat({ propertyId, agentName, onClose }: ChatProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Memoize guest ID to prevent infinite re-renders
  const guestIdRef = useRef('guest_' + Math.random().toString(36).substring(7));
  
  // Use a combination of property ID and user ID for the room
  // In a real app, this would be more secure and persistent
  const currentUserId = user?.id || guestIdRef.current;
  const currentUserName = user?.name || 'Visitante';
  const roomId = `prop_${propertyId}_user_${currentUserId}`;

  useEffect(() => {
    // Connect to Socket.IO server
    // Use the current window location to connect to the same host/port
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      newSocket.emit('join_room', roomId);
    });

    newSocket.on('previous_messages', (prevMessages: Message[]) => {
      setMessages(prevMessages);
    });

    newSocket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== currentUserId) {
        playNotificationSound();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      roomId,
      text: newMessage,
      senderId: currentUserId,
      senderName: currentUserName,
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="bg-brand-green text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Chat com {agentName}</h3>
            <p className="text-xs text-brand-green-hover opacity-90">Online</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 h-80 overflow-y-auto bg-gray-50 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-10">
            Envie uma mensagem para iniciar a conversa com o agente.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-400 mb-1 px-1">
                  {isMe ? 'Você' : msg.senderName}
                </span>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-brand-green text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-full bg-gray-50 border-gray-200 focus-visible:ring-brand-green"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full bg-brand-green hover:bg-brand-green-hover text-white shrink-0"
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
