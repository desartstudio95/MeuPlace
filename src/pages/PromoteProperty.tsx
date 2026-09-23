import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Star, Check, ArrowLeft, Zap, Shield } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

export function PromoteProperty() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addNotification } = useNotifications();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProperty({ id: docSnap.id, ...docSnap.data() } as Property);
        } else {
          addNotification({ title: 'Erro', message: 'Imóvel não encontrado.', type: 'error' });
          navigate(-1);
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate, addNotification]);

  const plans = [
    {
      id: 'days',
      name: 'Destaque Diário',
      duration: '3 Dias',
      price: 500,
      icon: Zap,
      features: [
        'Imóvel no topo das pesquisas',
        'Selo de "Em Destaque"',
        'Maior visibilidade na página inicial'
      ]
    },
    {
      id: 'weeks',
      name: 'Destaque Semanal',
      duration: '7 Dias',
      price: 1000,
      icon: Star,
      isPopular: true,
      features: [
        'Imóvel no topo das pesquisas por 1 semana',
        'Selo de "Em Destaque"',
        'Destaque nas redes sociais',
        'Aparece nos imóveis recomendados'
      ]
    },
    {
      id: 'month',
      name: 'Destaque Mensal',
      duration: '30 Dias',
      price: 3500,
      icon: Shield,
      features: [
        'Imóvel no topo das pesquisas por 1 mês',
        'Selo Exclusivo de "Premium"',
        'Campanha de Email Marketing',
        'Destaque permanente na página inicial',
        'Relatório de estatísticas detalhado'
      ]
    }
  ];

  const handlePayment = async () => {
    if (!selectedPlan) {
      addNotification({ title: 'Aviso', message: 'Selecione um plano de promoção primeiro.', type: 'warning' });
      return;
    }

    const planObj = plans.find(p => p.id === selectedPlan);
    if (!planObj || !property || !currentUser) {
      addNotification({ title: 'Aviso', message: 'Faça login para solicitar promoção.', type: 'warning' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        propertyId: property.id,
        propertyTitle: property.title,
        type: 'property_promotion',
        planId: planObj.id,
        planName: planObj.name,
        duration: planObj.duration,
        amount: planObj.price,
        currency: 'MZN',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'orders'), orderData);

      addNotification({ 
        title: 'Pedido de Destaque Registado', 
        message: `Seu pedido para ${planObj.name} (${planObj.price} MT) foi criado. Efetue o pagamento via M-Pesa para ativar o destaque.`, 
        type: 'success' 
      });
    } catch (error) {
      console.error("Error creating promotion order:", error);
      addNotification({ title: 'Erro', message: 'Não foi possível registar o pedido de promoção.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!property) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <p>Imóvel não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Promover Imóvel</h1>
              <p className="text-gray-500">Aumente a visibilidade de "{property.title}" no portal.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-6 items-center">
            <img 
              src={property.images?.[0] || 'https://placehold.co/400x300'} 
              alt={property.title} 
              className="w-full sm:w-48 h-32 object-cover rounded-xl"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{property.title}</h2>
              <p className="text-gray-500">{property.location}</p>
              <div className="mt-2 text-brand-green font-bold text-lg">
                {property.currency} {property.price.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;
              
              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-3xl p-8 border-2 transition-all cursor-pointer relative flex flex-col ${
                    isSelected ? 'border-amber-500 shadow-md scale-105 z-10' : 'border-gray-200 hover:border-amber-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider">
                      Mais Popular
                    </div>
                  )}
                  
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">MT</span>
                  </div>
                  <div className="text-sm font-semibold text-amber-600 mb-6 bg-amber-50 py-1.5 px-3 rounded-full inline-block self-start">
                    Duração: {plan.duration}
                  </div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-600 text-sm">
                        <Check className="h-5 w-5 text-amber-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${
                      isSelected 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                        : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                    }`}
                  >
                    {isSelected ? 'Plano Selecionado' : 'Selecionar Plano'}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            <Button 
              size="lg" 
              onClick={handlePayment} 
              disabled={!selectedPlan}
              className="bg-brand-green hover:bg-brand-green-hover text-white px-12 py-6 text-lg rounded-full shadow-lg"
            >
              Avançar para Pagamento
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}
