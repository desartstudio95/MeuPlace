import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Share2, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Facebook, 
  Mail, 
  Send, 
  CheckCircle, 
  BadgeCheck, 
  ZoomIn, 
  X, 
  ShieldCheck, 
  ArrowLeft, 
  Shield, 
  AlertTriangle,
  Scale,
  Sparkles,
  Building2,
  Clock,
  Car,
  Check,
  Flag,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Property, PropertyReportReason } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFavorites } from '@/context/FavoriteContext';
import { useCompare } from '@/context/CompareContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { SEO } from '@/components/SEO';
import { formatPropertyPrice, formatTransactionType } from '@/utils/propertyFormatters';
import { leadService } from '@/services/leadService';
import { viewingService } from '@/services/viewingService';
import { reportService } from '@/services/reportService';
import { trackLeadEvent } from '@/services/leadEventService';
import { toast } from 'sonner';

export function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrorIndices, setImageErrorIndices] = useState<Set<number>>(new Set());
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Description truncation state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Contact and phone reveal
  const [showPhone, setShowPhone] = useState(false);

  // Modals state
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isViewingDialogOpen, setIsViewingDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Submitting states
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [isSubmittingViewing, setIsSubmittingViewing] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Forms state
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    contactPreference: 'whatsapp' as 'whatsapp' | 'phone' | 'email',
    honeypot: ''
  });

  const [viewingForm, setViewingForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '10:00 - 12:00',
    alternativeDate: '',
    alternativeTime: '14:00 - 16:00',
    notes: '',
    honeypot: ''
  });

  const [reportForm, setReportForm] = useState({
    reason: 'wrong_price' as PropertyReportReason,
    description: '',
    reporterEmail: '',
    honeypot: ''
  });

  // Favorite & Compare contexts
  const { isFavorite: checkFavorite, toggleFavorite: doToggleFavorite } = useFavorites();
  const { isComparing, addToCompare, removeFromCompare } = useCompare();

  const isFav = property ? checkFavorite(property.id) : false;
  const isComp = property ? isComparing(property.id) : false;

  // Carregamento e Autorização
  useEffect(() => {
    let isMounted = true;

    async function loadProperty() {
      if (!id) {
        setError('Identificador de imóvel não fornecido.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          if (isMounted) {
            setError('Imóvel não encontrado ou removido.');
            setProperty(null);
          }
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() } as Property;

        // Regra de aprovação pública:
        // Apenas imóveis com isApproved === true são visíveis publicamente,
        // a não ser que seja o criador/agente do imóvel ou administrador do sistema.
        const isOwner = currentUser && (data.agentId === currentUser.uid || (data as any).ownerId === currentUser.uid);
        const isAdmin = userProfile?.role === 'admin';

        if (data.isApproved === false && !isOwner && !isAdmin) {
          if (isMounted) {
            setError('Este imóvel está sob moderação e ainda não foi aprovado.');
            setProperty(null);
          }
          return;
        }

        if (isMounted) {
          setProperty(data);
          // Pré-preencher formulário de mensagem
          setLeadForm(prev => ({
            ...prev,
            name: userProfile?.displayName || currentUser?.displayName || prev.name,
            phone: userProfile?.phone || prev.phone,
            email: userProfile?.email || currentUser?.email || prev.email,
            message: `Olá, tenho interesse no imóvel "${data.title}" e gostaria de mais informações.`
          }));

          setViewingForm(prev => ({
            ...prev,
            name: userProfile?.displayName || currentUser?.displayName || prev.name,
            phone: userProfile?.phone || prev.phone,
            email: userProfile?.email || currentUser?.email || prev.email,
          }));

          // Rastreamento Seguro de Visualização Real (com cooldown e deduplicação de sessão)
          trackLeadEvent(data.id, 'property_view');
        }
      } catch (err: any) {
        console.error('[PropertyDetails] Erro ao carregar imóvel:', err);
        if (isMounted) {
          setError('Ocorreu um erro ao carregar os detalhes do imóvel.');
          setProperty(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProperty();

    return () => {
      isMounted = false;
    };
  }, [id, currentUser, userProfile]);

  // Imagens válidas com fallback
  const validImages = useMemo(() => {
    if (!property?.images || property.images.length === 0) {
      return ['/images/placeholder-property.jpg'];
    }
    return property.images;
  }, [property?.images]);

  // Teclado para navegar na galeria
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (validImages.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => (prev - 1 + validImages.length) % validImages.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => (prev + 1) % validImages.length);
      } else if (e.key === 'Escape' && isZoomModalOpen) {
        setIsZoomModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [validImages.length, isZoomModalOpen]);

  // Navegação da galeria
  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const handleImageError = (index: number) => {
    setImageErrorIndices(prev => new Set(prev).add(index));
  };

  // WhatsApp click handler
  const handleWhatsAppClick = () => {
    if (!property) return;
    const rawNumber = property.agent?.whatsapp || property.agent?.phone || '';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');

    trackLeadEvent(property.id, 'whatsapp_click');

    const message = `Olá! Vi o imóvel "${property.title}" (Ref: ${property.id}) no MeuPlace e gostaria de obter mais informações.`;
    const targetPhone = cleanNumber.startsWith('258') ? cleanNumber : (cleanNumber ? `258${cleanNumber}` : '');

    if (targetPhone) {
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Número de WhatsApp do anunciante não disponível.');
    }
  };

  // Phone reveal handler
  const handlePhoneClick = () => {
    if (!property) return;
    if (!showPhone) {
      trackLeadEvent(property.id, 'phone_click');
    }
    setShowPhone(prev => !prev);
  };

  // Envio de Lead (Formulário de Contacto)
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    try {
      setIsSubmittingLead(true);
      const result = await leadService.createLead({
        propertyId: property.id,
        customerName: leadForm.name,
        customerPhone: leadForm.phone,
        customerEmail: leadForm.email || undefined,
        message: leadForm.message,
        contactPreference: leadForm.contactPreference,
        source: 'contact_form',
        honeypot: leadForm.honeypot
      }, property);

      setIsMessageDialogOpen(false);
      toast.success(result.message);

      // Limpa mensagem mantendo dados de contacto
      setLeadForm(prev => ({
        ...prev,
        honeypot: '',
        message: `Olá, tenho interesse no imóvel "${property.title}" e gostaria de mais informações.`
      }));
    } catch (err: any) {
      toast.error(err.message || 'Falha ao enviar mensagem ao anunciante.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Solicitação de Visita
  const handleViewingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    try {
      setIsSubmittingViewing(true);
      const result = await viewingService.requestViewing({
        propertyId: property.id,
        requesterName: viewingForm.name,
        requesterPhone: viewingForm.phone,
        requesterEmail: viewingForm.email || undefined,
        preferredDate: viewingForm.preferredDate,
        preferredTime: viewingForm.preferredTime,
        alternativeDate: viewingForm.alternativeDate || undefined,
        alternativeTime: viewingForm.alternativeTime || undefined,
        notes: viewingForm.notes || undefined,
        honeypot: viewingForm.honeypot
      }, property);

      setIsViewingDialogOpen(false);
      toast.success(result.message);
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível solicitar a visita.');
    } finally {
      setIsSubmittingViewing(false);
    }
  };

  // Envio de Denúncia
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    try {
      setIsSubmittingReport(true);
      const result = await reportService.submitReport({
        propertyId: property.id,
        reason: reportForm.reason,
        description: reportForm.description,
        reporterEmail: reportForm.reporterEmail || undefined,
        honeypot: reportForm.honeypot
      });

      setIsReportDialogOpen(false);
      toast.success(result.message);
      setReportForm({
        reason: 'wrong_price',
        description: '',
        reporterEmail: '',
        honeypot: ''
      });
    } catch (err: any) {
      toast.error(err.message || 'Falha ao registrar denúncia.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Compartilhamento
  const handleShare = async () => {
    if (!property) return;
    const shareUrl = window.location.href;
    const shareTitle = `${property.title} | MeuPlace`;
    const shareText = `Confira este imóvel em ${property.location}: ${formatPropertyPrice(property.price, property.currency, property.type)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Usuário cancelou ou fallback necessário
      }
    }
    setIsShareModalOpen(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar link.');
    }
  };

  // Formatação de características
  const featuresList = useMemo(() => {
    if (!property) return [];
    const list: string[] = [];
    if (Array.isArray(property.features)) {
      list.push(...property.features);
    }
    return Array.from(new Set(list));
  }, [property]);

  // Construção de endereço legível
  const locationString = useMemo(() => {
    if (!property) return '';
    const parts = [
      property.detailedLocation,
      property.location,
    ].filter(Boolean);
    return parts.join(', ') || 'Moçambique';
  }, [property]);

  // JSON-LD Schema para SEO
  const schemaJson = useMemo(() => {
    if (!property) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": property.title,
      "description": property.description?.substring(0, 160),
      "url": `https://www.meuplace.com/property/${property.id}`,
      "datePosted": property.createdAt?.toDate ? property.createdAt.toDate().toISOString() : undefined,
      "offers": {
        "@type": "Offer",
        "price": property.price,
        "priceCurrency": property.currency || "MZN",
        "availability": "https://schema.org/InStock"
      }
    };
  }, [property]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !property) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-200">
          <ShieldCheck className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Imóvel Indisponível</h1>
        <p className="text-gray-600 max-w-md mb-6">{error || 'Imóvel não encontrado.'}</p>
        <Button 
          onClick={() => navigate('/properties')} 
          className="bg-brand-green hover:bg-brand-green/90 text-white font-medium"
        >
          Explorar Outros Imóveis
        </Button>
      </div>
    );
  }

  const transactionLabel = formatTransactionType(property.type);
  const formattedPrice = formatPropertyPrice(property.price, property.currency, property.type);
  const isVerifiedProperty = property.verificationStatus === 'approved';

  return (
    <div className="min-h-screen bg-gray-50 pb-28 sm:pb-16">
      {/* SEO Dinâmico e Estruturado */}
      <SEO 
        title={property.title}
        description={property.description ? property.description.substring(0, 155) : 'Confira os detalhes deste imóvel no MeuPlace.'}
        image={validImages[0]}
        url={`/property/${property.id}`}
        type="article"
        schema={schemaJson}
      />

      {/* Navegação Topo */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link 
            to="/properties" 
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-brand-green transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar para a pesquisa
          </Link>

          <div className="flex items-center gap-2">
            {/* Comparar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isComp) {
                  removeFromCompare(property.id);
                } else {
                  addToCompare(property);
                }
              }}
              className={`h-9 text-xs font-medium ${isComp ? 'bg-amber-50 text-amber-700 border-amber-300' : 'text-gray-700'}`}
              title={isComp ? 'Remover da comparação' : 'Adicionar para comparar'}
            >
              <Scale className="w-3.5 h-3.5 mr-1.5" />
              {isComp ? 'Comparando' : 'Comparar'}
            </Button>

            {/* Favorito */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => doToggleFavorite(property.id)}
              className={`h-9 text-xs font-medium ${isFav ? 'bg-red-50 text-red-600 border-red-200' : 'text-gray-700'}`}
              title={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <Heart className={`w-3.5 h-3.5 mr-1.5 ${isFav ? 'fill-current text-red-500' : ''}`} />
              {isFav ? 'Salvo' : 'Salvar'}
            </Button>

            {/* Compartilhar */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 text-xs font-medium text-gray-700"
              title="Compartilhar imóvel"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Partilhar
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* GALERIA DE IMAGENS PROFISSIONAL (FASE 1) */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8" aria-label="Galeria de Fotos">
          <div className="relative aspect-[16/10] sm:aspect-[21/9] max-h-[560px] w-full bg-gray-900 group">
            {/* Imagem Principal com Fallback */}
            <img 
              src={imageErrorIndices.has(currentImageIndex) ? '/images/placeholder-property.jpg' : validImages[currentImageIndex]} 
              alt={`Foto ${currentImageIndex + 1} de ${validImages.length} do imóvel ${property.title}`}
              loading="eager"
              onError={() => handleImageError(currentImageIndex)}
              className="w-full h-full object-cover select-none cursor-pointer transition-opacity duration-300"
              onClick={() => setIsZoomModalOpen(true)}
            />

            {/* Overlay gradiente inferior para leitura de badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Badges de Destaque no Topo da Imagem */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none z-10">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm text-white ${
                transactionLabel === 'Venda' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}>
                {transactionLabel}
              </span>
              {property.category && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-900/80 text-white backdrop-blur-md">
                  {property.category}
                </span>
              )}
              {isVerifiedProperty && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-700/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Imóvel Verificado
                </span>
              )}
            </div>

            {/* Contador de Fotos */}
            <div className="absolute top-4 right-4 bg-black/65 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md z-10">
              {currentImageIndex + 1} / {validImages.length} fotos
            </div>

            {/* Botão de Zoom */}
            <button
              onClick={() => setIsZoomModalOpen(true)}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg focus:outline-none"
              title="Abrir em ecrã inteiro"
              aria-label="Ampliar galeria"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Setas de Navegação */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 hover:opacity-100 focus:outline-none"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 hover:opacity-100 focus:outline-none"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Tira de Miniaturas (Thumbnail Strip) */}
          {validImages.length > 1 && (
            <div className="p-3 bg-gray-100/70 border-t border-gray-200 overflow-x-auto flex gap-2 scrollbar-none">
              {validImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border-2 transition-all focus:outline-none ${
                    idx === currentImageIndex 
                      ? 'border-brand-green ring-2 ring-brand-green/20 scale-105' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`Ver foto ${idx + 1}`}
                >
                  <img 
                    src={imageErrorIndices.has(idx) ? '/images/placeholder-property.jpg' : img} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={() => handleImageError(idx)}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* CORPO PRINCIPAL: 2 COLUNAS (CONTEÚDO + SIDEBAR DE CONTACTO) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* COLUNA ESQUERDA (DETALHES DO IMÓVEL) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Bloco 1: Título, Localização e Preço */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 mr-1.5 text-brand-green flex-shrink-0" />
                    <span>{locationString}</span>
                  </div>
                </div>

                {/* Preço em destaque */}
                <div className="sm:text-right bg-emerald-50/70 sm:bg-transparent p-4 sm:p-0 rounded-xl border border-emerald-100 sm:border-0">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">
                    Valor de {transactionLabel}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-brand-green">
                    {formattedPrice}
                  </div>
                  {property.condominiumFee ? (
                    <span className="text-xs text-gray-500 block mt-1">
                      Condomínio: {property.currency || 'MZN'} {property.condominiumFee.toLocaleString('pt-MZ')}/mês
                    </span>
                  ) : null}
                </div>
              </div>

              {/* FASE 2: Selo de Verificação Documental */}
              {isVerifiedProperty && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-900">
                      Imóvel com Verificação Aprovada
                    </h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      A documentação deste imóvel e a autorização de divulgação foram submetidas e validadas pela moderação do MeuPlace.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid de Atributos Físicos (Quartos, Banheiros, Área, Vagas) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {property.bedrooms !== undefined && property.bedrooms !== null && (
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100/60 flex items-center justify-center text-emerald-800">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Quartos</span>
                      <span className="text-base font-bold text-gray-900">{property.bedrooms}</span>
                    </div>
                  </div>
                )}

                {property.bathrooms !== undefined && property.bathrooms !== null && (
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100/60 flex items-center justify-center text-blue-800">
                      <Bath className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Banheiros</span>
                      <span className="text-base font-bold text-gray-900">{property.bathrooms}</span>
                    </div>
                  </div>
                )}

                {property.area !== undefined && property.area !== null && property.area > 0 && (
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100/60 flex items-center justify-center text-amber-800">
                      <Maximize className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Área Útil</span>
                      <span className="text-base font-bold text-gray-900">{property.area} m²</span>
                    </div>
                  </div>
                )}

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100/60 flex items-center justify-center text-purple-800">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Tipo</span>
                    <span className="text-base font-bold text-gray-900">{property.category || 'Residencial'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Descrição com expansão inteligente ("Ver mais") */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Sobre este imóvel</h2>
              
              <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-line relative">
                {property.description ? (
                  <>
                    <p>
                      {isDescriptionExpanded || property.description.length <= 350
                        ? property.description
                        : `${property.description.substring(0, 350)}...`}
                    </p>

                    {property.description.length > 350 && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="mt-3 inline-flex items-center text-sm font-semibold text-brand-green hover:underline focus:outline-none"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            Ver menos <ChevronUp className="w-4 h-4 ml-1" />
                          </>
                        ) : (
                          <>
                            Ver descrição completa <ChevronDown className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="italic text-gray-400">Nenhuma descrição detalhada informada pelo anunciante.</p>
                )}
              </div>
            </div>

            {/* Bloco 3: Características e Comodidades (Features) */}
            {featuresList.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Comodidades e Características</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {featuresList.map((feat, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bloco 4: Mapa e Localização (FASE 3) */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Localização</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {locationString}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationString)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-brand-green hover:underline"
                >
                  Abrir no Google Maps <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>

              {/* Caixa representativa de mapa aproximado */}
              <div className="relative aspect-[16/7] w-full bg-slate-100 rounded-xl overflow-hidden border border-gray-200 flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg mb-2 animate-bounce">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-800">{property.location}</p>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Por motivos de segurança e privacidade do proprietário, o endereço residencial exato é compartilhado após o primeiro contacto.
                </p>
              </div>
            </div>

            {/* Bloco 5: Ação de Denúncia (FASE 14) */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsReportDialogOpen(true)}
                className="inline-flex items-center text-xs text-gray-500 hover:text-red-600 transition-colors py-1 px-2 rounded-md hover:bg-red-50 focus:outline-none"
              >
                <Flag className="w-3.5 h-3.5 mr-1.5" />
                Denunciar anúncio incorreto ou fraudulento
              </button>
            </div>
          </div>

          {/* COLUNA DIREITA: ANUNCIANTE E CAPTURA DE LEADS (FASE 5, 6, 12) */}
          <div className="space-y-6 lg:sticky lg:top-6">
            
            {/* Cartão de Contacto e Anunciante */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-4">
                Publicado por
              </span>

              {/* Perfil do Anunciante */}
              <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
                <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-lg font-bold text-gray-700">
                  {property.agent?.avatar ? (
                    <img 
                      src={property.agent.avatar} 
                      alt={property.agent.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    (property.agent?.name || 'A').charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 truncate">
                      {property.agent?.name || 'Corretor MeuPlace'}
                    </h3>
                    {property.agent?.isVerified && (
                      <span title="Corretor Verificado">
                        <BadgeCheck className="w-4 h-4 text-brand-green flex-shrink-0" />
                      </span>
                    )}
                  </div>

                  {property.agent?.agency ? (
                    <p className="text-xs text-gray-500 truncate">
                      {property.agent.agency}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Anunciante credenciado
                    </p>
                  )}
                </div>
              </div>

              {/* Botões Principais de Conversão */}
              <div className="pt-5 space-y-3">
                {/* 1. WhatsApp */}
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.99]"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  Conversar no WhatsApp
                </Button>

                {/* 2. Ligar Agora / Ver Telefone */}
                <Button
                  variant="outline"
                  onClick={handlePhoneClick}
                  className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Phone className="w-4 h-4 text-brand-green" />
                  {showPhone ? (
                    <a 
                      href={`tel:${property.agent?.phone || property.agent?.whatsapp}`} 
                      className="text-brand-green hover:underline font-bold"
                    >
                      {property.agent?.phone || property.agent?.whatsapp || 'Sem número'}
                    </a>
                  ) : (
                    'Ver Telefone / Ligar'
                  )}
                </Button>

                {/* 3. Formulário de Mensagem */}
                <Button
                  variant="secondary"
                  onClick={() => setIsMessageDialogOpen(true)}
                  className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-xl flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-gray-600" />
                  Enviar Mensagem por Formulário
                </Button>

                {/* 4. Agendar Visita (FASE 12) */}
                <Button
                  variant="ghost"
                  onClick={() => setIsViewingDialogOpen(true)}
                  className="w-full h-11 text-brand-green hover:bg-emerald-50 hover:text-emerald-800 font-semibold rounded-xl flex items-center justify-center gap-2 border border-dashed border-emerald-300"
                >
                  <Calendar className="w-4 h-4" />
                  Solicitar Agendamento de Visita
                </Button>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                <span className="inline-flex items-center text-[11px] text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Seus dados são protegidos e enviados apenas ao anunciante oficial.
                </span>
              </div>
            </div>

            {/* Dicas de Segurança para o Utilizador */}
            <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Shield className="w-4 h-4 text-amber-700" />
                Dica de Segurança MeuPlace
              </div>
              <p className="text-amber-800/90 leading-normal">
                Nunca realize pagamentos de sinal ou transferências antes de visitar o imóvel pessoalmente e verificar os documentos com o anunciante.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* BARRA STICKY INFERIOR PARA MOBILE (FASE 17) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-3 py-2.5 shadow-2xl flex items-center gap-2">
        <Button
          onClick={handleWhatsAppClick}
          className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          onClick={handlePhoneClick}
          className="flex-1 h-11 border-gray-300 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
        >
          <Phone className="w-4 h-4 text-brand-green" />
          {showPhone ? (property.agent?.phone || 'Ligar') : 'Telefone'}
        </Button>

        <Button
          onClick={() => setIsMessageDialogOpen(true)}
          className="h-11 px-4 bg-brand-green hover:bg-brand-green/90 text-white font-bold rounded-xl text-xs flex items-center justify-center"
        >
          Mensagem
        </Button>
      </div>

      {/* MODAL 1: FORMULÁRIO DE CAPTURA DE LEAD (FASE 6, 7, 10, 11) */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contactar Anunciante</DialogTitle>
            <DialogDescription>
              Envie uma mensagem direta sobre o imóvel &quot;{property.title}&quot;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLeadSubmit} className="space-y-4 pt-2">
            {/* Anti-Bot Honeypot Field */}
            <input
              type="text"
              name="hp_website_contact"
              value={leadForm.honeypot}
              onChange={(e) => setLeadForm({ ...leadForm, honeypot: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              style={{ display: 'none' }}
            />
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                O seu Nome Completo *
              </label>
              <Input
                required
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                placeholder="Ex: Carlos Mondlane"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Contacto Telefónico *
                </label>
                <Input
                  required
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="+258 84 123 4567"
                  maxLength={25}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Email (Opcional)
                </label>
                <Input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="carlos@exemplo.co.mz"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Preferência de Contacto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'whatsapp', label: 'WhatsApp' },
                  { id: 'phone', label: 'Ligação' },
                  { id: 'email', label: 'Email' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLeadForm({ ...leadForm, contactPreference: opt.id as any })}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                      leadForm.contactPreference === opt.id
                        ? 'border-brand-green bg-emerald-50 text-emerald-800 font-semibold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Mensagem *
              </label>
              <Textarea
                required
                rows={4}
                value={leadForm.message}
                onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                maxLength={2000}
                placeholder="Olá, tenho interesse neste imóvel..."
              />
              <span className="text-[11px] text-gray-400 block text-right mt-1">
                {leadForm.message.length} / 2000 caracteres
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMessageDialogOpen(false)}
                disabled={isSubmittingLead}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingLead}
                className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold"
              >
                {isSubmittingLead ? 'A enviar...' : 'Enviar Contacto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: AGENDAMENTO DE VISITA (FASE 12) */}
      <Dialog open={isViewingDialogOpen} onOpenChange={setIsViewingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Agendamento de Visita</DialogTitle>
            <DialogDescription>
              Escolha as melhores datas para conhecer pessoalmente o imóvel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleViewingSubmit} className="space-y-4 pt-2">
            {/* Anti-Bot Honeypot Field */}
            <input
              type="text"
              name="hp_website_viewing"
              value={viewingForm.honeypot}
              onChange={(e) => setViewingForm({ ...viewingForm, honeypot: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              style={{ display: 'none' }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Seu Nome *
                </label>
                <Input
                  required
                  value={viewingForm.name}
                  onChange={(e) => setViewingForm({ ...viewingForm, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Telefone para confirmação *
                </label>
                <Input
                  required
                  type="tel"
                  value={viewingForm.phone}
                  onChange={(e) => setViewingForm({ ...viewingForm, phone: e.target.value })}
                  placeholder="+258 84..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Data Pretendida *
                </label>
                <Input
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={viewingForm.preferredDate}
                  onChange={(e) => setViewingForm({ ...viewingForm, preferredDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Horário Preferido *
                </label>
                <select
                  required
                  value={viewingForm.preferredTime}
                  onChange={(e) => setViewingForm({ ...viewingForm, preferredTime: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                >
                  <option value="09:00 - 11:00">Manhã (09:00 - 11:00)</option>
                  <option value="11:00 - 13:00">Meio-dia (11:00 - 13:00)</option>
                  <option value="14:00 - 16:00">Tarde (14:00 - 16:00)</option>
                  <option value="16:00 - 18:00">Fim de tarde (16:00 - 18:00)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Observações ou Restrições (Opcional)
              </label>
              <Textarea
                rows={3}
                value={viewingForm.notes}
                onChange={(e) => setViewingForm({ ...viewingForm, notes: e.target.value })}
                placeholder="Ex: Gostaria de saber se o condomínio aceita animais de estimação durante a visita."
                maxLength={1000}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsViewingDialogOpen(false)}
                disabled={isSubmittingViewing}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingViewing}
                className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold"
              >
                {isSubmittingViewing ? 'A agendar...' : 'Solicitar Visita'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: DENÚNCIA DE IMÓVEL (FASE 14) */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5" />
              Denunciar Anúncio
            </DialogTitle>
            <DialogDescription>
              Ajude-nos a manter o MeuPlace confiável e livre de fraudes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportSubmit} className="space-y-4 pt-2">
            {/* Anti-Bot Honeypot Field */}
            <input
              type="text"
              name="hp_website_report"
              value={reportForm.honeypot}
              onChange={(e) => setReportForm({ ...reportForm, honeypot: e.target.value })}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
              style={{ display: 'none' }}
            />
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Motivo da Denúncia *
              </label>
              <select
                value={reportForm.reason}
                onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value as any })}
                className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="wrong_price">Preço incorreto ou enganoso</option>
                <option value="inexistent">Imóvel já vendido ou inexistente</option>
                <option value="fraud">Suspeita de fraude ou golpe</option>
                <option value="wrong_location">Localização errada</option>
                <option value="duplicate">Anúncio duplicado</option>
                <option value="inappropriate">Conteúdo ou fotos inadequadas</option>
                <option value="other">Outro motivo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Detalhes da Ocorrência *
              </label>
              <Textarea
                required
                rows={4}
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                placeholder="Por favor explique com detalhes o motivo pelo qual este anúncio deve ser revisado pela moderação."
                maxLength={2000}
              />
              <span className="text-[11px] text-gray-400 block text-right mt-1">
                Mínimo 10 caracteres
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Seu Email para retorno (Opcional)
              </label>
              <Input
                type="email"
                value={reportForm.reporterEmail}
                onChange={(e) => setReportForm({ ...reportForm, reporterEmail: e.target.value })}
                placeholder="seu.email@exemplo.com"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReportDialogOpen(false)}
                disabled={isSubmittingReport}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingReport}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {isSubmittingReport ? 'A enviar...' : 'Enviar Denúncia'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: COMPARTILHAMENTO */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partilhar Imóvel</DialogTitle>
            <DialogDescription>
              Partilhe este imóvel com a sua família, amigos ou contactos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={window.location.href} 
                className="bg-gray-50 text-xs font-mono select-all" 
              />
              <Button 
                onClick={copyToClipboard} 
                className="bg-brand-green hover:bg-brand-green/90 text-white flex-shrink-0"
              >
                <Copy className="w-4 h-4 mr-1.5" />
                {isCopied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${property.title} - ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(`Confira este imóvel no MeuPlace: ${window.location.href}`)}`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 text-gray-800 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: ZOOM / LIGHTBOX FULLSCREEN */}
      {isZoomModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-sm"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div className="flex items-center justify-between text-white py-2 px-4">
            <span className="text-sm font-medium">
              Foto {currentImageIndex + 1} de {validImages.length}
            </span>
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
              aria-label="Fechar ecrã inteiro"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div 
            className="relative flex-1 flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={imageErrorIndices.has(currentImageIndex) ? '/images/placeholder-property.jpg' : validImages[currentImageIndex]} 
              alt={property.title} 
              className="max-h-[80vh] max-w-[95vw] object-contain rounded-lg shadow-2xl"
              onError={() => handleImageError(currentImageIndex)}
            />

            {validImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>

          <div 
            className="flex justify-center gap-2 overflow-x-auto py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {validImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-14 h-10 rounded overflow-hidden border-2 transition-all flex-shrink-0 ${
                  idx === currentImageIndex ? 'border-brand-green scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img 
                  src={imageErrorIndices.has(idx) ? '/images/placeholder-property.jpg' : img} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default PropertyDetails;
