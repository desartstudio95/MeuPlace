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
import { PROPERTIES } from '@/data/mockData';
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
  BadgeCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { playNotificationSound } from '@/utils/sound';

// Mock messages data
const MOCK_MESSAGES = [
  {
    id: 1,
    sender: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '+258 84 123 4567',
    propertyId: '1',
    propertyTitle: 'Apartamento T3 Luxuoso',
    message: 'Olá, estou interessado neste imóvel. Gostaria de agendar uma visita para o próximo sábado.',
    date: '2024-03-10T10:30:00',
    read: false,
  },
  {
    id: 2,
    sender: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+258 82 987 6543',
    propertyId: '2',
    propertyTitle: 'Vivenda V4 com Piscina',
    message: 'Boa tarde. O preço é negociável? Aceitam permuta?',
    date: '2024-03-09T15:45:00',
    read: true,
  },
  {
    id: 3,
    sender: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '+258 86 555 4444',
    propertyId: '1',
    propertyTitle: 'Apartamento T3 Luxuoso',
    message: 'Ainda está disponível?',
    date: '2024-03-08T09:15:00',
    read: true,
  },
];

export function AgentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reply Dialog State
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplySuccess, setShowReplySuccess] = useState(false);

  // Mock data for the dashboard
  const [myProperties, setMyProperties] = useState(PROPERTIES.slice(0, 3)); // Simulate user's properties
  const stats = [
    { label: 'Imóveis Ativos', value: myProperties.length, icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Visualizações Totais', value: '1,234', icon: Eye, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Leads (Mensagens)', value: messages.length, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Taxa de Conversão', value: '2.4%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const [profileData, setProfileData] = useState({
    name: user?.name || 'Agente Imobiliário',
    email: user?.email || 'agente@meuplace.co.mz',
    phone: '+258 84 123 4567',
    whatsapp: '+258 84 123 4567',
    bio: 'Especialista em imóveis de luxo na cidade de Maputo com mais de 5 anos de experiência.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    instagram: '',
    facebook: '',
    isVerified: true
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccessMessage(true);
    playNotificationSound();
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileData(prev => ({ ...prev, avatar: imageUrl }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
      setMyProperties(myProperties.filter(p => p.id !== id));
      // In a real app, we would also call an API to delete the property
    }
  };

  const handleStatusChange = (id: string, newStatus: 'Disponível' | 'Vendido' | 'Arrendado') => {
    setMyProperties(myProperties.map(p => 
      p.id === id ? { ...p, status: newStatus } : p
    ));
    setShowSuccessMessage(true);
    playNotificationSound();
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const toggleMessageRead = (id: number) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, read: !msg.read } : msg
    ));
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
    msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                {profileData.isVerified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" title="Agente Verificado" />}
              </h2>
              <p className="text-xs text-gray-500">Agente Verificado</p>
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
              Meus Imóveis
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
          </nav>
        </div>
        
        <div className="p-4 mt-auto">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
            if (window.confirm('Tem certeza que deseja sair?')) {
              logout();
              navigate('/');
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
                  <h2 className="text-lg font-bold text-gray-900">Imóveis Recentes</h2>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('properties')}>Ver Todos</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <h2 className="text-lg font-bold text-gray-900">Imóveis Antigos</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <h1 className="text-2xl font-bold text-gray-900">Meus Imóveis</h1>
                <p className="text-gray-500">Gerencie seus anúncios publicados.</p>
              </div>
              <Link to="/add-property">
                <Button className="bg-brand-green hover:bg-brand-green-hover">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Imóvel
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imóvel</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                <p className="text-gray-500">Gerencie as mensagens dos interessados em seus imóveis.</p>
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
                            {message.sender}
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
                          <User className="h-3 w-3" /> {message.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {message.phone}
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
                          window.open(`https://wa.me/${message.phone.replace(/[^0-9]/g, '')}`);
                        }}>
                          WhatsApp
                        </Button>
                        <Link to={`/properties/${message.propertyId}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="text-xs h-8 text-gray-600">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Imóvel
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
                  <DialogTitle>Responder a {selectedMessage?.sender}</DialogTitle>
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
                      onClick={triggerFileInput}
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
                    <Button type="button" variant="outline" size="sm" onClick={triggerFileInput}>Alterar Foto</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <Input 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
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

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
