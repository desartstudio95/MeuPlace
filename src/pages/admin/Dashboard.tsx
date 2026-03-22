import React from 'react';
import { Home, Building2, Users, CheckCircle, Clock } from 'lucide-react';
import { useProperties } from '@/hooks/useProperties';
import { useUsers } from '@/hooks/useUsers';

export function AdminDashboard() {
  const { properties, loading: loadingProps } = useProperties();
  const { users, loading: loadingUsers } = useUsers();

  if (loadingProps || loadingUsers) {
    return <div className="flex justify-center items-center h-full">Carregando...</div>;
  }

  const stats = [
    {
      name: 'Total de Imóveis',
      value: properties.length,
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Imóveis Disponíveis',
      value: properties.filter(p => p.status === 'Disponível').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Imóveis Pendentes',
      value: properties.filter(p => !p.isApproved).length,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Total de Usuários',
      value: users.length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd>
                        <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Atividade Recente</h2>
        <div className="text-sm text-gray-500">
          Nenhuma atividade recente para mostrar.
        </div>
      </div>
    </div>
  );
}
