import React, { useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, ShieldCheck, User, Search, CheckCircle, XCircle, Trash2, Ban, Star, Edit } from 'lucide-react';
import { FeaturedAgentsAdmin } from '@/components/admin/FeaturedAgentsAdmin';
import { AgentReviewsAdmin } from '@/components/admin/AgentReviewsAdmin';
import { LoadingScreen } from '@/components/LoadingScreen';

export function AdminAgents() {
  const { users, loading, changeUserRole, approveUser, deactivateUser, deleteUser, updateUserRating, toggleResponsibleStatus } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'featured' | 'reviews'>('users');
  
  // Rating edit state
  const [editingRatingUser, setEditingRatingUser] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [reviewsCount, setReviewsCount] = useState<number>(0);

  if (loading) {
    return <LoadingScreen />;
  }

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenRatingEdit = (user: any) => {
    setEditingRatingUser(user);
    setRatingValue(user.rating || 5);
    setReviewsCount(user.reviews || 0);
  };

  const handleSaveRating = async () => {
    if (editingRatingUser) {
      await updateUserRating(editingRatingUser.uid, ratingValue, reviewsCount);
      setEditingRatingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários e Agentes</h1>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Usuários
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'featured' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('featured')}
        >
          Agentes em Destaque
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'reviews' ? 'border-brand-green text-brand-green' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('reviews')}
        >
          Avaliações de Clientes
        </button>
      </div>

      {activeTab === 'users' && (
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
                      <div className="flex flex-col gap-1">
                        {user.isApproved ? (
                          <span className="flex items-center text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" /> Aprovado
                          </span>
                        ) : (
                          <span className="flex items-center text-sm text-yellow-600">
                            <XCircle className="h-4 w-4 mr-1" /> Pendente
                          </span>
                        )}
                        {(user.role === 'agent' || user.role === 'resort') && user.isResponsible && (
                          <span className="flex items-center text-sm text-blue-600">
                            <ShieldCheck className="h-4 w-4 mr-1" /> Responsável
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {(user.role === 'agent' || user.role === 'resort') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={`${user.isResponsible ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                            onClick={() => toggleResponsibleStatus(user.uid, user.isResponsible)}
                            title={user.isResponsible ? "Remover selo de Responsável" : "Marcar como Responsável"}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                        )}
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
                        {user.isApproved && user.role !== 'admin' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                            onClick={() => deactivateUser(user.uid)}
                            title="Desativar Usuário"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        {user.role !== 'admin' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => deleteUser(user.uid)}
                            title="Eliminar Usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {(user.role === 'agent' || user.role === 'resort') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => handleOpenRatingEdit(user)}
                            title="Editar Avaliação"
                          >
                            <Star className="h-4 w-4" />
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
      )}

      {activeTab === 'featured' && (
        <FeaturedAgentsAdmin />
      )}

      {activeTab === 'reviews' && (
        <AgentReviewsAdmin />
      )}

      {/* Rating Edit Modal */}
      <Dialog open={!!editingRatingUser} onOpenChange={(open) => !open && setEditingRatingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Avaliação do Agente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota (Estrelas)</label>
              <Input 
                type="number" 
                min="0" 
                max="5" 
                step="0.1"
                value={ratingValue} 
                onChange={(e) => setRatingValue(parseFloat(e.target.value))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Avaliações</label>
              <Input 
                type="number" 
                min="0" 
                value={reviewsCount} 
                onChange={(e) => setReviewsCount(parseInt(e.target.value))} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRatingUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveRating} className="bg-brand-green hover:bg-brand-green/90 text-white">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
