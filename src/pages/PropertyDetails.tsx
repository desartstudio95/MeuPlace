import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Phone, MessageCircle, Calendar, Share2, Heart, ChevronLeft, ChevronRight, Copy, Facebook, Mail, TrendingUp, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';
import { PROPERTIES } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { Chat } from '@/components/Chat';
import { PropertyMap } from '@/components/PropertyMap';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { playNotificationSound } from '@/utils/sound';

export function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const property = PROPERTIES.find(p => p.id === id) || PROPERTIES[0]; // Fallback to first for demo
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const [showPhone, setShowPhone] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Message Dialog State
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Check if property is already favorited (mock implementation)
    // In a real app, this would check against user preferences or local storage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (property && favorites.includes(property.id)) {
      setIsFavorite(true);
    }
  }, [property]);

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    feedback: ''
  });
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate sending feedback to admin panel
    const newFeedback = {
      agentId: property.agent.name, // Using name as ID for mock
      propertyId: property.id,
      ...feedbackForm,
      date: new Date().toISOString(),
      status: 'pending_review' // Admin needs to review to award stars
    };

    // Store in localStorage to simulate backend persistence
    const existingFeedbacks = JSON.parse(localStorage.getItem('admin_agent_feedbacks') || '[]');
    localStorage.setItem('admin_agent_feedbacks', JSON.stringify([...existingFeedbacks, newFeedback]));

    console.log('Feedback sent to admin:', newFeedback);

    setIsFeedbackDialogOpen(false);
    setShowFeedbackSuccess(true);
    playNotificationSound();
    setFeedbackForm({ name: '', email: '', feedback: '' });
    setTimeout(() => setShowFeedbackSuccess(false), 3000);
  };

  const toggleFavorite = () => {
    if (!property) return;

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;

    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== property.id);
    } else {
      newFavorites = [...favorites, property.id];
    }

    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  useEffect(() => {
    setImageLoading(true);
  }, [currentImageIndex]);

  useEffect(() => {
    if (property) {
      setMessageForm(prev => ({
        ...prev,
        message: `Olá, estou interessado no imóvel: ${property.title}`
      }));
    }
  }, [property]);

  // Keyboard navigation for image carousel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [property.images.length]);

  if (!property) {
    return <div className="text-center py-20">Imóvel não encontrado.</div>;
  }

  const handleWhatsApp = () => {
    const message = `Olá, estou interessado no imóvel: ${property.title}`;
    window.open(`https://wa.me/${property.agent.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePhoneClick = () => {
    setShowPhone(!showPhone);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending message
    setIsMessageDialogOpen(false);
    setShowSuccessMessage(true);
    playNotificationSound();
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Encontrei este imóvel incrível: ${property.title} em ${property.location}. Preço: ${property.currency} ${property.price.toLocaleString()}. Confira!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareUrl = window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const shareText = `Encontrei este imóvel incrível: ${property.title} em ${property.location}. Preço: ${property.currency} ${property.price.toLocaleString()}. Confira!`;
  const encodedTitle = encodeURIComponent(shareText);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Success Toast */}
      {showSuccessMessage && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 duration-300">
          <CheckCircle className="h-5 w-5" />
          <div>
            <h4 className="font-bold text-sm">Mensagem Enviada!</h4>
            <p className="text-xs opacity-90">Sua mensagem foi enviada para {property.agent.name}.</p>
          </div>
        </div>
      )}

      {/* Feedback Success Toast */}
      {showFeedbackSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-5 duration-300">
          <CheckCircle className="h-5 w-5" />
          <div>
            <h4 className="font-bold text-sm">Feedback Enviado!</h4>
            <p className="text-xs opacity-90">Sua avaliação será analisada pela nossa equipe.</p>
          </div>
        </div>
      )}

      {/* Breadcrumbs could go here */}
      <div className="mb-6">
        <Button variant="ghost" className="text-gray-500 hover:text-gray-900 pl-0" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5 mr-1" />
          Voltar
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Carousel */}
          <div className="relative h-96 rounded-2xl overflow-hidden shadow-lg group bg-gray-100">
            {imageLoading && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img 
              src={property.images[currentImageIndex]} 
              alt={`${property.title} - Imagem ${currentImageIndex + 1}`} 
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImageLoading(false)}
            />
            
            {/* Navigation Arrows */}
            {property.images.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {property.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="secondary" className="rounded-full bg-white/80 hover:bg-white">
                    <Share2 className="h-5 w-5 text-gray-700" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Compartilhar Imóvel</DialogTitle>
                    <DialogDescription>
                      Compartilhe este imóvel com seus amigos e familiares.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center space-x-2 py-4">
                    <div className="grid flex-1 gap-2">
                      <Input
                        id="link"
                        defaultValue={shareUrl}
                        readOnly
                        className="w-full truncate pr-2"
                      />
                    </div>
                    <Button 
                      type="button" 
                      size="sm" 
                      className={`px-3 shrink-0 transition-all duration-300 ${isCopied ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' : ''}`} 
                      onClick={copyToClipboard}
                      variant={isCopied ? "outline" : "default"}
                    >
                      <span className="sr-only">Copiar</span>
                      {isCopied ? (
                        <span className="flex items-center gap-1 font-medium">
                          <CheckCircle className="h-4 w-4" /> Copiado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="h-4 w-4" /> Copiar
                        </span>
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                    <Button variant="outline" className="flex-1 gap-2 w-full" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')}>
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 w-full" onClick={() => window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank')}>
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 w-full" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(`Imóvel: ${property.title}`)}&body=${encodedTitle}%0A%0A${encodedUrl}`, '_blank')}>
                      <Mail className="h-4 w-4 text-gray-600" />
                      Email
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                size="icon" 
                variant="secondary" 
                className={`rounded-full bg-white/80 hover:bg-white ${isFavorite ? 'text-red-500' : 'text-gray-700'}`}
                onClick={toggleFavorite}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
            <div className="absolute bottom-4 left-4">
              <span className="px-3 py-1 bg-brand-green text-white text-sm font-bold uppercase tracking-wider rounded-full shadow-sm">
                {property.type}
              </span>
            </div>
          </div>

          {/* Title and Price */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                {(property.status === 'Vendido' || property.status === 'Arrendado') && (
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap">
                    {property.status}
                  </span>
                )}
              </div>
              <div className="flex items-center text-gray-500 mt-2">
                <MapPin className="h-5 w-5 mr-1 text-brand-green" />
                <span>{property.location}</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-3xl font-bold text-brand-green">
                {property.currency} {property.price.toLocaleString()}
                {property.type === 'Arrendamento' && <span className="text-lg text-gray-500 font-normal">/mês</span>}
              </p>
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-6">
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <Bed className="h-6 w-6 text-brand-purple mb-2" />
              <span className="font-bold text-lg">{property.bedrooms}</span>
              <span className="text-xs text-gray-500 uppercase">Quartos</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <Bath className="h-6 w-6 text-brand-purple mb-2" />
              <span className="font-bold text-lg">{property.bathrooms}</span>
              <span className="text-xs text-gray-500 uppercase">Banheiros</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <Maximize className="h-6 w-6 text-brand-purple mb-2" />
              <span className="font-bold text-lg">{property.area}</span>
              <span className="text-xs text-gray-500 uppercase">m²</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Descrição</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Comodidades</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-600">
                  <div className="h-2 w-2 bg-brand-green rounded-full mr-2" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Location Map */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Localização</h2>
            <PropertyMap properties={[property]} height="400px" zoom={14} />
          </div>
        </div>

        {/* Sidebar / Agent Contact */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
            <div className="flex items-center gap-4 mb-6">
              <Link to={`/agent/${encodeURIComponent(property.agent.name)}`} className="shrink-0 group">
                <img 
                  src={property.agent.avatar || `https://ui-avatars.com/api/?name=${property.agent.name}`} 
                  alt={property.agent.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-brand-green/20 group-hover:border-brand-green transition-colors"
                />
              </Link>
              <div>
                <p className="text-sm text-gray-500">Agente Responsável</p>
                <Link to={`/agent/${encodeURIComponent(property.agent.name)}`} className="hover:text-brand-green transition-colors">
                  <h3 className="text-lg font-bold text-gray-900">{property.agent.name}</h3>
                </Link>
                <div className="flex items-center text-yellow-500 text-sm">
                  ★★★★★ <span className="text-gray-400 ml-1">(4.9)</span>
                </div>
                <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="text-xs text-brand-green hover:underline mt-1 font-medium">
                      Avaliar Agente
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Avaliar {property.agent.name}</DialogTitle>
                      <DialogDescription>
                        Compartilhe sua experiência com este agente. Seu feedback será enviado para análise da nossa equipe administrativa.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendFeedback} className="space-y-4 py-2">
                      <div className="space-y-2">
                        <label htmlFor="feedback-name" className="text-sm font-medium">Seu Nome</label>
                        <Input 
                          id="feedback-name" 
                          placeholder="Seu nome completo" 
                          required 
                          value={feedbackForm.name}
                          onChange={(e) => setFeedbackForm({...feedbackForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="feedback-email" className="text-sm font-medium">Seu Email</label>
                        <Input 
                          id="feedback-email" 
                          type="email"
                          placeholder="seu@email.com" 
                          required 
                          value={feedbackForm.email}
                          onChange={(e) => setFeedbackForm({...feedbackForm, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="feedback-text" className="text-sm font-medium">Sua Avaliação</label>
                        <Textarea 
                          id="feedback-text" 
                          placeholder="Conte-nos como foi sua experiência..." 
                          rows={4} 
                          required 
                          value={feedbackForm.feedback}
                          onChange={(e) => setFeedbackForm({...feedbackForm, feedback: e.target.value})}
                        />
                        <p className="text-xs text-gray-500">
                          Nota: As estrelas são atribuídas apenas pelos administradores com base nas avaliações recebidas.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white">
                          Enviar Avaliação
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full bg-brand-green hover:bg-brand-green-hover h-12 text-lg" onClick={handleWhatsApp}>
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg" 
                onClick={() => setIsChatOpen(true)}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat ao Vivo
              </Button>
              
              <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-12 text-lg border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Send className="h-5 w-5 mr-2" />
                    Enviar Mensagem
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Contatar Agente</DialogTitle>
                    <DialogDescription>
                      Envie uma mensagem direta para {property.agent.name} sobre este imóvel.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSendMessage} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Nome</label>
                      <Input 
                        id="name" 
                        placeholder="Seu nome" 
                        required 
                        value={messageForm.name}
                        onChange={(e) => setMessageForm({...messageForm, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="seu@email.com" 
                          required 
                          value={messageForm.email}
                          onChange={(e) => setMessageForm({...messageForm, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">Telefone</label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="+258..." 
                          required 
                          value={messageForm.phone}
                          onChange={(e) => setMessageForm({...messageForm, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">Mensagem</label>
                      <Textarea 
                        id="message" 
                        placeholder="Escreva sua mensagem..." 
                        rows={4} 
                        required 
                        value={messageForm.message}
                        onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white">
                        Enviar Mensagem
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-900" onClick={handlePhoneClick}>
                <Phone className="h-4 w-4 mr-2" />
                {showPhone ? property.agent.whatsapp : "Ver Telefone"}
              </Button>
            </div>

            {isAuthenticated && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to="/add-property?step=4">
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white h-12 text-lg">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Promover Imóvel
                  </Button>
                </Link>
                <p className="text-xs text-gray-400 text-center mt-2">Visível apenas para o proprietário</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 mb-2">Publicado em</p>
              <div className="flex items-center justify-center text-gray-500 text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(property.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Real-time Chat Component */}
      {isChatOpen && (
        <Chat 
          propertyId={property.id} 
          agentName={property.agent.name} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}
    </div>
  );
}
