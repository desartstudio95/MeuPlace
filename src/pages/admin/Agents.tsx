import React, { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, User, Search, CheckCircle, XCircle } from 'lucide-react';

export function AdminAgents() {
  const { users, loading, changeUserRole, approveUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return <div className="flex justify-center items-center h-full">Carregando...</div>;
  }

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários e Agentes</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative rounded-md shadow-sm max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="focus:ring-brand-green focus:border-brand-green block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Papel
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img 
                          className="h-10 w-10 rounded-full object-cover" 
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
                          alt="" 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.displayName || 'Usuário Sem Nome'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        user.role === 'agent' ? 'bg-blue-100 text-blue-800' : 
                        user.role === 'resort' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {user.role === 'admin' ? 'Administrador' : user.role === 'agent' ? 'Agente' : user.role === 'resort' ? 'Resort/Hotel' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isApproved ? (
                      <span className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Aprovado
                      </span>
                    ) : (
                      <span className="flex items-center text-sm text-yellow-600">
                        <XCircle className="h-4 w-4 mr-1" /> Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {!user.isApproved && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => approveUser(user.uid)}
                          title="Aprovar Usuário"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {user.role !== 'admin' && (
                        <select
                          className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-green focus:border-brand-green p-1 border"
                          value={user.role}
                          onChange={(e) => changeUserRole(user.uid, e.target.value as 'admin' | 'agent' | 'user' | 'resort')}
                        >
                          <option value="user">Usuário</option>
                          <option value="agent">Agente</option>
                          <option value="resort">Resort/Hotel</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
