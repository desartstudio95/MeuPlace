import React, { useState } from 'react';
import { Property } from '@/types';
import { MapPin, Bed, Bath, Maximize, Heart, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface PropertyCardProps {
  property: Property;
  className?: string;
  isHighlighted?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, className = '', isHighlighted = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm transition-all duration-300 overflow-hidden border group flex flex-col h-full relative ${
        isHighlighted 
          ? 'border-brand-green ring-2 ring-brand-green ring-offset-2 shadow-md scale-[1.02]' 
          : 'border-gray-100 hover:shadow-md'
      } ${className}`}
      id={`property-card-${property.id}`}
    >
      <div className="relative h-48 sm:h-64 overflow-hidden bg-gray-100 flex-shrink-0">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <Link to={`/properties/${property.id}`} className="block h-full w-full">
          <img
            src={property.images[currentImageIndex]}
            alt={property.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        </Link>
        
        {/* Navigation Arrows */}
        {property.images.length > 1 && (
            <>
                <button 
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Next image"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                
                {/* Dots Indicator */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
                    {property.images.slice(0, 5).map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 rounded-full shadow-sm transition-all duration-300 ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} 
                        />
                    ))}
                </div>
            </>
        )}

        <div className="absolute top-3 right-3 z-10">
          <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white text-gray-600 hover:text-red-500 transition-colors">
            <Heart className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <span className="px-3 py-1 bg-brand-green text-white text-xs font-bold uppercase tracking-wider rounded-full w-fit">
            {property.type}
          </span>
          {(property.status === 'Vendido' || property.status === 'Arrendado') && (
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full w-fit shadow-md">
              {property.status}
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none">
          <p className="text-white font-bold text-lg">
            {property.currency} {property.price.toLocaleString()}
            {property.type === 'Arrendamento' && <span className="text-sm font-normal">/mês</span>}
          </p>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between">
          <div className="w-full">
            <p className="text-sm text-brand-purple font-medium mb-1">{property.category}</p>
            <Link to={`/properties/${property.id}`}>
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-brand-green transition-colors min-h-[1.75rem]">
                {property.title}
              </h3>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm mt-2 mb-4">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{property.location}</span>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-600 mt-auto">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{property.bedrooms}</span>
            <span className="text-xs text-gray-400">Quartos</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{property.bathrooms}</span>
            <span className="text-xs text-gray-400">Banheiros</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{property.area}</span>
            <span className="text-xs text-gray-400">m²</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <Link to={`/agent/${encodeURIComponent(property.agent.name)}`} className="flex items-center gap-2 group cursor-pointer">
                {property.agent.avatar ? (
                    <img src={property.agent.avatar} alt={property.agent.name} className="w-8 h-8 rounded-full object-cover group-hover:ring-2 ring-brand-green transition-all" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-brand-green/20 group-hover:text-brand-green transition-all">
                        {property.agent.name.charAt(0)}
                    </div>
                )}
                <span className="text-xs text-gray-500 font-medium truncate max-w-[100px] group-hover:text-brand-green transition-colors">{property.agent.name}</span>
            </Link>
            <div className="flex items-center gap-2">
              <a 
                href={`https://wa.me/${property.agent.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, estou interessado no imóvel: ${property.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Contactar via WhatsApp"
              >
                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white px-3">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </a>
              <Link to={`/properties/${property.id}`}>
                  <Button variant="outline" size="sm" className="text-brand-green border-brand-green hover:bg-brand-green/10">
                      Ver Detalhes
                  </Button>
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
};
