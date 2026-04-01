import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Phone, Mail, Globe, Check, ChevronLeft, Calendar, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, getDocFromServer, getDocsFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { PropertyMap } from '@/components/PropertyMap';
import { SEO } from '@/components/SEO';
import { Property } from '@/types';

import { LoadingScreen } from '@/components/LoadingScreen';

export function ResortDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { userProfile, currentUser } = useAuth();
  const [resort, setResort] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Booking form state
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  useEffect(() => {
    const fetchResortAndReviews = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'resorts', id);
        const docSnap = await getDocFromServer(docRef);
        if (docSnap.exists()) {
          setResort({ id: docSnap.id, ...docSnap.data() });
        } else {
          addNotification({ title: 'Erro', message: 'Resort não encontrado', type: 'error' });
          navigate('/');
        }

        // Fetch reviews
        const reviewsRef = collection(db, 'resorts', id, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const reviewsSnap = await getDocsFromServer(q);
        const fetchedReviews: any[] = [];
        reviewsSnap.forEach((doc) => {
          fetchedReviews.push({ id: doc.id, ...doc.data() });
        });
        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching resort data:", error);
        addNotification({ title: 'Erro', message: 'Erro ao carregar dados do resort', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchResortAndReviews();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !id) {
      addNotification({
        title: 'Login necessário',
        message: 'Você precisa estar logado para avaliar.',
        type: 'error'
      });
      return;
    }

    if (!newReview.trim()) return;

    setSubmittingReview(true);
    try {
      const reviewData = {
        userId: currentUser.uid,
        userName: userProfile.displayName || 'Usuário',
        userPhoto: userProfile.photoURL || '',
        rating: newRating,
        comment: newReview,
        createdAt: serverTimestamp()
      };

      const reviewsRef = collection(db, 'resorts', id, 'reviews');
      await addDoc(reviewsRef, reviewData);
      
      // Add to local state
      setReviews([{ ...reviewData, id: Date.now().toString(), createdAt: { toDate: () => new Date() } }, ...reviews]);
      setNewReview('');
      setNewRating(5);
      
      addNotification({
        title: 'Avaliação enviada',
        message: 'Obrigado por avaliar este resort!',
        type: 'success'
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível enviar sua avaliação.',
        type: 'error'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

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
      <SEO 
        title={resort.name} 
        description={resort.description} 
        image={resort.image}
      />
      
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-600 hover:text-brand-green mb-6 transition-colors"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100">
              <img 
                src={resort.gallery && resort.gallery.length > 0 ? resort.gallery[activeImage] : resort.image} 
                alt={resort.name} 
                className="w-full h-full object-cover"
              />
            </div>
            {resort.gallery && resort.gallery.length > 0 && (
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
            )}
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
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
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

          {/* Map Location */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Localização</h2>
            <div className="h-[400px] rounded-xl overflow-hidden">
              <PropertyMap 
                properties={[{
                  id: resort.id,
                  title: resort.name,
                  images: [resort.image],
                  currency: 'MZN',
                  price: parseInt(resort.price.replace(/\D/g, '')) || 0,
                  location: resort.location,
                  coordinates: resort.coordinates || { lat: -25.9692, lng: 32.5732 },
                  description: resort.description,
                  type: 'Arrendamento',
                  category: 'Apartamento',
                  bedrooms: 1,
                  bathrooms: 1,
                  area: 0,
                  features: resort.amenities,
                  createdAt: new Date().toISOString()
                } as Property]} 
                height="100%" 
                zoom={14} 
              />
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Avaliações de Clientes</h2>
            
            {/* Review Form */}
            {currentUser ? (
              <form onSubmit={handleReviewSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Deixe sua avaliação</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nota</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star className={`h-6 w-6 ${star <= newRating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comentário</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 p-3 focus:ring-brand-green focus:border-brand-green"
                    rows={3}
                    placeholder="Conte-nos sobre sua experiência..."
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={submittingReview || !newReview.trim()}
                  className="bg-brand-green hover:bg-brand-green-hover text-white"
                >
                  {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
                  {!submittingReview && <Send className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                <p className="text-gray-600 mb-4">Faça login para deixar uma avaliação.</p>
                <Button onClick={() => navigate('/login')} className="bg-brand-green hover:bg-brand-green-hover">
                  Fazer Login
                </Button>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {review.userPhoto ? (
                          <img src={review.userPhoto} alt={review.userName} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{review.userName}</p>
                          <p className="text-xs text-gray-500">
                            {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recentemente'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center bg-amber-50 px-2 py-1 rounded">
                        <Star className="h-4 w-4 text-amber-500 fill-current mr-1" />
                        <span className="text-sm font-bold text-amber-700">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-3">{review.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Ainda não há avaliações para este resort. Seja o primeiro a avaliar!</p>
              )}
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
