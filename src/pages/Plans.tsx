import React, { useState, useEffect } from 'react';
import { Check, Star, Building2, User, Hotel, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const iconMap: Record<string, any> = {
  Star,
  Building2,
  User,
  Hotel,
  CreditCard
};

export function Plans() {
  const { userProfile, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'plans'));
        const fetchedPlans: any[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPlans.push({ id: doc.id, ...doc.data() });
        });
        setPlans(fetchedPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando planos...</div>;
  }

  // Restrict access to agents, resorts, and admins
  const allowedRoles = ['admin', 'agent', 'resort'];
  if (!userProfile || !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  const filteredPlans = plans.filter(plan => {
    if (userProfile.role === 'admin') return true;
    if (plan.targetAudience === 'all') return true;
    if (userProfile.role === 'resort' && plan.targetAudience === 'resort') return true;
    if (userProfile.role === 'agent' && (plan.targetAudience === 'agent' || plan.targetAudience === 'agency')) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Planos de Promoção</h1>
          <p className="text-xl text-gray-600">
            Aumente sua visibilidade e alcance mais clientes com nossos pacotes de promoção exclusivos.
          </p>
        </div>

        {filteredPlans.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            Nenhum plano disponível no momento para o seu perfil.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {filteredPlans.map((plan) => {
              const Icon = iconMap[plan.iconName] || Star;
              return (
                <div 
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-sm border ${plan.popular ? 'border-brand-green shadow-md' : 'border-gray-200'} overflow-hidden flex flex-col`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-green"></div>
                  )}
                  
                  <div className={`p-8 ${plan.color}`}>
                    {plan.popular && (
                      <span className="inline-block px-3 py-1 bg-brand-green text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                        Mais Popular
                      </span>
                    )}
                    <Icon className={`h-10 w-10 ${plan.iconColor} mb-4`} />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6 min-h-[48px]">{plan.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    </div>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.features?.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className={`h-5 w-5 ${plan.iconColor} flex-shrink-0`} />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.paymentUrl ? (
                      <a href={plan.paymentUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button className={`w-full ${plan.buttonColor} text-white`}>
                          Assinar Agora
                        </Button>
                      </a>
                    ) : (
                      <Link to="/contact" className="block w-full">
                        <Button className={`w-full ${plan.buttonColor} text-white`}>
                          Assinar Agora
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
