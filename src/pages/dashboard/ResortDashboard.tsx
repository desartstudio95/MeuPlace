import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Hotel,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { playNotificationSound } from '@/utils/sound';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Property } from '@/types';
import { resizeImage } from '@/utils/imageUtils';
import { useNotifications } from '@/context/NotificationContext';

export function ResortDashboard() {
  const { currentUser, userProfile, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { addNotification } = useNotifications();
  
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

  // Resort Profile State
  const [resortData, setResortData] = useState({
    resortName: userProfile?.resortName || '',
    resortDescription: userProfile?.resortDescription || '',
    resortLocation: userProfile?.resortLocation || '',
    resortAmenities: userProfile?.resortAmenities?.join(', ') || '',
    phone: userProfile?.phone || '',
    whatsapp: userProfile?.whatsapp || '',
    avatar: userProfile?.photoURL || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
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
        console.error("Error fetching resort data:", error);
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
            title: 'Nova Reserva',
            message: `Você recebeu ${newUnreadMessages.length} nova(s) solicitação(ões).`,
            type: 'info'
          });
        }
      }
      
      setMessages(fetchedMessages);
    }, (error) => {
      console.error("Error listening to messages:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const amenitiesArray = resortData.resortAmenities.split(',').map(a => a.trim()).filter(Boolean);
      
      // Update user profile
      await updateUserProfile({
        resortName: resortData.resortName,
        resortDescription: resortData.resortDescription,
        resortLocation: resortData.resortLocation,
        resortAmenities: amenitiesArray,
        phone: resortData.phone,
        whatsapp: resortData.whatsapp,
        photoURL: resortData.avatar,
      });
      
      // Also update or create the resort document in the 'resorts' collection
      // so it appears in the public listings
      const resortDocRef = doc(db, 'resorts', currentUser.uid);
      await updateDoc(resortDocRef, {
        name: resortData.resortName,
        description: resortData.resortDescription,
        location: resortData.resortLocation,
        amenities: amenitiesArray,
        image: resortData.avatar,
        contact: {
          phone: resortData.phone,
          email: currentUser.email
        },
        updatedAt: new Date().toISOString()
      }).catch(async (err) => {
        // If it doesn't exist, create it
        if (err.code === 'not-found') {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(resortDocRef, {
            name: resortData.resortName,
            description: resortData.resortDescription,
            location: resortData.resortLocation,
            amenities: amenitiesArray,
            image: resortData.avatar,
            contact: {
              phone: resortData.phone,
              email: currentUser.email
            },
            rating: 5.0, // Default rating for new resorts
            price: 'Sob Consulta',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } else {
          throw err;
        }
      });

      setShowSuccessMessage(true);
      playNotificationSound();
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("Error updating resort profile:", error);
      addNotification({ title: 'Erro', message: 'Erro ao atualizar perfil do resort.', type: 'error' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      addNotification({ title: 'Erro', message: 'Por favor, selecione uma imagem.', type: 'error' });
      return;
    }

    setUploadingAvatar(true);
    
    try {
      const resizedBase64 = await resizeImage(file, 800, 800);
      const storageRef = ref(storage, `users/${currentUser.uid}/avatar_${Date.now()}.jpg`);
      
      await uploadString(storageRef, resizedBase64, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      
      setResortData(prev => ({ ...prev, avatar: downloadURL }));
      await updateUserProfile({ photoURL: downloadURL });
      setUploadingAvatar(false);
      addNotification({ title: 'Sucesso', message: 'Foto do resort atualizada!', type: 'success' });
    } catch (error) {
      console.error("Resize/Upload error:", error);
      setUploadingAvatar(false);
      addNotification({ title: 'Erro', message: 'Erro ao fazer upload da imagem.', type: 'error' });
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta acomodação?")) {
      try {
        await deleteDoc(doc(db, 'properties', id));
        setMyProperties(prev => prev.filter(p => p.id !== id));
        addNotification({ title: 'Sucesso', message: 'Acomodação excluída com sucesso.', type: 'success' });
      } catch (error) {
        console.error("Error deleting property:", error);
        addNotification({ title: 'Erro', message: 'Erro ao excluir acomodação.', type: 'error' });
      }
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'resort-profile', label: 'Meu Resort', icon: Hotel },
    { id: 'accommodations', label: 'Acomodações', icon: Home },
    { id: 'messages', label: 'Reservas', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Menu Button */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Hotel className="h-6 w-6 text-brand-green" />
          <span className="font-bold text-lg text-gray-900">Painel do Resort</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center gap-2 mb-8">
            <Hotel className="h-8 w-8 text-brand-green" />
            <span className="font-bold text-xl text-gray-900">Painel do Resort</span>
          </div>
        </div>

        <div className="px-4 pb-6 mt-6 md:mt-0">
          <div className="flex items-center gap-3 mb-8 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <img 
              src={resortData.avatar} 
              alt="Resort" 
              className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{resortData.resortName || 'Meu Resort'}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-green text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair da conta
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
                  <p className="text-gray-500">Bem-vindo ao painel de controle do seu resort.</p>
                </div>
                <Link to="/add-accommodation">
                  <Button className="bg-brand-green hover:bg-brand-green-hover text-white w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Acomodação
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                      <Home className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Acomodações</p>
                      <p className="text-2xl font-bold text-gray-900">{myProperties.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reservas</p>
                      <p className="text-2xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resort Profile Tab */}
          {activeTab === 'resort-profile' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Perfil do Resort</h1>
                <p className="text-gray-500">Gerencie as informações públicas do seu resort ou hotel.</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Foto Principal</h2>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <img 
                        src={resortData.avatar} 
                        alt="Resort" 
                        className="h-32 w-32 rounded-xl object-cover border-4 border-white shadow-md"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-2 -right-2 p-2 bg-brand-green text-white rounded-full hover:bg-brand-green-hover transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Esta foto será exibida como a imagem principal do seu resort.
                        Recomendamos uma imagem de alta qualidade (mínimo 800x800px).
                      </p>
                      {uploadingAvatar && <p className="text-sm text-brand-green font-medium">Fazendo upload...</p>}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nome do Resort/Hotel</label>
                      <div className="relative">
                        <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                          value={resortData.resortName}
                          onChange={(e) => setResortData({...resortData, resortName: e.target.value})}
                          className="pl-10" 
                          placeholder="Ex: Paradise Resort Maputo"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Localização</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                          value={resortData.resortLocation}
                          onChange={(e) => setResortData({...resortData, resortLocation: e.target.value})}
                          className="pl-10" 
                          placeholder="Ex: Av. Marginal, Maputo"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                          value={resortData.phone}
                          onChange={(e) => setResortData({...resortData, phone: e.target.value})}
                          className="pl-10" 
                          placeholder="+258 84 000 0000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                          value={resortData.whatsapp}
                          onChange={(e) => setResortData({...resortData, whatsapp: e.target.value})}
                          className="pl-10" 
                          placeholder="+258 84 000 0000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Comodidades (separadas por vírgula)</label>
                    <Input 
                      value={resortData.resortAmenities}
                      onChange={(e) => setResortData({...resortData, resortAmenities: e.target.value})}
                      placeholder="Ex: Piscina, Wi-Fi Grátis, Restaurante, Spa, Estacionamento"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Descrição do Resort</label>
                    <Textarea 
                      value={resortData.resortDescription}
                      onChange={(e) => setResortData({...resortData, resortDescription: e.target.value})}
                      className="min-h-[150px]" 
                      placeholder="Descreva as instalações, serviços e diferenciais do seu resort..."
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-gray-200">
                    {showSuccessMessage ? (
                      <div className="flex items-center text-brand-green font-medium">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Perfil atualizado com sucesso!
                      </div>
                    ) : (
                      <div></div>
                    )}
                    <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover text-white">
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Accommodations Tab */}
          {activeTab === 'accommodations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Acomodações</h1>
                  <p className="text-gray-500">Gerencie os quartos e vilas do seu resort.</p>
                </div>
                <Link to="/add-accommodation">
                  <Button className="bg-brand-green hover:bg-brand-green-hover text-white w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Acomodação
                  </Button>
                </Link>
              </div>

              {loadingProperties ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
              ) : myProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProperties.map((property) => (
                    <div key={property.id} className="relative group">
                      <PropertyCard property={property} />
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/edit-property/${property.id}`}>
                          <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm">
                            <Edit className="h-4 w-4 text-gray-700" />
                          </Button>
                        </Link>
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8 shadow-sm"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Home className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma acomodação</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Você ainda não adicionou nenhuma acomodação ao seu resort.
                  </p>
                  <Link to="/add-accommodation">
                    <Button className="bg-brand-green hover:bg-brand-green-hover text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Acomodação
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Reservas e Mensagens</h1>
                  <p className="text-gray-500">Gerencie as solicitações de reserva e mensagens de clientes.</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-200">
                {messages.length > 0 ? (
                  messages.map((message) => (
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
                          {new Date(message.createdAt).toLocaleDateString('pt-BR', { 
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      
                      <p className={`text-sm text-gray-600 mb-3 break-words ${!message.read ? 'font-medium text-gray-900' : ''}`}>
                        {message.message}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {message.senderEmail || message.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {message.senderPhone || message.phone}
                        </span>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
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
          )}
        </div>
      </div>
    </div>
  );
}
