import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PLANS as DEFAULT_PLANS } from '@/constants/plans';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  limit: number;
  description: string;
  features: string[];
  order?: number;
}

export function SubscriptionPlansAdmin() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const q = query(collection(db, 'subscription_plans'), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const fetchedPlans: SubscriptionPlan[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPlans.push({ id: doc.id, ...doc.data() } as SubscriptionPlan);
      });
      
      // se não houver planos, tente buscar sem ordenação
      if (fetchedPlans.length === 0) {
        const fallbackQ = query(collection(db, 'subscription_plans'));
        const fallbackSnapshot = await getDocs(fallbackQ);
        fallbackSnapshot.forEach((doc) => {
          fetchedPlans.push({ id: doc.id, ...doc.data() } as SubscriptionPlan);
        });
        // order naturally by limit
        fetchedPlans.sort((a, b) => a.limit - b.limit);
      }
      
      setPlans(fetchedPlans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      // Se houver erro de index, tentar buscar sem ordenação
      try {
        const q = query(collection(db, 'subscription_plans'));
        const querySnapshot = await getDocs(q);
        const fetchedPlans: SubscriptionPlan[] = [];
        querySnapshot.forEach((doc) => {
          fetchedPlans.push({ id: doc.id, ...doc.data() } as SubscriptionPlan);
        });
        fetchedPlans.sort((a, b) => a.limit - b.limit);
        setPlans(fetchedPlans);
      } catch (err) {
        addNotification({ title: 'Erro', message: 'Não foi possível carregar os planos de assinatura.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (plan: SubscriptionPlan) => {
    try {
      const planRef = doc(db, 'subscription_plans', plan.id);
      await setDoc(planRef, {
        ...plan,
        price: Number(plan.price),
        limit: Number(plan.limit),
        order: plan.order || 0
      });
      setEditingPlan(null);
      fetchPlans();
      addNotification({ title: 'Sucesso', message: 'Plano de assinatura salvo com sucesso.', type: 'success' });
    } catch (error) {
      console.error("Error saving subscription plan:", error);
      addNotification({ title: 'Erro', message: 'Erro ao salvar plano.', type: 'error' });
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este plano de assinatura?")) {
      try {
        await deleteDoc(doc(db, 'subscription_plans', id));
        fetchPlans();
        addNotification({ title: 'Sucesso', message: 'Plano excluído com sucesso.', type: 'success' });
      } catch (error) {
        console.error("Error deleting plan:", error);
        addNotification({ title: 'Erro', message: 'Erro ao excluir plano.', type: 'error' });
      }
    }
  };

  const handleAddFeature = (feature: string) => {
    if (editingPlan && feature.trim()) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, feature.trim()]
      });
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (editingPlan) {
      const newFeatures = [...editingPlan.features];
      newFeatures.splice(index, 1);
      setEditingPlan({
        ...editingPlan,
        features: newFeatures
      });
    }
  };

  const handleSeedDefaultPlans = async () => {
    try {
      setLoading(true);
      const plansWithOrder = DEFAULT_PLANS.map((plan, index) => ({
        ...plan,
        order: index
      }));
      
      for (const plan of plansWithOrder) {
        await setDoc(doc(db, 'subscription_plans', plan.id), plan);
      }
      await fetchPlans();
      addNotification({ title: 'Sucesso', message: 'Planos de assinatura padrão carregados com sucesso.', type: 'success' });
    } catch (error) {
      console.error("Error seeding subscription plans:", error);
      addNotification({ title: 'Erro', message: 'Erro ao criar planos padrão.', type: 'error' });
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Planos de Assinatura (Publicação de Imóveis)</h2>
        <div className="flex gap-2">
          {plans.length === 0 && (
            <Button variant="outline" onClick={handleSeedDefaultPlans}>
              Carregar Planos Padrão
            </Button>
          )}
          <Button onClick={() => setEditingPlan({
            id: `plan-${Date.now()}`,
            name: '',
            description: '',
            price: 0,
            limit: 5,
            features: [],
            order: plans.length
          })}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      {editingPlan && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Editar Plano de Assinatura</h3>
            <button onClick={() => setEditingPlan(null)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID do Plano</label>
              <input 
                type="text" 
                value={editingPlan.id} 
                onChange={(e) => setEditingPlan({...editingPlan, id: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={plans.some(p => p.id === editingPlan.id) && !editingPlan.id.startsWith('plan-')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano</label>
              <input 
                type="text" 
                value={editingPlan.name} 
                onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea 
                value={editingPlan.description} 
                onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (MT)</label>
              <input 
                type="number" 
                value={editingPlan.price} 
                onChange={(e) => setEditingPlan({...editingPlan, price: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Anúncios (use 999999 para Ilimitado)</label>
              <input 
                type="number" 
                value={editingPlan.limit} 
                onChange={(e) => setEditingPlan({...editingPlan, limit: parseInt(e.target.value) || 0})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de Exibição (0, 1, 2...)</label>
              <input 
                type="number" 
                value={editingPlan.order || 0} 
                onChange={(e) => setEditingPlan({...editingPlan, order: parseInt(e.target.value) || 0})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recursos (Features)</label>
            <ul className="space-y-2 mb-2">
              {editingPlan.features.map((feature, idx) => (
                <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                  <span>{feature}</span>
                  <button onClick={() => handleRemoveFeature(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input 
                type="text" 
                id="newSubFeature"
                placeholder="Novo recurso..."
                className="flex-1 p-2 border border-gray-300 rounded-md"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button type="button" onClick={() => {
                const input = document.getElementById('newSubFeature') as HTMLInputElement;
                handleAddFeature(input.value);
                input.value = '';
              }}>Adicionar</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
            <Button onClick={() => handleSavePlan(editingPlan)}>Salvar Plano</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.price === 0 ? 'Grátis' : `${plan.price} MT`} / mês</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingPlan(plan)} className="text-blue-500 hover:text-blue-700">
                  <Edit2 className="h-5 w-5" />
                </button>
                <button onClick={() => handleDeletePlan(plan.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4 flex-1">{plan.description}</p>
            <div className="text-sm text-gray-500 mb-2">
              <strong>Limite:</strong> {plan.limit === 999999 ? 'Ilimitado' : plan.limit} anúncios
            </div>
            <div className="text-sm text-gray-500 mb-2">
              <strong>Ordem:</strong> {plan.order}
            </div>
            <div className="text-sm text-gray-500">
              <strong>Recursos:</strong> {plan.features.length}
            </div>
          </div>
        ))}
        {plans.length === 0 && !editingPlan && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum plano cadastrado. Clique em "Novo Plano" ou "Carregar Planos Padrão".
          </div>
        )}
      </div>
    </div>
  );
}
