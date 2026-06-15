import React, { useState, useEffect } from 'react';
import { Check, Star, Shield, Zap, Crown, Building2, Hotel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PLANS as DEFAULT_PLANS, RESORT_PLANS, Plan } from '@/constants/plans';
import { authService } from '@/services/authService';
import { useNotifications } from '@/context/NotificationContext';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingScreen } from '@/components/LoadingScreen';

export function Plans() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [agentPlans, setAgentPlans] = useState<Plan[]>(DEFAULT_PLANS);
  // Optional: If you want to fetch resort plans from DB too, use setResortPlans. For now static is fine or both.
  const [resortPlans] = useState<Plan[]>(RESORT_PLANS);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'agent' | 'resort'>('agent');

  useEffect(() => {
    if (userProfile?.role === 'resort') {
      setActiveTab('resort');
    } else if (userProfile?.role === 'agent' || userProfile?.role === 'agency') {
      setActiveTab('agent');
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, 'subscription_plans'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedPlans: Plan[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPlans.push({ id: doc.id, ...doc.data() } as Plan);
        });

        if (fetchedPlans.length > 0) {
          setAgentPlans(fetchedPlans);
        } else {
          try {
            // fallback if index fails
            const fallbackQ = query(collection(db, 'subscription_plans'));
            const fallbackSnapshot = await getDocs(fallbackQ);
            const fbPlans: Plan[] = [];
            fallbackSnapshot.forEach((doc) => {
              fbPlans.push({ id: doc.id, ...doc.data() } as Plan);
            });
            if (fbPlans.length > 0) {
              fbPlans.sort((a, b) => a.limit - b.limit);
              setAgentPlans(fbPlans);
            }
          } catch (e) {
            console.error("Fallback fetching failed", e);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (!currentUser || !userProfile) {
      navigate('/login');
      return;
    }

    try {
      setIsSubscribing(plan.id);
      
      // Update locally first for immediate feedback
      const updatedData = {
        planId: plan.id,
        planLimit: plan.limit,
        planExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      await authService.updateUserProfile(currentUser.uid, updatedData);
      updateUserProfile(updatedData);

      addNotification({
        title: 'Plano Ativado!',
        message: `Você agora está no ${plan.name} com limite de ${plan.limit === 999999 ? 'anúncios ilimitados' : `${plan.limit} anúncios`}.`,
        type: 'success'
      });

      navigate('/dashboard');
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      addNotification({
        title: 'Erro na Assinatura',
        message: 'Ocorreu um erro ao processar sua assinatura. Tente novamente ou entre em contato com o suporte.',
        type: 'error'
      });
    } finally {
      setIsSubscribing(null);
    }
  };

  const getIcon = (planId: string) => {
    switch (planId) {
      case 'free': return Shield;
      case 'pro-10': return Zap;
      case 'pro-25': return Star;
      case 'agency': return Building2;
      case 'unlimited': return Crown;
      case 'resort-basic': return Shield;
      case 'resort-pro': return Star;
      case 'resort-elite': return Hotel;
      default: return Zap;
    }
  };

  const getColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'text-gray-500';
      case 'pro-10': return 'text-blue-500';
      case 'pro-25': return 'text-green-500';
      case 'agency': return 'text-purple-500';
      case 'unlimited': return 'text-amber-500';
      case 'resort-basic': return 'text-blue-500';
      case 'resort-pro': return 'text-purple-500';
      case 'resort-elite': return 'text-amber-500';
      default: return 'text-brand-green';
    }
  };

  if (loadingPlans) {
    return <LoadingScreen />;
  }
  
  const displayedPlans = activeTab === 'agent' ? agentPlans : resortPlans;
  const isRoleFixed = userProfile && ['agent', 'agency', 'resort'].includes(userProfile.role);

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Planos de Assinatura</h1>
          <p className="text-lg text-gray-600 mb-8">
            Escolha o plano que melhor se adapta às suas necessidades e comece a anunciar seus imóveis no MeuPlace.
          </p>
          
          {!isRoleFixed && (
            <div className="inline-flex bg-gray-200 rounded-xl p-1 mb-8">
              <button
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'agent' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('agent')}
              >
                Agentes e Agências
              </button>
              <button
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'resort' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveTab('resort')}
              >
                Resorts e Hotéis
              </button>
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${displayedPlans.length <= 3 ? 'lg:grid-cols-3 max-w-5xl mx-auto' : 'lg:grid-cols-5'}`}>
          {displayedPlans.map((plan) => {
            const Icon = getIcon(plan.id);
            const colorClass = getColor(plan.id);
            const isCurrentPlan = userProfile?.planId === plan.id || (!userProfile?.planId && plan.id === 'free' && activeTab === 'agent');

            return (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 flex flex-col ${
                  isCurrentPlan ? 'border-brand-green ring-4 ring-brand-green/10 scale-105 z-10' : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                    Plano Atual
                  </div>
                )}
                
                <div className="p-6 border-b border-gray-50">
                  <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-4 ${colorClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {plan.price === 0 ? 'Grátis' : `${plan.price.toLocaleString()} MT`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-500 text-sm">/mês</span>}
                  </div>
                  <p className="text-sm text-gray-500 h-10 overflow-hidden line-clamp-2">
                    {plan.description}
                  </p>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Check className="h-4 w-4 text-green-500" />
                      {plan.limit === 999999 ? 'Ilimitados' : `Até ${plan.limit}`}
                    </li>
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrentPlan || isSubscribing === plan.id}
                    className={`w-full h-11 transition-all ${
                      isCurrentPlan 
                        ? 'bg-gray-100 text-gray-400 cursor-default' 
                        : 'bg-brand-green hover:bg-brand-green-hover text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isSubscribing === plan.id ? 'Processando...' : isCurrentPlan ? 'Ativo' : 'Escolher Plano'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-brand-green/5 rounded-3xl p-8 border border-brand-green/10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Precisa de um plano customizado?</h2>
          <p className="text-gray-600 mb-6">
            Para empresas com necessidades específicas ou grandes volumes, entre em contato com nossa equipe comercial.
          </p>
          <Button 
            variant="outline" 
            className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
            onClick={() => navigate('/contact')}
          >
            Falar com Consultor
          </Button>
        </div>
      </div>
    </div>
  );
}
