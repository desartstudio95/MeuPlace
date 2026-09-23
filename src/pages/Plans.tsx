import React, { useState, useEffect } from 'react';
import { Check, Star, Shield, Zap, Crown, Building2, Hotel, Sparkles, Rocket, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PLANS as DEFAULT_PLANS, RESORT_PLANS, Plan } from '@/constants/plans';
import { authService } from '@/services/authService';
import { useNotifications } from '@/context/NotificationContext';
import { collection, query, getDocs, orderBy, addDoc } from 'firebase/firestore';
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
    } else if (userProfile?.role === 'agent') {
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
          // Guarantee that the 500 MT pre-launch promotional plan is included
          let finalPlans = [...fetchedPlans];
          const hasPromo = finalPlans.some(p => p.id === 'launch-promo' || p.price === 500);
          if (!hasPromo) {
            const promoPlan = DEFAULT_PLANS.find(p => p.id === 'launch-promo');
            if (promoPlan) {
              finalPlans = [promoPlan, ...finalPlans];
            }
          }
          finalPlans.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
          setAgentPlans(finalPlans);
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
              let finalPlans = [...fbPlans];
              const hasPromo = finalPlans.some(p => p.id === 'launch-promo' || p.price === 500);
              if (!hasPromo) {
                const promoPlan = DEFAULT_PLANS.find(p => p.id === 'launch-promo');
                if (promoPlan) {
                  finalPlans = [promoPlan, ...finalPlans];
                }
              }
              finalPlans.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
              setAgentPlans(finalPlans);
            } else {
              setAgentPlans(DEFAULT_PLANS);
            }
          } catch (e) {
            console.error("Fallback fetching failed", e);
            setAgentPlans(DEFAULT_PLANS);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription plans:", error);
        setAgentPlans(DEFAULT_PLANS);
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
      
      const isFree = plan.price === 0 || plan.id === 'free';
      const isAdmin = userProfile.role === 'admin';

      // Record order in orders collection for financial tracking and audit
      await addDoc(collection(db, 'orders'), {
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: userProfile.displayName || '',
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        currency: 'MZN',
        status: (isFree || isAdmin) ? 'completed' : 'pending',
        paymentMethod: isFree ? 'none' : 'mpesa_emola',
        createdAt: new Date().toISOString()
      });

      if (isFree || isAdmin) {
        const updatedData = {
          planId: plan.id,
          planLimit: plan.limit,
          planExpiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        await authService.updateUserProfile(currentUser.uid, updatedData);
        updateUserProfile(updatedData);

        addNotification({
          title: 'Plano Ativado com Sucesso!',
          message: `Você agora está no ${plan.name} com limite de ${plan.limit === 999999 ? 'anúncios ilimitados' : `${plan.limit} anúncios`}.`,
          type: 'success'
        });

        navigate('/dashboard');
      } else {
        // Paid plans require verification / payment flow
        addNotification({
          title: 'Pedido de Assinatura Registado!',
          message: `O pedido para o plano "${plan.name}" (${plan.price} MT) foi registado com sucesso! Efetue o pagamento via M-Pesa / E-Mola para que a nossa equipa confirme a ativação.`,
          type: 'success'
        });
      }
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
      case 'launch-promo': return Rocket;
      case 'free': return Shield;
      case 'basic': return Zap;
      case 'pro': return Star;
      case 'enterprise': return Crown;
      case 'resort-basic': return Shield;
      case 'resort-pro': return Star;
      case 'resort-elite': return Hotel;
      default: return Sparkles;
    }
  };

  const getColor = (planId: string) => {
    switch (planId) {
      case 'launch-promo': return 'text-brand-green';
      case 'free': return 'text-gray-500';
      case 'basic': return 'text-blue-500';
      case 'pro': return 'text-green-500';
      case 'enterprise': return 'text-amber-500';
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/20 border border-brand-green/40 text-gray-900 font-bold text-xs mb-4">
            <Flame className="w-3.5 h-3.5 text-gray-900" />
            <span>CAMPANHA DE PRÉ-LANÇAMENTO ATIVA</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Planos de Assinatura & Pré-Lançamento
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8">
            Aproveite nossa condição promocional de estreia para agentes imobiliários e anuncie seus imóveis com o melhor custo-benefício de Moçambique.
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

        {/* Highlight Banner if on agent tab */}
        {activeTab === 'agent' && (
          <div className="max-w-4xl mx-auto mb-10 bg-gradient-to-r from-[#6b1c82] via-[#8e25ad] to-[#5f1774] rounded-2xl p-6 text-white border-2 border-brand-green/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-green/20 border border-brand-green/40 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-7 h-7 text-brand-green" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-green text-gray-950 font-black text-[11px] uppercase tracking-wider mb-1.5">
                  Oferta de Pré-Lançamento
                </div>
                <h2 className="text-xl font-bold text-white">Anuncie os seus imóveis por apenas 500 MT / mês</h2>
                <p className="text-xs sm:text-sm text-purple-100">
                  Cadastre-se na fase de estreia e publique até 15 imóveis com 2 destaques especiais na página inicial e receba contactos diretos no WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 text-center md:text-right">
              <div className="text-3xl font-extrabold text-brand-green mb-0.5">500 MT <span className="text-xs text-purple-200 font-normal">/mês</span></div>
              <div className="text-xs text-purple-200 line-through">De 1.500 MT</div>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${displayedPlans.length <= 3 ? 'lg:grid-cols-3 max-w-4xl mx-auto' : 'lg:grid-cols-5 max-w-7xl mx-auto'}`}>
          {displayedPlans.map((plan) => {
            const Icon = getIcon(plan.id);
            const isCurrentPlan = userProfile?.planId === plan.id || (!userProfile?.planId && plan.id === 'free' && activeTab === 'agent');
            const isPromoPlan = plan.id === 'launch-promo' || plan.isPromo;

            let cardBgClass = 'bg-white';
            let textColorClass = 'text-gray-900';
            let descColorClass = 'text-gray-500';
            let listColorClass = 'text-gray-600';
            let listStrongColorClass = 'text-gray-900';
            let iconBgClass = 'bg-gray-50';
            let iconColorClass = getColor(plan.id);
            let btnClass = isPromoPlan 
              ? 'bg-brand-green hover:bg-brand-green-hover text-gray-950 font-bold shadow-md hover:shadow-lg' 
              : 'bg-brand-green hover:bg-brand-green-hover text-gray-950 font-bold shadow-md hover:shadow-lg';
            let btnCurrentClass = 'bg-gray-100 text-gray-400 cursor-default font-medium';
            let checkIconClass = 'text-green-500';
            let borderColorClass = isPromoPlan
              ? 'border-2 border-brand-purple ring-4 ring-brand-purple/20 scale-[1.02] shadow-xl'
              : isCurrentPlan 
                ? 'border-brand-green ring-2 ring-brand-green/10 scale-105 z-10' 
                : 'border-gray-100 hover:border-gray-300';
            let dividerClass = 'border-gray-100';
            let badgeClass = isPromoPlan 
              ? 'bg-brand-purple text-white font-extrabold shadow-md' 
              : 'bg-brand-green text-gray-950 font-bold';

            if (isPromoPlan) {
              cardBgClass = 'bg-gradient-to-b from-[#faf0fc] via-[#fdf7fe] to-white';
              iconBgClass = 'bg-brand-purple/10';
              iconColorClass = 'text-brand-purple';
            }

            if (plan.id === 'resort-pro') {
              cardBgClass = 'bg-brand-green';
              textColorClass = 'text-gray-950';
              descColorClass = 'text-gray-800';
              listColorClass = 'text-gray-800';
              listStrongColorClass = 'text-gray-950';
              iconBgClass = 'bg-white/40';
              iconColorClass = 'text-gray-950';
              btnClass = 'bg-gray-950 text-white hover:bg-black';
              btnCurrentClass = 'bg-gray-200 text-gray-600 cursor-default';
              checkIconClass = 'text-gray-950';
              borderColorClass = isCurrentPlan ? 'border-gray-950 ring-2 ring-brand-green/30 scale-105 z-10' : 'border-transparent hover:border-gray-950/30';
              dividerClass = 'border-gray-950/10';
              badgeClass = 'bg-gray-950 text-white';
            } else if (plan.id === 'resort-elite') {
              cardBgClass = 'bg-purple-600';
              textColorClass = 'text-white';
              descColorClass = 'text-purple-100';
              listColorClass = 'text-purple-100';
              listStrongColorClass = 'text-white';
              iconBgClass = 'bg-white/20';
              iconColorClass = 'text-white';
              btnClass = 'bg-white text-purple-600 hover:bg-gray-50 font-bold';
              btnCurrentClass = 'bg-purple-800 text-purple-200 cursor-default';
              checkIconClass = 'text-white/80';
              borderColorClass = isCurrentPlan ? 'border-white ring-2 ring-purple-600/30 scale-105 z-10' : 'border-transparent hover:border-white/30';
              dividerClass = 'border-white/10';
              badgeClass = 'bg-white text-purple-600';
            }

            return (
              <div 
                key={plan.id}
                className={`relative rounded-2xl shadow-sm border transition-all duration-300 flex flex-col ${cardBgClass} ${borderColorClass} text-sm`}
              >
                {(isCurrentPlan || isPromoPlan || plan.id === 'resort-pro' || plan.id === 'pro') && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full shadow-sm whitespace-nowrap ${badgeClass}`}>
                    {isCurrentPlan 
                      ? 'Plano Atual' 
                      : isPromoPlan 
                        ? (plan.badge || '🚀 Especial Pré-Lançamento') 
                        : 'Mais Popular'}
                  </div>
                )}
                
                <div className={`p-4 sm:p-5 border-b ${dividerClass}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconBgClass} ${iconColorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${textColorClass}`}>{plan.name}</h3>
                  
                  <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
                    <span className={`text-2xl font-extrabold tracking-tight ${textColorClass}`}>
                      {plan.price === 0 ? 'Grátis' : `${plan.price.toLocaleString()} MT`}
                    </span>
                    {plan.originalPrice && plan.originalPrice > plan.price && (
                      <span className="text-xs line-through text-gray-400 font-medium">
                        {plan.originalPrice.toLocaleString()} MT
                      </span>
                    )}
                    {plan.price > 0 && <span className={`text-xs ${descColorClass}`}>/mês</span>}
                  </div>

                  {isPromoPlan && (
                    <div className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded mb-2">
                      Economize 1.000 MT/mês
                    </div>
                  )}

                  <p className={`text-xs leading-relaxed h-10 overflow-hidden line-clamp-2 ${descColorClass}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <ul className="space-y-2.5 mb-6 flex-1">
                    <li className={`flex items-center gap-2 font-semibold ${listStrongColorClass}`}>
                      <Check className={`h-4 w-4 ${checkIconClass}`} />
                      {plan.limit === 999999 ? 'Ilimitados' : `Até ${plan.limit} anúncios`}
                    </li>
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className={`flex items-start gap-2 ${listColorClass}`}>
                        <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${checkIconClass}`} />
                        <span className="text-xs leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrentPlan || isSubscribing === plan.id}
                    className={`w-full h-10 text-sm transition-all ${
                      isCurrentPlan ? btnCurrentClass : btnClass
                    }`}
                  >
                    {isSubscribing === plan.id 
                      ? 'Processando...' 
                      : isCurrentPlan 
                        ? 'Plano Ativo' 
                        : isPromoPlan 
                          ? 'Aproveitar Promoção (500 MT)' 
                          : 'Escolher Plano'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-brand-green/10 rounded-3xl p-8 border border-brand-green/20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dúvidas sobre o Pré-Lançamento ou Planos Customizados?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
            Nossa equipe de suporte e consultores comerciais está disponível para ajudar sua agência ou você corretor independente a ingressar no maior marketplace imobiliário de Moçambique.
          </p>
          <Button 
            variant="outline" 
            className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-bold"
            onClick={() => navigate('/contact')}
          >
            Falar com a Equipa do MeuPlace
          </Button>
        </div>
      </div>
    </div>
  );
}
