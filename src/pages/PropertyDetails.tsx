import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Phone, MessageCircle, Calendar, Share2, Heart, ChevronLeft, ChevronRight, Copy, Facebook, Mail, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Property } from '@/types';
import { PROPERTIES } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function PropertyDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const property = PROPERTIES.find(p => p.id === id) || PROPERTIES[0]; // Fallback to first for demo
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setImageLoading(true);
  }, [currentImageIndex]);

  if (!property) {
    return <div className="text-center py-20">Imóvel não encontrado.</div>;
  }

  const handleWhatsApp = () => {
    const message = `Olá, estou interessado no imóvel: ${property.title}`;
    window.open(`https://wa.me/${property.agent.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
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
      text: `Confira este imóvel: ${property.title} em ${property.location}`,
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
  const encodedTitle = encodeURIComponent(property.title);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs could go here */}
      
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
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
                        className="w-full"
                      />
                    </div>
                    <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                      <span className="sr-only">Copiar</span>
                      {isCopied ? <span className="text-green-600 font-medium">Copiado!</span> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex justify-center gap-4 pt-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')}>
                      <Facebook className="h-4 w-4 text-blue-600" />
                      Facebook
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank')}>
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(`mailto:?subject=${encodedTitle}&body=${encodedUrl}`, '_blank')}>
                      <Mail className="h-4 w-4 text-gray-600" />
                      Email
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="icon" variant="secondary" className="rounded-full bg-white/80 hover:bg-white">
                <Heart className="h-5 w-5 text-gray-700" />
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
              <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
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
        </div>

        {/* Sidebar / Agent Contact */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={property.agent.avatar || `https://ui-avatars.com/api/?name=${property.agent.name}`} 
                alt={property.agent.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-green/20"
              />
              <div>
                <p className="text-sm text-gray-500">Agente Responsável</p>
                <h3 className="text-lg font-bold text-gray-900">{property.agent.name}</h3>
                <div className="flex items-center text-yellow-500 text-sm">
                  ★★★★★ <span className="text-gray-400 ml-1">(4.9)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full bg-brand-green hover:bg-brand-green-hover h-12 text-lg" onClick={handleWhatsApp}>
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
              <Button variant="outline" className="w-full h-12 text-lg border-gray-300 text-gray-700 hover:bg-gray-50">
                <Phone className="h-5 w-5 mr-2" />
                Ligar Agora
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
    </div>
  );
}
