import React, { useState, useRef } from 'react';
import { Property } from '@/types';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  BadgeCheck,
  Check,
  ArrowUpRight,
  Car
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompare } from '@/context/CompareContext';
import { useFavorites } from '@/context/FavoriteContext';
import { formatPropertyPrice, isRecentProperty, formatTransactionType } from '@/utils/propertyFormatters';
import { trackPropertyEvent } from '@/services/propertyEventService';
import { calculatePropertyFreshness } from '@/utils/propertyFreshness';

export interface PropertyCardProps {
  property: Property;
  className?: string;
  isHighlighted?: boolean;
}

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="%23f3f4f6"><rect width="600" height="400" fill="%23f3f4f6"/><path d="M220 220l40-50 50 60 70-90 80 100H140z" fill="%23d1d5db"/><circle cx="230" cy="140" r="30" fill="%23e5e7eb"/><text x="50%25" y="75%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16" font-weight="500">Imagem indisponível</text></svg>';

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  className = '',
  isHighlighted = false
}) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Swipe / Drag touch and mouse handlers for carousel
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const dragStartX = useRef<number | null>(null);
  const hasDragged = useRef<boolean>(false);

  // Contextos centralizados (Sem N+1 reads)
  const { addToCompare, removeFromCompare, isComparing } = useCompare();
  const { isFavorite, toggleFavorite } = useFavorites();

  const comparing = isComparing(property.id);
  const isFav = isFavorite(property.id);

  const images = Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : [];

  const currentImageSrc = imageError || images.length === 0
    ? FALLBACK_IMAGE
    : images[currentImageIndex] || FALLBACK_IMAGE;

  const nextImage = (e?: React.MouseEvent | Event) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images.length > 1) {
      setImageLoaded(false);
      setImageError(false);
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e?: React.MouseEvent | Event) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (images.length > 1) {
      setImageLoaded(false);
      setImageError(false);
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1 || touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current !== null ? touchStartY.current - e.changedTouches[0].clientY : 0;
    
    // Check if horizontal swipe was dominant and exceeds threshold (35px)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Mouse drag handlers for desktop swipe/drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (images.length <= 1) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
    hasDragged.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || dragStartX.current === null) return;
    const diffX = dragStartX.current - e.clientX;
    if (Math.abs(diffX) > 10) {
      hasDragged.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    if (dragStartX.current !== null && images.length > 1) {
      const diffX = dragStartX.current - e.clientX;
      if (Math.abs(diffX) > 35) {
        if (diffX > 0) {
          nextImage();
        } else {
          prevImage();
        }
      }
    }
    isDragging.current = false;
    dragStartX.current = null;
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDragged.current = false;
      return;
    }
    trackPropertyEvent({
      eventType: 'property_open',
      propertyId: property.id,
      source: 'property_card_image'
    });
    navigate(`/properties/${property.id}`);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (comparing) {
      removeFromCompare(property.id);
      trackPropertyEvent({
        eventType: 'compare_remove',
        propertyId: property.id,
        source: 'property_card'
      });
    } else {
      addToCompare(property);
      trackPropertyEvent({
        eventType: 'compare_add',
        propertyId: property.id,
        source: 'property_card'
      });
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(property.id);
  };

  const handleCardNavigate = () => {
    trackPropertyEvent({
      eventType: 'property_open',
      propertyId: property.id,
      source: 'property_card'
    });
    navigate(`/properties/${property.id}`);
  };

  // Avaliação de Badges com Dados Reais
  const freshness = calculatePropertyFreshness(property);
  const isVerified = property.verificationStatus === 'approved';
  const isPromoted = Boolean(property.isPromoted || isHighlighted);
  const isNew = isRecentProperty(property.createdAt, 14);
  const isUnavailable =
    property.status === 'Vendido' ||
    property.status === 'Arrendado' ||
    property.status === 'sold' ||
    property.status === 'rented';

  const statusLabel =
    property.status === 'sold' || property.status === 'Vendido'
      ? 'Vendido'
      : property.status === 'rented' || property.status === 'Arrendado'
      ? 'Arrendado'
      : null;

  // Características reais
  const hasBedrooms = typeof property.bedrooms === 'number' && property.bedrooms > 0;
  const hasBathrooms = typeof property.bathrooms === 'number' && property.bathrooms > 0;
  const hasArea = typeof property.area === 'number' && property.area > 0;
  const hasParking = Array.isArray(property.features) && property.features.some(f =>
    typeof f === 'string' && (f.toLowerCase().includes('estacionamento') || f.toLowerCase().includes('garagem'))
  );

  const hasAnyCharacteristics = hasBedrooms || hasBathrooms || hasArea || hasParking;

  return (
    <article
      id={`property-card-${property.id}`}
      className={`group relative p-[2px] rounded-2xl bg-gradient-to-br from-[#cb6ce6] via-[#dca3ee]/70 to-[#c1ff72] hover:from-[#b55cd0] hover:via-[#cb6ce6] hover:to-[#ace95a] transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 overflow-hidden ${
        isPromoted ? 'ring-2 ring-brand-purple/40 shadow-md' : ''
      } ${className}`}
    >
      {/* Realce nos cantos com degradê lilás e verde */}
      <div className="absolute top-0 left-0 w-14 h-14 pointer-events-none rounded-tl-2xl bg-gradient-to-br from-[#cb6ce6]/25 to-transparent z-10" />
      <div className="absolute bottom-0 right-0 w-14 h-14 pointer-events-none rounded-br-2xl bg-gradient-to-tl from-[#c1ff72]/30 to-transparent z-10" />

      {/* Corpo do Cartão com degradê cinza e branco - altura compacta e harmoniosa */}
      <div className="flex flex-col h-full w-full rounded-[14px] bg-gradient-to-b from-gray-100 via-gray-50 to-white overflow-hidden relative">
        {/* Imagem e Carrossel Interativo com Suporte a Arrastar/Swipe */}
        <div
          className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden select-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { isDragging.current = false; }}
        >
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          )}

          <div
            onClick={handleImageClick}
            className="block w-full h-full select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/properties/${property.id}`);
              }
            }}
            aria-label={`Ver detalhes de ${property.title}`}
          >
            <img
              src={currentImageSrc}
              alt={property.title || 'Imóvel no MeuPlace'}
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out select-none pointer-events-none ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Gradiente sutil para legibilidade dos badges e botões */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

          {/* Badges Flutuantes (Superior Esquerdo) */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1 max-w-[72%] pointer-events-none">
            {freshness.freshnessState === 'fresh' && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] font-medium rounded shadow-xs"
                title={freshness.reason}
              >
                <Check className="w-2.5 h-2.5 text-white" />
                {freshness.daysSinceConfirmation === 0 ? 'Hoje' : `${freshness.daysSinceConfirmation}d`}
              </span>
            )}

            {isVerified && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-semibold rounded shadow-xs"
                title="Imóvel com documentação verificada pela equipa do MeuPlace"
              >
                <BadgeCheck className="w-3 h-3 text-white" />
                Verificado
              </span>
            )}

            {isPromoted && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-green/95 text-gray-950 text-[10px] font-extrabold rounded shadow-md border border-brand-green-hover animate-pulse-glow-green"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-800"></span>
                </span>
                <Star className="w-2.5 h-2.5 fill-current text-gray-950" />
                <span>Destaque</span>
              </span>
            )}

            {isNew && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-600/95 backdrop-blur-xs text-white text-[10px] font-bold rounded shadow-xs">
                Novo
              </span>
            )}

            {statusLabel && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-900/90 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-xs">
                {statusLabel}
              </span>
            )}
          </div>

          {/* Botão de Favorito (Superior Direito) */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              className="p-1.5 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-red-500 shadow-md backdrop-blur-xs transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-brand-green"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${
                  isFav
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-700 hover:text-red-500'
                }`}
              />
            </button>
          </div>

          {/* Navegação do Carrossel de Imagens e Dica de Arrastar */}
          {images.length > 1 && (
            <>
              {/* Botões de seta para desktop / clique direto */}
              <button
                type="button"
                onClick={prevImage}
                aria-label="Imagem anterior"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 focus:opacity-100"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                aria-label="Próxima imagem"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 focus:opacity-100"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Indicadores de Paginação do Carrossel com contador */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {images.slice(0, 5).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex
                        ? 'w-3.5 bg-brand-green shadow-xs'
                        : 'w-1 bg-white/70'
                    }`}
                  />
                ))}
                {images.length > 5 && (
                  <span className="text-[9px] text-white/90 font-medium ml-0.5">
                    +{images.length - 5}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Conteúdo do Imóvel com degradê cinza e branco - Design mais compacto */}
        <div className="p-3 sm:p-3.5 flex flex-col flex-grow justify-between gap-2 bg-gradient-to-b from-gray-100/70 via-slate-50/80 to-white">
          <div>
            {/* Categoria e Tipo de Transação */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span className="font-bold text-brand-purple uppercase tracking-wider text-[10px]">
                {property.category || 'Imóvel'} • {formatTransactionType(property.type)}
              </span>
            </div>

            {/* Título com Link Semântico */}
            <h3 className="font-bold text-gray-900 text-sm sm:text-[15px] leading-snug line-clamp-1 group-hover:text-brand-green transition-colors mb-1">
              <Link
                to={`/properties/${property.id}`}
                onClick={() => trackPropertyEvent({
                  eventType: 'property_open',
                  propertyId: property.id,
                  source: 'property_card_title'
                })}
                className="focus:outline-none focus:underline"
              >
                {property.title}
              </Link>
            </h3>

            {/* Localização */}
            <div className="flex items-center text-gray-500 text-xs mb-2">
              <MapPin className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
              <span className="truncate">{property.location || 'Moçambique'}</span>
            </div>

            {/* Características Reais (Compactas e Omitidas se não informadas) */}
            {hasAnyCharacteristics && (
              <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-[11px] text-gray-600 pt-1.5 border-t border-gray-200/60">
                {hasBedrooms && (
                  <span className="inline-flex items-center gap-0.5">
                    <Bed className="w-3 h-3 text-gray-400" />
                    {property.bedrooms} {property.bedrooms === 1 ? 'qto' : 'qtos'}
                  </span>
                )}
                {hasBathrooms && (
                  <span className="inline-flex items-center gap-0.5">
                    <Bath className="w-3 h-3 text-gray-400" />
                    {property.bathrooms} WC
                  </span>
                )}
                {hasArea && (
                  <span className="inline-flex items-center gap-0.5">
                    <Maximize className="w-3 h-3 text-gray-400" />
                    {property.area} m²
                  </span>
                )}
                {hasParking && (
                  <span className="inline-flex items-center gap-0.5">
                    <Car className="w-3 h-3 text-gray-400" />
                    Estac.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Rodapé: Preço e Ações de Conversão Otimizadas */}
          <div className="pt-2 border-t border-gray-200/60 flex flex-col gap-2 mt-auto">
            {/* Preço Formatado */}
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-medium">Preço</span>
                <span className="text-base sm:text-[17px] font-extrabold text-gray-900 tracking-tight leading-tight">
                  {formatPropertyPrice(property.price, property.currency, property.type)}
                </span>
              </div>
            </div>

            {/* Barra de Ações Compacta: [Comparar] e [Ver imóvel] */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={handleCompareClick}
                aria-label={comparing ? 'Remover este imóvel da comparação' : 'Comparar este imóvel'}
                className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green ${
                  comparing
                    ? 'bg-brand-green/10 border-brand-green/40 text-brand-green hover:bg-brand-green/20'
                    : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300'
                }`}
              >
                {comparing ? (
                  <>
                    <Check className="w-3 h-3 text-brand-green stroke-[2.5]" />
                    <span>Comparando</span>
                  </>
                ) : (
                  <span>Comparar</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleCardNavigate}
                aria-label={`Ver detalhes do imóvel ${property.title}`}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 border border-brand-purple/30 rounded-lg shadow-xs hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-purple"
              >
                <span className="text-brand-purple font-extrabold">Ver imóvel</span>
                <ArrowUpRight className="w-3 h-3 text-brand-purple stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

/**
 * Skeleton com geometria e proporções rigorosamente idênticas ao PropertyCard
 * para prevenir layout shift (CLS) durante o carregamento de listagens.
 */
export const PropertyCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative p-[2px] rounded-2xl bg-gradient-to-br from-[#cb6ce6]/40 via-[#dca3ee]/30 to-[#c1ff72]/40 shadow-xs overflow-hidden ${className}`}>
      <div className="flex flex-col h-full w-full rounded-[14px] bg-gradient-to-b from-gray-100 via-gray-50 to-white overflow-hidden">
        {/* Imagem Shimmer */}
        <div className="w-full aspect-[16/10] bg-gray-200/60 relative">
          <Skeleton className="w-full h-full rounded-none" />
        </div>

        {/* Corpo Shimmer com degradê cinza e branco */}
        <div className="p-3 sm:p-3.5 flex flex-col flex-grow justify-between gap-2 bg-gradient-to-b from-gray-100/70 via-slate-50/80 to-white">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-1.5 border-t border-gray-200/60">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-3.5 w-12" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200/60 space-y-2 mt-auto">
            <Skeleton className="h-5 w-28" />
            <div className="flex gap-1.5 pt-0.5">
              <Skeleton className="h-7 flex-1 rounded-lg" />
              <Skeleton className="h-7 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
