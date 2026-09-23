import React, { useState } from 'react';
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

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setImageLoaded(false);
      setImageError(false);
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setImageLoaded(false);
      setImageError(false);
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
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
      className={`group flex flex-col h-full bg-white rounded-2xl border transition-all duration-300 overflow-hidden relative shadow-xs hover:shadow-xl hover:-translate-y-0.5 ${
        isPromoted
          ? 'border-brand-green/40 ring-1 ring-brand-green/20'
          : 'border-gray-200/90 hover:border-gray-300'
      } ${className}`}
    >
      {/* Imagem e Carrossel */}
      <div className="relative w-full aspect-[16/10] bg-gray-100 overflow-hidden select-none">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
        )}

        <Link
          to={`/properties/${property.id}`}
          onClick={() => trackPropertyEvent({
            eventType: 'property_open',
            propertyId: property.id,
            source: 'property_card_image'
          })}
          className="block w-full h-full cursor-pointer"
          aria-label={`Ver detalhes de ${property.title}`}
        >
          <img
            src={currentImageSrc}
            alt={property.title || 'Imóvel no MeuPlace'}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </Link>

        {/* Gradiente sutil para legibilidade dos badges e botões */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />

        {/* Badges Flutuantes (Superior Esquerdo) */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 max-w-[70%] pointer-events-none">
          {isVerified && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600/95 backdrop-blur-xs text-white text-[11px] font-semibold rounded-md shadow-xs"
              title="Imóvel com documentação verificada pela equipa do MeuPlace"
            >
              <BadgeCheck className="w-3.5 h-3.5 text-white" />
              Verificado
            </span>
          )}

          {isPromoted && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/95 backdrop-blur-xs text-white text-[11px] font-bold rounded-md shadow-xs"
            >
              <Star className="w-3 h-3 fill-current" />
              Destaque
            </span>
          )}

          {isNew && (
            <span className="inline-flex items-center px-2 py-0.5 bg-blue-600/95 backdrop-blur-xs text-white text-[11px] font-bold rounded-md shadow-xs">
              Novo
            </span>
          )}

          {statusLabel && (
            <span className="inline-flex items-center px-2 py-0.5 bg-gray-900/90 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow-xs">
              {statusLabel}
            </span>
          )}
        </div>

        {/* Botão de Favorito (Superior Direito) */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className="p-2 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-red-500 shadow-md backdrop-blur-xs transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFav
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-700 hover:text-red-500'
              }`}
            />
          </button>
        </div>

        {/* Navegação do Carrossel de Imagens */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 focus:opacity-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Próxima imagem"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 focus:opacity-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Indicadores de Paginação do Carrossel */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 pointer-events-none">
              {images.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex
                      ? 'w-4 bg-white shadow-xs'
                      : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Conteúdo do Imóvel */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div>
          {/* Categoria e Tipo de Transação */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-semibold text-brand-purple uppercase tracking-wider text-[10px]">
              {property.category || 'Imóvel'} • {formatTransactionType(property.type)}
            </span>
          </div>

          {/* Título com Link Semântico */}
          <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-brand-green transition-colors mb-1">
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
          <div className="flex items-center text-gray-500 text-xs mb-3">
            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" />
            <span className="truncate">{property.location || 'Moçambique'}</span>
          </div>

          {/* Características Reais (Omitidas se não informadas) */}
          {hasAnyCharacteristics && (
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-600 pt-2 border-t border-gray-100">
              {hasBedrooms && (
                <span className="inline-flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-gray-400" />
                  {property.bedrooms} {property.bedrooms === 1 ? 'quarto' : 'quartos'}
                </span>
              )}
              {hasBathrooms && (
                <span className="inline-flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-gray-400" />
                  {property.bathrooms} WC
                </span>
              )}
              {hasArea && (
                <span className="inline-flex items-center gap-1">
                  <Maximize className="w-3.5 h-3.5 text-gray-400" />
                  {property.area} m²
                </span>
              )}
              {hasParking && (
                <span className="inline-flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-gray-400" />
                  Estac.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Rodapé: Preço e Ações de Conversão */}
        <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5 mt-auto">
          {/* Preço Formatado */}
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-400 uppercase font-medium">Preço</span>
              <span className="text-lg font-extrabold text-gray-900 tracking-tight">
                {formatPropertyPrice(property.price, property.currency, property.type)}
              </span>
            </div>
          </div>

          {/* Barra de Ações: [Comparar] e [Ver imóvel] */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCompareClick}
              aria-label={comparing ? 'Remover este imóvel da comparação' : 'Comparar este imóvel'}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green ${
                comparing
                  ? 'bg-brand-green/10 border-brand-green/40 text-brand-green hover:bg-brand-green/20'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              {comparing ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brand-green stroke-[2.5]" />
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
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-white bg-brand-green hover:bg-brand-green-hover rounded-xl shadow-xs hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-green"
            >
              <span>Ver imóvel</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
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
    <div className={`flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs ${className}`}>
      {/* Imagem Shimmer */}
      <div className="w-full aspect-[16/10] bg-gray-100 relative">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* Corpo Shimmer */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3.5 w-1/2" />
          <div className="flex gap-2 pt-2 border-t border-gray-50">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 space-y-2.5 mt-auto">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 flex-1 rounded-xl" />
            <Skeleton className="h-8 flex-1 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
