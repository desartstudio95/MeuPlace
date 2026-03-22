import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Phone, Mail, Globe, Check, ChevronLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FEATURED_RESORTS } from '@/data/mockData';
import { useNotifications } from '@/context/NotificationContext';

export function ResortDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [resort, setResort] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);

  // Booking form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  useEffect(() => {
    const foundResort = FEATURED_RESORTS.find(r => r.id === id);
    if (foundResort) {
      setResort(foundResort);
    }
  }, [id]);

  if (!resort) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Resort não encontrado</h2>
        <p className="text-gray-500 mb-6">Não conseguimos encontrar os detalhes deste resort.</p>
        <Button onClick={() => navigate('/')} className="bg-brand-green hover:bg-brand-green-hover">
          Voltar à Página Inicial
        </Button>
      </div>
    );
  }

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkIn || !checkOut) return;

    const message = `Olá! Gostaria de solicitar uma reserva para o resort *${resort.name}*.\n\n*Detalhes da Reserva:*\n📅 Check-in: ${checkIn}\n📅 Check-out: ${checkOut}\n👥 Hóspedes: ${guests}\n\nAguardo confirmação de disponibilidade e valores.`;
    
    const whatsappUrl = `https://wa.me/${resort.contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    addNotification({
      title: 'Redirecionando para o WhatsApp...',
      message: `A abrir o chat com ${resort.name} para finalizar o seu pedido.`,
      type: 'success'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
              <img 
                src={resort.gallery[activeImage]} 
                alt={resort.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {resort.gallery.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-24 w-32 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all focus:outline-none ${activeImage === idx ? 'border-brand-green' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Galeria ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Header Info */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{resort.name}</h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 text-brand-green mr-1" />
                  <span className="text-lg">{resort.location}</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-current" />
                <span className="text-xl font-bold text-amber-700">{resort.rating}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sobre o Resort</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              {resort.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Comodidades</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resort.amenities.map((amenity: string, idx: number) => (
                <div key={idx} className="flex items-center gap-3 text-gray-700">
                  <div className="bg-brand-green/10 p-1.5 rounded-full">
                    <Check className="h-4 w-4 text-brand-green" />
                  </div>
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Booking & Contact */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg sticky top-6">
            <div className="mb-6 pb-6 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">A partir de</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-brand-purple">{resort.price}</span>
                <span className="text-gray-500 mb-1">/noite</span>
              </div>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      type="date" 
                      required 
                      className="pl-9"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Check-out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      type="date" 
                      required 
                      className="pl-9"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Hóspedes</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                >
                  <option value="1">1 Hóspede</option>
                  <option value="2">2 Hóspedes</option>
                  <option value="3">3 Hóspedes</option>
                  <option value="4">4 Hóspedes</option>
                  <option value="5">5+ Hóspedes</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-brand-green hover:bg-brand-green-hover text-white h-12 text-lg font-bold mt-2">
                Solicitar Reserva
              </Button>
              <p className="text-xs text-center text-gray-500 mt-3">
                Você não será cobrado ainda. A disponibilidade será confirmada.
              </p>
            </form>
          </div>

          {/* Contact Info Card */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Contactos Diretos</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="h-5 w-5 text-brand-purple" />
                <a href={`tel:${resort.contact.phone.replace(/\s/g, '')}`} className="hover:text-brand-purple transition-colors">
                  {resort.contact.phone}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-5 w-5 text-brand-purple" />
                <a href={`mailto:${resort.contact.email}`} className="hover:text-brand-purple transition-colors">
                  {resort.contact.email}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Globe className="h-5 w-5 text-brand-purple" />
                <a href={`https://${resort.contact.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-purple transition-colors">
                  {resort.contact.website}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
