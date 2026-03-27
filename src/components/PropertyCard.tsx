import React, { useState } from 'react';
import { Property } from '@/types';
import { MapPin, Bed, Bath, Maximize, Heart, MessageCircle, ChevronLeft, ChevronRight, Star, BadgeCheck } from 'lucide-react';
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
      className={`max-w-[350px] mx-auto w-full rounded-xl shadow-md transition-all duration-300 overflow-hidden border group flex flex-col h-full relative ${
        property.isPromoted || isHighlighted
          ? 'bg-gradient-to-br from-brand-green/10 via-white to-brand-purple/10 border-brand-purple/30 shadow-lg hover:shadow-xl hover:shadow-brand-purple/20 scale-[1.02]' 
          : 'bg-white border-gray-100 hover:shadow-lg'
      } ${className}`}
      id={`property-card-${property.id}`}
    >
      {(property.isPromoted || isHighlighted) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-green to-brand-purple z-20"></div>
      )}
      <div className="relative h-36 overflow-hidden bg-gray-100 flex-shrink-0">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <Link to={`/properties/${property.id}`} className="block h-full w-full">
          <img
            src={property.images[currentImageIndex]}
            alt={property.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none">
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
          <button className="p-1.5 bg-white/90 backdrop-blur-sm rounded-md hover:bg-white text-gray-600 hover:text-red-500 transition-colors shadow-sm">
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {property.isPromoted && (
            <span className="px-2 py-1 bg-brand-green/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              Destaque
            </span>
          )}
          <span className="px-2 py-1 bg-brand-purple/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
            {property.type}
          </span>
          {(property.status === 'Vendido' || property.status === 'Arrendado') && (
            <span className="px-2 py-1 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
              {property.status}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-[15px] font-bold text-gray-900 mb-1 group-hover:text-brand-green transition-colors leading-tight line-clamp-2">
          <Link to={`/properties/${property.id}`}>
            {property.title}
          </Link>
        </h3>
        
        <div className="flex items-center text-gray-500 text-xs mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
        
        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
          <p className="text-sm text-brand-purple font-bold">
            {property.currency} {property.price.toLocaleString()}
            {property.type === 'Arrendamento' && <span className="text-xs font-normal text-gray-500 ml-0.5">/mês</span>}
          </p>
        </div>
      </div>
    </div>
  );
};
