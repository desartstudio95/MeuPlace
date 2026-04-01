import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/context/NotificationContext';
import { Plus, Trash2, Save, Edit2, X } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  popular: boolean;
  color: string;
  buttonColor: string;
  iconColor: string;
  iconName: string;
  targetAudience: 'agent' | 'agency' | 'resort' | 'all';
  paymentUrl?: string;
}

export function PlansAdmin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const q = query(collection(db, 'plans'));
      const querySnapshot = await getDocs(q);
      const fetchedPlans: Plan[] = [];
      querySnapshot.forEach((doc) => {
        fetchedPlans.push({ id: doc.id, ...doc.data() } as Plan);
      });
      setPlans(fetchedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      addNotification({ title: 'Erro', message: 'Não foi possível carregar os planos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (plan: Plan) => {
    try {
      const planRef = doc(db, 'plans', plan.id);
      await setDoc(planRef, plan);
      setEditingPlan(null);
      fetchPlans();
      addNotification({ title: 'Sucesso', message: 'Plano salvo com sucesso.', type: 'success' });
    } catch (error) {
      console.error("Error saving plan:", error);
      addNotification({ title: 'Erro', message: 'Erro ao salvar plano.', type: 'error' });
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este plano?")) {
      try {
        await deleteDoc(doc(db, 'plans', id));
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
    const defaultPlans = [
      {
        id: 'promote-property',
        name: 'Promover Imóvel',
        description: 'Destaque seu imóvel nas primeiras posições das buscas e na página inicial.',
        price: '1.500 MZN',
        period: 'por mês/imóvel',
        features: [
          'Destaque na página inicial',
          'Aparece no topo das buscas',
          'Selo de "Imóvel em Destaque"',
          'Maior visibilidade para clientes',
          'Suporte prioritário'
        ],
        popular: false,
        color: 'bg-white',
        buttonColor: 'bg-gray-900 hover:bg-gray-800',
        iconColor: 'text-gray-900',
        iconName: 'Star',
        targetAudience: 'agent' as const,
        paymentUrl: ''
      },
      {
        id: 'promote-agent',
        name: 'Promover Agente',
        description: 'Aumente sua visibilidade como agente e receba mais leads diretamente.',
        price: '3.000 MZN',
        period: 'por mês',
        features: [
          'Perfil em destaque na seção de agentes',
          'Selo de "Agente Premium"',
          'Prioridade nas recomendações',
          'Estatísticas avançadas de perfil',
          'Suporte dedicado'
        ],
        popular: true,
        color: 'bg-purple-100',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
        iconColor: 'text-purple-600',
        iconName: 'User',
        targetAudience: 'agent' as const,
        paymentUrl: ''
      },
      {
        id: 'promote-agency',
        name: 'Promover Agência',
        description: 'Destaque sua agência imobiliária e todos os seus agentes associados.',
        price: '8.500 MZN',
        period: 'por mês',
        features: [
          'Logo em destaque na página inicial',
          'Página exclusiva da agência',
          'Destaque para todos os agentes',
          'Painel administrativo avançado',
          'Gerente de conta dedicado'
        ],
        popular: false,
        color: 'bg-brand-green/10',
        buttonColor: 'bg-brand-green hover:bg-brand-green-hover',
        iconColor: 'text-brand-green',
        iconName: 'Building2',
        targetAudience: 'agency' as const,
        paymentUrl: ''
      },
      {
        id: 'promote-resort',
        name: 'Promover Resort/Hotel',
        description: 'Destaque seu resort ou hotel para atrair mais hóspedes.',
        price: '12.000 MZN',
        period: 'por mês',
        features: [
          'Destaque na seção de Resorts',
          'Página exclusiva do Resort',
          'Destaque para todas as acomodações',
          'Sistema de reservas integrado',
          'Suporte prioritário 24/7'
        ],
        popular: false,
        color: 'bg-blue-50',
        buttonColor: 'bg-blue-600 hover:bg-blue-700',
        iconColor: 'text-blue-600',
        iconName: 'Hotel',
        targetAudience: 'resort' as const,
        paymentUrl: ''
      }
    ];

    try {
      setLoading(true);
      for (const plan of defaultPlans) {
        await setDoc(doc(db, 'plans', plan.id), plan);
      }
      await fetchPlans();
      addNotification({ title: 'Sucesso', message: 'Planos padrão criados com sucesso.', type: 'success' });
    } catch (error) {
      console.error("Error seeding plans:", error);
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
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Planos</h2>
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
            price: '',
            period: 'por mês',
            features: [],
            popular: false,
            color: 'bg-white',
            buttonColor: 'bg-brand-green hover:bg-brand-green-hover',
            iconColor: 'text-brand-green',
            iconName: 'Star',
            targetAudience: 'all',
            paymentUrl: ''
          })}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </div>

      {editingPlan && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Editar Plano</h3>
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
                disabled={plans.some(p => p.id === editingPlan.id)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (ex: 1.500 MZN)</label>
              <input 
                type="text" 
                value={editingPlan.price} 
                onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período (ex: por mês)</label>
              <input 
                type="text" 
                value={editingPlan.period} 
                onChange={(e) => setEditingPlan({...editingPlan, period: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Público Alvo</label>
              <select 
                value={editingPlan.targetAudience} 
                onChange={(e) => setEditingPlan({...editingPlan, targetAudience: e.target.value as any})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value="agent">Agentes</option>
                <option value="agency">Agências</option>
                <option value="resort">Hotéis e Resorts</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link de Pagamento (Opcional)</label>
              <input 
                type="url" 
                value={editingPlan.paymentUrl || ''} 
                onChange={(e) => setEditingPlan({...editingPlan, paymentUrl: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="https://pay.stripe.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ícone (Nome Lucide)</label>
              <input 
                type="text" 
                value={editingPlan.iconName} 
                onChange={(e) => setEditingPlan({...editingPlan, iconName: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Star, User, Building2, Hotel..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Link de Pagamento (Opcional)</label>
              <input 
                type="url" 
                value={editingPlan.paymentUrl || ''} 
                onChange={(e) => setEditingPlan({...editingPlan, paymentUrl: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="https://link-de-pagamento.com/..."
              />
            </div>
            <div className="flex items-center mt-6">
              <input 
                type="checkbox" 
                id="popular"
                checked={editingPlan.popular} 
                onChange={(e) => setEditingPlan({...editingPlan, popular: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="popular" className="text-sm font-medium text-gray-700">Plano Popular (Destaque)</label>
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
                id="newFeature"
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
                const input = document.getElementById('newFeature') as HTMLInputElement;
                handleAddFeature(input.value);
                input.value = '';
              }}>Adicionar</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Fundo (Tailwind)</label>
              <input 
                type="text" 
                value={editingPlan.color} 
                onChange={(e) => setEditingPlan({...editingPlan, color: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Botão (Tailwind)</label>
              <input 
                type="text" 
                value={editingPlan.buttonColor} 
                onChange={(e) => setEditingPlan({...editingPlan, buttonColor: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Ícone (Tailwind)</label>
              <input 
                type="text" 
                value={editingPlan.iconColor} 
                onChange={(e) => setEditingPlan({...editingPlan, iconColor: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
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
                <p className="text-sm text-gray-500">{plan.price} {plan.period}</p>
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
              <strong>Público:</strong> {plan.targetAudience === 'all' ? 'Todos' : plan.targetAudience === 'agent' ? 'Agentes' : plan.targetAudience === 'agency' ? 'Agências' : 'Hotéis/Resorts'}
            </div>
            <div className="text-sm text-gray-500">
              <strong>Recursos:</strong> {plan.features.length}
            </div>
          </div>
        ))}
        {plans.length === 0 && !editingPlan && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum plano cadastrado. Clique em "Novo Plano" para adicionar.
          </div>
        )}
      </div>
    </div>
  );
}
