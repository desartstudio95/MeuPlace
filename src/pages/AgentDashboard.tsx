import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PropertyCard } from '@/components/PropertyCard';
import { 
  LayoutDashboard, 
  Home, 
  User, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MessageSquare, 
  TrendingUp,
  Camera,
  CheckCircle,
  Clock,
  Search,
  Phone,
  Mail,
  Check,
  Menu,
  X,
  BadgeCheck,
  Send,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { playNotificationSound } from '@/utils/sound';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, onSnapshot, orderBy, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Property } from '@/types';
import { resizeImage } from '@/utils/imageUtils';
import { useNotifications } from '@/context/NotificationContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export function AgentDashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [activeChatRoom, setActiveChatRoom] = useState<any>(null);
  const [showArchivedChats, setShowArchivedChats] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotifications();
  
  // Reply Dialog State
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplySuccess, setShowReplySuccess] = useState(false);

  // Mock data for the dashboard
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [premiumAgency, setPremiumAgency] = useState<any>(null);
  const [loadingPremium, setLoadingPremium] = useState(false);
  const [isSavingPremium, setIsSavingPremium] = useState(false);
  const [premiumFormData, setPremiumFormData] = useState({
    name: '',
    websiteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    logoUrl: ''
  });
  const [uploadingPremiumLogo, setUploadingPremiumLogo] = useState(false);

  useEffect(() => {
    if (premiumAgency) {
      setPremiumFormData({
        name: premiumAgency.name || '',
        websiteUrl: premiumAgency.websiteUrl || '',
        facebookUrl: premiumAgency.facebookUrl || '',
        instagramUrl: premiumAgency.instagramUrl || '',
        logoUrl: premiumAgency.logoUrl || ''
      });
    } else if (userProfile) {
      setPremiumFormData(prev => ({
        ...prev,
        name: userProfile.agencyName || userProfile.displayName || ''
      }));
    }
  }, [premiumAgency, userProfile]);

  useEffect(() => {
    const fetchPremiumAgency = async () => {
      if (!currentUser || userProfile?.planId !== 'unlimited') return;
      setLoadingPremium(true);
      try {
        const q = query(collection(db, 'premium_agencies'), where('agentId', '==', currentUser.uid));
        const qs = await getDocs(q);
        if (!qs.empty) {
          setPremiumAgency({ id: qs.docs[0].id, ...qs.docs[0].data() });
        }
      } catch (error) {
        console.error("Error fetching premium agency:", error);
      } finally {
        setLoadingPremium(false);
      }
    };
    fetchPremiumAgency();
  }, [currentUser, userProfile?.planId]);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state so it doesn't persist on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    const fetchMyPropertiesAndMessages = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'properties'), where('agentId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedProperties: Property[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProperties.push({ id: doc.id, ...doc.data() } as Property);
        });
        setMyProperties(fetchedProperties);

      } catch (error) {
        console.error("Error fetching agent data:", error);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchMyPropertiesAndMessages();

    // Listen for new messages in real-time
    if (!currentUser) return;
    const messagesQ = query(collection(db, 'messages'), where('receiverId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(messagesQ, (snapshot) => {
      const fetchedMessages: any[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by date descending
      fetchedMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Check for new unread messages to show notification
      if (messages.length > 0) {
        const newUnreadMessages = fetchedMessages.filter(
          newMsg => !newMsg.read && !messages.find(oldMsg => oldMsg.id === newMsg.id)
        );
        
        if (newUnreadMessages.length > 0) {
          playNotificationSound();
          addNotification({
            title: 'Nova Mensagem',
            message: `Você recebeu ${newUnreadMessages.length} nova(s) mensagem(ns).`,
            type: 'info'
          });
        }
      }
      
      setMessages(fetchedMessages);
    }, (error) => {
      console.error("Error listening to messages:", error);
    });

    // Listen for live chat rooms
    if (!currentUser) return;
    const chatRoomsQ = query(collection(db, 'chatRooms'), where('agentId', '==', currentUser.uid));
    const unsubscribeChatRooms = onSnapshot(chatRoomsQ, (snapshot) => {
      const fetchedRooms: any[] = [];
      snapshot.forEach((doc) => {
        fetchedRooms.push({ id: doc.id, ...doc.data() });
      });
      // Sort by last activity
      fetchedRooms.sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());
      setChatRooms(fetchedRooms);
    });

    return () => {
      unsubscribe();
      unsubscribeChatRooms();
    };
  }, [currentUser]);

  // Listen for messages in the active chat room
  useEffect(() => {
    if (!activeChatRoom) {
      setChatMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', activeChatRoom.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: any[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() });
      });
      setChatMessages(fetchedMessages);
      
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [activeChatRoom]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !activeChatRoom || !currentUser) return;

    const messageData = {
      roomId: activeChatRoom.id,
      text: newChatMessage,
      senderId: currentUser.uid,
      senderName: userProfile?.displayName || 'Agente',
      timestamp: new Date().toISOString()
    };

    setNewChatMessage('');

    try {
      await addDoc(collection(db, 'chats', activeChatRoom.id, 'messages'), messageData);
      
      // Update room metadata
      await setDoc(doc(db, 'chatRooms', activeChatRoom.id), {
        lastMessage: newChatMessage,
        lastTimestamp: new Date().toISOString(),
        updatedAt: serverTimestamp(),
        isArchived: false // Ensure it's unarchived on new message
      }, { merge: true });
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };

  const handleToggleArchive = async (roomId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'chatRooms', roomId), {
        isArchived: !currentStatus,
        updatedAt: serverTimestamp()
      });
      if (activeChatRoom?.id === roomId) {
        setActiveChatRoom({ ...activeChatRoom, isArchived: !currentStatus });
      }
      addNotification({
        title: !currentStatus ? 'Conversa Arquivada' : 'Conversa Desarquivada',
        message: !currentStatus ? 'A conversa foi movida para o arquivo.' : 'A conversa foi movida para as ativas.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error toggling archive status:', error);
      addNotification({ title: 'Erro', message: 'Erro ao alterar status da conversa.', type: 'error' });
    }
  };

  const filteredChatRooms = chatRooms.filter(room => 
    showArchivedChats ? room.isArchived : !room.isArchived
  );

  const isResort = userProfile?.role === 'resort';
  const propertyLabel = isResort ? 'Acomodações' : 'Imóveis';
  const propertyLabelSingular = isResort ? 'Acomodação' : 'Imóvel';

  const totalViews = myProperties.reduce((acc, prop) => acc + (prop.views || 0), 0);
  const planLimit = userProfile?.planLimit || 5;
  const isUnlimited = planLimit >= 900000;

  const stats = [
    { label: `${propertyLabel} Ativos`, value: `${myProperties.length} / ${isUnlimited ? '∞' : planLimit}`, icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Visualizações Totais', value: totalViews.toLocaleString(), icon: Eye, color: 'text-green-600', bg: 'bg-green-100' },
    { label: isResort ? 'Reservas (Mensagens)' : 'Leads (Mensagens)', value: messages.length, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Taxa de Conversão', value: messages.length > 0 && totalViews > 0 ? `${((messages.length / totalViews) * 100).toFixed(1)}%` : '0%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const [profileData, setProfileData] = useState({
    name: userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Agente Imobiliário',
    email: currentUser?.email || 'agente@meuplace.co.mz',
    phone: userProfile?.phone || '+258 84 123 4567',
    whatsapp: userProfile?.whatsapp || '+258 84 123 4567',
    bio: userProfile?.bio || 'Especialista em imóveis de luxo na cidade de Maputo com mais de 5 anos de experiência.',
    avatar: userProfile?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    instagram: userProfile?.instagram || '',
    facebook: userProfile?.facebook || '',
    agencyName: userProfile?.agencyName || '',
    isVerified: true
  });

  const { updateUserProfile } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePremiumLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingPremiumLogo(true);
    try {
      const storageRef = ref(storage, `agency_logos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {},
        (error) => {
          console.error("Upload error:", error);
          addNotification({ title: 'Erro', message: 'Falha ao carregar o logotipo.', type: 'error' });
          setUploadingPremiumLogo(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setPremiumFormData(prev => ({ ...prev, logoUrl: downloadURL }));
          setUploadingPremiumLogo(false);
        }
      );
    } catch (error) {
      console.error("Error initiating upload:", error);
      setUploadingPremiumLogo(false);
    }
  };

  const handlePremiumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    if (userProfile.planId !== 'unlimited') {
      addNotification({ title: 'Acesso Restrito', message: 'Apenas usuários do plano Unlimited podem gerenciar agência premium.', type: 'error' });
      return;
    }

    if (!premiumFormData.name || !premiumFormData.logoUrl) {
      addNotification({ title: 'Aviso', message: 'Nome e Logotipo são obrigatórios.', type: 'info' });
      return;
    }

    setIsSavingPremium(true);
    try {
      if (premiumAgency?.id) {
        const agencyRef = doc(db, 'premium_agencies', premiumAgency.id);
        await updateDoc(agencyRef, {
          ...premiumFormData,
          updatedAt: serverTimestamp()
        });
        addNotification({ title: 'Sucesso', message: 'Informações premium atualizadas!', type: 'success' });
      } else {
        const newAgency = {
          ...premiumFormData,
          agentId: currentUser.uid,
          isActive: true,
          order: 99,
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'premium_agencies'), newAgency);
        setPremiumAgency({ id: docRef.id, ...newAgency });
        addNotification({ title: 'Sucesso', message: 'Agência Premium ativada com sucesso!', type: 'success' });
      }
    } catch (error) {
      console.error("Error saving premium agency:", error);
      addNotification({ title: 'Erro', message: 'Não foi possível salvar as informações.', type: 'error' });
    } finally {
      setIsSavingPremium(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        displayName: profileData.name,
        photoURL: profileData.avatar,
        phone: profileData.phone,
        whatsapp: profileData.whatsapp,
        bio: profileData.bio,
        instagram: profileData.instagram,
        facebook: profileData.facebook,
        agencyName: profileData.agencyName
      });
      setShowSuccessMessage(true);
      playNotificationSound();
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      addNotification({ title: 'Erro', message: 'Erro ao atualizar perfil.', type: 'error' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      addNotification({ title: 'Erro', message: 'Por favor, selecione uma imagem.', type: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification({ title: 'Erro', message: 'A imagem deve ter no máximo 5MB.', type: 'error' });
      return;
    }

    setUploadingAvatar(true);
    
    try {
      const base64Image = await resizeImage(file, 200, 200);
      setProfileData(prev => ({ ...prev, avatar: base64Image }));
      setUploadingAvatar(false);
    } catch (error) {
      console.error('Error in file upload:', error);
      addNotification({ title: 'Erro', message: 'Erro ao processar a imagem.', type: 'error' });
      setUploadingAvatar(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  const handleDeleteProperty = async (id: string) => {
    setPropertyToDelete(id);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    try {
      await deleteDoc(doc(db, 'properties', propertyToDelete));
      setMyProperties(myProperties.filter(p => p.id !== propertyToDelete));
      playNotificationSound();
    } catch (error) {
      console.error("Error deleting property:", error);
    } finally {
      setPropertyToDelete(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'Disponível' | 'Vendido' | 'Arrendado') => {
    try {
      const propertyRef = doc(db, 'properties', id);
      await updateDoc(propertyRef, { status: newStatus });
      setMyProperties(myProperties.map(p => 
        p.id === id ? { ...p, status: newStatus } : p
      ));
      setShowSuccessMessage(true);
      playNotificationSound();
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Error updating property status:", error);
      addNotification({ title: 'Erro', message: 'Erro ao atualizar status.', type: 'error' });
    }
  };

  const toggleMessageRead = async (id: string) => {
    try {
      const messageToUpdate = messages.find(msg => msg.id === id);
      if (!messageToUpdate) return;
      
      const newReadStatus = !messageToUpdate.read;
      
      const messageRef = doc(db, 'messages', id);
      await updateDoc(messageRef, { read: newReadStatus });
      
      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, read: newReadStatus } : msg
      ));
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  const openReplyDialog = (message: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMessage(message);
    setReplyText('');
    setReplyDialogOpen(true);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;
    
    // Simulate sending reply
    console.log(`Replying to ${selectedMessage.email}: ${replyText}`);
    
    // Mark as read if it wasn't
    if (!selectedMessage.read) {
      toggleMessageRead(selectedMessage.id);
    }
    
    setReplyDialogOpen(false);
    setShowReplySuccess(true);
    playNotificationSound();
    setTimeout(() => setShowReplySuccess(false), 3000);
  };

  const filteredMessages = messages.filter(msg => 
    (msg.senderName || msg.sender || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.propertyTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingProperties) {
    return <LoadingScreen />;
  }

  if (userProfile && !userProfile.isApproved) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro em Análise</h2>
        <p className="text-gray-600 max-w-md mb-6">
          Seu cadastro como agente está sendo analisado pela nossa equipe. 
          Você receberá uma notificação assim que for aprovado.
        </p>
        <Button onClick={() => navigate('/')} className="bg-brand-green hover:bg-brand-green/90">
          Voltar para a Página Inicial
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-sm">
            {profileData.name.charAt(0)}
          </div>
          <span className="font-bold text-gray-900 truncate max-w-[140px] flex items-center gap-1">
            {profileData.name}
            {profileData.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 relative">
          {/* Close button for mobile */}
          <div className="md:hidden absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold">
              {profileData.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 truncate max-w-[140px] flex items-center gap-1">
                {profileData.name}
                {profileData.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              </h2>
              <p className="text-xs text-gray-500">
                {userProfile?.role === 'resort' ? 'Resort / Hotel' : 'Agente Verificado'}
              </p>
            </div>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Visão Geral
            </button>
            <button
              onClick={() => { setActiveTab('properties'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'properties' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Home className="mr-3 h-5 w-5" />
              Meus {propertyLabel}
            </button>
            <button
              onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'messages' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="mr-3 h-5 w-5" />
              Mensagens
              {messages.filter(m => !m.read).length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {messages.filter(m => !m.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('live-chat'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'live-chat' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Send className="mr-3 h-5 w-5" />
              Chat ao Vivo
              {chatRooms.length > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {chatRooms.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('profile'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User className="mr-3 h-5 w-5" />
              Meu Perfil
            </button>
            <button
              onClick={() => { navigate('/plans'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
            >
              <CreditCard className="mr-3 h-5 w-5" />
              Assinatura e Planos
            </button>
            {userProfile?.planId === 'unlimited' && (
              <button
                onClick={() => { setActiveTab('agency-premium'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'agency-premium' 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'text-amber-600 hover:bg-amber-50'
                }`}
              >
                <ShieldCheck className="mr-3 h-5 w-5" />
                Agência Premium
              </button>
            )}
          </nav>
        </div>
        
        <div className="p-4 mt-auto">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
            try {
              await logout();
              navigate('/');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          }}>
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-64 flex-1 p-4 sm:p-8 overflow-y-auto relative min-h-screen">
        {/* Success Toast */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 duration-300">
            <CheckCircle className="h-5 w-5" />
            <div>
              <h4 className="font-bold text-sm">Sucesso!</h4>
              <p className="text-xs opacity-90">Perfil atualizado com sucesso.</p>
            </div>
          </div>
        )}

        {/* Reply Success Toast */}
        {showReplySuccess && (
          <div className="fixed top-20 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 duration-300">
            <CheckCircle className="h-5 w-5" />
            <div>
              <h4 className="font-bold text-sm">Resposta Enviada!</h4>
              <p className="text-xs opacity-90">Sua mensagem foi enviada com sucesso.</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
              <p className="text-gray-500">Bem-vindo de volta, {profileData.name}.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className={`p-3 rounded-full ${stat.bg} mr-4`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity or Quick Actions could go here */}
            <div className="space-y-8">
              {/* Recent Properties */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">{propertyLabel} Recentes</h2>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('properties')}>Ver Todos</Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {myProperties.slice(0, 2).map(property => (
                    <div key={property.id} className="relative group flex flex-col h-full">
                      <PropertyCard property={property} className="h-auto" />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Link to={`/edit-property/${property.id}`}>
                          <Button size="icon" variant="secondary" className="h-8 w-8 bg-white shadow-sm hover:bg-gray-100">
                            <Edit className="h-4 w-4 text-gray-700" />
                          </Button>
                        </Link>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span className="font-medium">{Math.floor(Math.random() * 500) + 50}</span> views
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium">{Math.floor(Math.random() * 20) + 1}</span> msgs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Older Properties */}
              {myProperties.length > 2 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">{propertyLabel} Antigos</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {myProperties.slice(2).map(property => (
                      <div key={property.id} className="relative group flex flex-col h-full">
                        <PropertyCard property={property} className="h-auto" />
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Link to={`/edit-property/${property.id}`}>
                            <Button size="icon" variant="secondary" className="h-8 w-8 bg-white shadow-sm hover:bg-gray-100">
                              <Edit className="h-4 w-4 text-gray-700" />
                            </Button>
                          </Link>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span className="font-medium">{Math.floor(Math.random() * 1000) + 200}</span> views
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span className="font-medium">{Math.floor(Math.random() * 50) + 5}</span> msgs
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meus {propertyLabel}</h1>
                <p className="text-gray-500">Gerencie seus anúncios publicados.</p>
              </div>
              <Link to="/add-property">
                <Button className="bg-brand-green hover:bg-brand-green-hover">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo {propertyLabelSingular}
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{propertyLabelSingular}</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visualizações</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img className="h-10 w-10 rounded-md object-cover" src={property.images[0]} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{property.title}</div>
                              <div className="text-sm text-gray-500">{property.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{property.currency} {property.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-brand-green ${
                              property.status === 'Vendido' || property.status === 'Arrendado'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                            value={property.status || 'Disponível'}
                            onChange={(e) => handleStatusChange(property.id, e.target.value as any)}
                          >
                            <option value="Disponível">Disponível</option>
                            <option value="Vendido">Vendido</option>
                            <option value="Arrendado">Arrendado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Eye className="h-4 w-4 mr-1 text-gray-400" />
                            {property.views || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Link to={`/edit-property/${property.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                              onClick={() => handleDeleteProperty(property.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
                <p className="text-gray-500">Gerencie as mensagens dos interessados em seus {propertyLabel.toLowerCase()}.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar mensagens..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Chat Rules Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Regras de Comunicação Interna</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>Seja Profissional:</strong> Mantenha um tom respeitoso e cordial com todos os clientes.</li>
                  <li><strong>Segurança:</strong> Não partilhe links de pagamento externos ou solicite transferências antes de formalizar o contrato.</li>
                  <li><strong>Privacidade:</strong> Proteja os seus dados pessoais e os do cliente.</li>
                  <li><strong>Proibido Spam:</strong> Não envie mensagens não solicitadas ou promoções irrelevantes.</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${!message.read ? 'bg-blue-50/50' : ''}`}
                      onClick={() => toggleMessageRead(message.id)}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${!message.read ? 'bg-blue-600' : 'bg-transparent'}`} />
                          <h3 className={`font-medium text-gray-900 ${!message.read ? 'font-bold' : ''}`}>
                            {message.senderName || message.sender}
                          </h3>
                          <Link to={`/properties/${message.propertyId}`} onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full hover:bg-brand-green/20 transition-colors cursor-pointer flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              {message.propertyTitle}
                            </span>
                          </Link>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(message.date).toLocaleDateString()} às {new Date(message.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                      
                      <p className={`text-sm text-gray-600 mb-3 break-words ${!message.read ? 'font-medium text-gray-900' : ''}`}>
                        {message.message}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {message.senderEmail || message.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {message.senderPhone || message.phone}
                        </span>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" className="text-xs h-8 bg-brand-green hover:bg-brand-green-hover text-white" onClick={(e) => openReplyDialog(message, e)}>
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-8" onClick={(e) => {
                          e.stopPropagation();
                          toggleMessageRead(message.id);
                        }}>
                          {message.read ? <CheckCircle className="h-3 w-3 mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                          {message.read ? 'Marcar como Não Lida' : 'Marcar como Lida'}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-8" onClick={(e) => {
                          e.stopPropagation();
                          const phoneNum = message.senderPhone || message.phone;
                          if (phoneNum) {
                            window.open(`https://wa.me/${phoneNum.replace(/[^0-9]/g, '')}`);
                          }
                        }}>
                          WhatsApp
                        </Button>
                        <Link to={`/properties/${message.propertyId}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="text-xs h-8 text-gray-600">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver {propertyLabelSingular}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p>Nenhuma mensagem encontrada.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reply Dialog */}
            <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Responder a {selectedMessage?.senderName || selectedMessage?.sender}</DialogTitle>
                  <DialogDescription>
                    Sua resposta será enviada para o email e ficará registrada no histórico.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleReply} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensagem Original</label>
                    <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600 border border-gray-100">
                      {selectedMessage?.message}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="reply-text" className="text-sm font-medium">Sua Resposta</label>
                    <Textarea 
                      id="reply-text" 
                      placeholder="Escreva sua resposta..." 
                      rows={5} 
                      required 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setReplyDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover text-white">
                      Enviar Resposta
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'live-chat' && (
          <div className="h-[calc(100vh-120px)] flex flex-col sm:flex-row gap-4 animate-in fade-in duration-500">
            {/* Chat Rooms List */}
            <div className={`w-full sm:w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${activeChatRoom ? 'hidden sm:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-900">{showArchivedChats ? 'Conversas Arquivadas' : 'Conversas Ativas'}</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowArchivedChats(!showArchivedChats)}
                  className="text-xs text-brand-green"
                >
                  {showArchivedChats ? 'Ver Ativas' : 'Ver Arquivo'}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredChatRooms.length > 0 ? (
                  filteredChatRooms.map((room) => (
                    <div 
                      key={room.id}
                      onClick={() => setActiveChatRoom(room)}
                      className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${activeChatRoom?.id === room.id ? 'bg-brand-green/5 border-l-4 border-l-brand-green' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-gray-900">{room.userName}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(room.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{room.lastMessage}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {showArchivedChats ? 'Nenhuma conversa arquivada.' : 'Nenhuma conversa ativa no momento.'}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col ${!activeChatRoom ? 'hidden sm:flex items-center justify-center' : 'flex'}`}>
              {activeChatRoom ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setActiveChatRoom(null)}>
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <div>
                        <h3 className="font-bold text-gray-900">{activeChatRoom.userName}</h3>
                        <p className="text-[10px] text-gray-500">ID do Imóvel: {activeChatRoom.propertyId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs flex items-center gap-1"
                        onClick={() => handleToggleArchive(activeChatRoom.id, activeChatRoom.isArchived)}
                      >
                        {activeChatRoom.isArchived ? (
                          <>Desarquivar</>
                        ) : (
                          <>Arquivar</>
                        )}
                      </Button>
                      <Link to={`/properties/${activeChatRoom.propertyId}`}>
                        <Button variant="outline" size="sm" className="text-xs">Ver Imóvel</Button>
                      </Link>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-gray-50/30">
                    {chatMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser?.uid;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                              isMe 
                                ? 'bg-brand-green text-white rounded-tr-sm' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-gray-100 flex gap-2">
                    <Input
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder="Digite sua resposta..."
                      className="flex-1 rounded-full bg-gray-50 border-gray-200"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="rounded-full bg-brand-green hover:bg-brand-green-hover text-white shrink-0"
                      disabled={!newChatMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center text-gray-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Selecione uma conversa para começar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-500">Gerencie suas informações pessoais e de contato.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b border-gray-100">
                  <div className="relative group">
                    <img 
                      src={profileData.avatar} 
                      alt="Profile" 
                      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                    <div 
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">Foto de Perfil</h3>
                    <p className="text-sm text-gray-500 mb-3">JPG, GIF ou PNG. Max 1MB.</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                      {uploadingAvatar ? 'A Carregar...' : 'Alterar Foto'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <Input 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Agência (Opcional)</label>
                    <Input 
                      value={profileData.agencyName} 
                      onChange={(e) => setProfileData({...profileData, agencyName: e.target.value})} 
                      placeholder="Ex: Remax, Century 21, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input 
                      type="email" 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <Input 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <Input 
                      value={profileData.whatsapp} 
                      onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link do Instagram</label>
                    <Input 
                      placeholder="https://instagram.com/seu.perfil"
                      value={profileData.instagram} 
                      onChange={(e) => setProfileData({...profileData, instagram: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link do Facebook</label>
                    <Input 
                      placeholder="https://facebook.com/seu.perfil"
                      value={profileData.facebook} 
                      onChange={(e) => setProfileData({...profileData, facebook: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Sobre Mim</label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('dashboard')}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'agency-premium' && userProfile?.planId === 'unlimited' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuração de Agência Premium</h1>
              <p className="text-gray-500">Como assinante do Plano Unlimited, sua agência tem direito a um espaço de destaque na página inicial.</p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 max-w-4xl">
              <form onSubmit={handlePremiumSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Agência</label>
                    <Input 
                      value={premiumFormData.name} 
                      onChange={(e) => setPremiumFormData({...premiumFormData, name: e.target.value})} 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website (Opcional)</label>
                    <Input 
                      type="url"
                      placeholder="https://sua-agencia.com"
                      value={premiumFormData.websiteUrl} 
                      onChange={(e) => setPremiumFormData({...premiumFormData, websiteUrl: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Facebook (Opcional)</label>
                    <Input 
                      type="url"
                      placeholder="https://facebook.com/sua-agencia"
                      value={premiumFormData.facebookUrl} 
                      onChange={(e) => setPremiumFormData({...premiumFormData, facebookUrl: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram (Opcional)</label>
                    <Input 
                      type="url"
                      placeholder="https://instagram.com/sua-agencia"
                      value={premiumFormData.instagramUrl} 
                      onChange={(e) => setPremiumFormData({...premiumFormData, instagramUrl: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logotipo da Agência</label>
                  <p className="text-xs text-gray-500 mb-4">Recomendamos um logotipo em formato horizontal ou quadrado com fundo transparente ou branco.</p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border rounded-lg bg-gray-50">
                    <div className="w-40 h-24 bg-white border border-dashed rounded-lg flex items-center justify-center overflow-hidden">
                      {premiumFormData.logoUrl ? (
                        <img src={premiumFormData.logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ShieldCheck className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex items-center gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('premium-logo-upload')?.click()}
                          disabled={uploadingPremiumLogo}
                          className="w-full sm:w-auto"
                        >
                          {uploadingPremiumLogo ? 'Subindo...' : 'Selecionar Logotipo'}
                        </Button>
                        <input 
                          id="premium-logo-upload"
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handlePremiumLogoUpload}
                        />
                        {premiumFormData.logoUrl && (
                          <span className="text-xs text-brand-green font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Logotipo pronto
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">Tamanho máximo: 2MB. Formatos: PNG, JPG.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t">
                  <Button 
                    type="submit" 
                    className="bg-brand-green hover:bg-brand-green-hover text-white px-8"
                    disabled={isSavingPremium || uploadingPremiumLogo}
                  >
                    {isSavingPremium ? 'Salvando...' : 'Salvar Configurações Premium'}
                  </Button>
                </div>
              </form>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-4xl">
              <div className="flex gap-4">
                <div className="p-2 bg-amber-100 rounded-lg h-inner">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">O que é a Agência Premium?</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    Como assinante Unlimited, seu logotipo aparecerá na seção "Imobiliárias de Confiança" na página inicial, 
                    com link direto para o seu perfil ou website. Isso garante máxima visibilidade e autoridade para sua marca.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {propertyLabelSingular}</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {isResort ? 'esta' : 'este'} {propertyLabelSingular.toLowerCase()}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropertyToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
