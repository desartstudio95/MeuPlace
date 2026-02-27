import React, { useState } from 'react';
import { Property } from '@/types';
import { MapPin, Bed, Bath, Maximize, Heart, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export interface PropertyCardProps {
  property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 group flex flex-col h-full">
      <div className="relative h-48 sm:h-64 overflow-hidden bg-gray-100">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <img
          src={property.images[0]}
          alt={property.title}
          className={`w-full h-full object-cover transform group-hover:scale-105 transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute top-3 right-3">
          <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white text-gray-600 hover:text-red-500 transition-colors">
            <Heart className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-brand-green text-white text-xs font-bold uppercase tracking-wider rounded-full">
            {property.type}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-white font-bold text-lg">
            {property.currency} {property.price.toLocaleString()}
            {property.type === 'Arrendamento' && <span className="text-sm font-normal">/mês</span>}
          </p>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-brand-purple font-medium mb-1">{property.category}</p>
            <Link to={`/properties/${property.id}`}>
              <h3 className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-brand-green transition-colors">
                {property.title}
              </h3>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm mt-2 mb-4">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
        
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-600">
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
            <div className="flex items-center gap-2">
                {property.agent.avatar ? (
                    <img src={property.agent.avatar} alt={property.agent.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {property.agent.name.charAt(0)}
                    </div>
                )}
                <span className="text-xs text-gray-500 font-medium truncate max-w-[100px]">{property.agent.name}</span>
            </div>
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
}
