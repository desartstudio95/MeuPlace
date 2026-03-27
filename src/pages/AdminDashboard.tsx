import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { User, Shield, ShieldCheck, Trash2, Home, CheckCircle, XCircle, Building2, CreditCard } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { Property } from '@/types';
import { PremiumAgenciesAdmin } from '@/components/admin/PremiumAgenciesAdmin';
import { PlansAdmin } from '@/components/admin/PlansAdmin';

export function AdminDashboard() {
  const { userProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'properties' | 'agencies' | 'plans'>('users');

  useEffect(() => {
    fetchUsers();
    fetchProperties();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push(doc.data() as UserProfile);
      });
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível carregar os usuários.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const q = query(collection(db, 'properties'));
      const querySnapshot = await getDocs(q);
      const fetchedProperties: Property[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProperties.push({ id: doc.id, ...doc.data() } as Property);
      });
      setProperties(fetchedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const handleApproveUser = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { isApproved: true });
      setUsers(users.map(u => u.uid === uid ? { ...u, isApproved: true } : u));
      addNotification({
        title: 'Sucesso',
        message: 'Usuário aprovado com sucesso.',
        type: 'success'
      });
    } catch (error) {
      console.error("Error approving user:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível aprovar o usuário.',
        type: 'error'
      });
    }
  };

  const handleApproveProperty = async (propertyId: string) => {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, { isApproved: true });
      setProperties(properties.map(p => p.id === propertyId ? { ...p, isApproved: true } : p));
      addNotification({
        title: 'Sucesso',
        message: 'Imóvel aprovado com sucesso.',
        type: 'success'
      });
    } catch (error) {
      console.error("Error approving property:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível aprovar o imóvel.',
        type: 'error'
      });
    }
  };

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'agent' | 'user') => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole });
      
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      
      addNotification({
        title: 'Sucesso',
        message: `Papel do usuário atualizado para ${newRole}.`,
        type: 'success'
      });
    } catch (error) {
      console.error("Error updating role:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível atualizar o papel do usuário.',
        type: 'error'
      });
    }
  };

  const handlePromoteProperty = async (propertyId: string) => {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, { isPromoted: true, isApproved: true, requestedPackage: deleteField() });
      setProperties(properties.map(p => p.id === propertyId ? { ...p, isPromoted: true, isApproved: true, requestedPackage: undefined } : p));
      addNotification({
        title: 'Sucesso',
        message: 'Imóvel promovido com sucesso.',
        type: 'success'
      });
    } catch (error) {
      console.error("Error promoting property:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível promover o imóvel.',
        type: 'error'
      });
    }
  };

  const handleRejectPromotion = async (propertyId: string) => {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, { requestedPackage: deleteField() });
      setProperties(properties.map(p => p.id === propertyId ? { ...p, requestedPackage: undefined } : p));
      addNotification({
        title: 'Sucesso',
        message: 'Solicitação de promoção rejeitada.',
        type: 'success'
      });
    } catch (error) {
      console.error("Error rejecting promotion:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível rejeitar a promoção.',
        type: 'error'
      });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      setProperties(properties.filter(p => p.id !== propertyId));
      addNotification({
        title: 'Sucesso',
        message: 'Imóvel excluído com sucesso.',
        type: 'success'
      });
    } catch (error) {
      console.error("Error deleting property:", error);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível excluir o imóvel.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando painel admin...</div>;
  }

  if (userProfile?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Acesso negado.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gerencie usuários, permissões e configurações do sistema.
        </p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          className={`pb-4 px-2 text-sm font-medium border-b-2 ${
            activeTab === 'users'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('users')}
        >
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Usuários
          </div>
        </button>
        <button
          className={`pb-4 px-2 text-sm font-medium border-b-2 ${
            activeTab === 'properties'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('properties')}
        >
          <div className="flex items-center">
            <Home className="w-4 h-4 mr-2" />
            Imóveis
          </div>
        </button>
        <button
          className={`pb-4 px-2 text-sm font-medium border-b-2 ${
            activeTab === 'agencies'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('agencies')}
        >
          <div className="flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            Agências Premium
          </div>
        </button>
        <button
          className={`pb-4 px-2 text-sm font-medium border-b-2 ${
            activeTab === 'plans'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('plans')}
        >
          <div className="flex items-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Planos
          </div>
        </button>
      </div>

      {activeTab === 'plans' && (
        <PlansAdmin />
      )}

      {activeTab === 'users' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.uid}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {user.photoURL ? (
                        <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.displayName || 'Sem nome'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'agent' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    
                    {user.uid !== userProfile.uid && (
                      <div className="flex space-x-2">
                        {!user.isApproved && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleApproveUser(user.uid)}
                            title="Aprovar Usuário"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {user.role !== 'admin' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRoleChange(user.uid, 'admin')}
                            title="Tornar Admin"
                          >
                            <ShieldCheck className="h-4 w-4 text-purple-600" />
                          </Button>
                        )}
                        {user.role !== 'agent' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRoleChange(user.uid, 'agent')}
                            title="Tornar Agente"
                          >
                            <User className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {user.role !== 'user' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRoleChange(user.uid, 'user')}
                            title="Tornar Usuário Comum"
                          >
                            <User className="h-4 w-4 text-gray-600" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {properties.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum imóvel encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ainda não existem imóveis cadastrados no sistema.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {properties.map((property) => (
                <li key={property.id}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                        <img className="h-full w-full object-cover" src={property.images[0] || 'https://via.placeholder.com/150'} alt={property.title} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{property.title}</div>
                        <div className="text-sm text-gray-500">{property.location} • {property.price.toLocaleString()} {property.currency}</div>
                        <div className="text-xs text-gray-400 mt-1">Por: {property.agent?.name || 'Desconhecido'}</div>
                        {property.requestedPackage && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                              Solicitação: {property.requestedPackage}
                            </span>
                            <Button size="sm" variant="outline" className="h-6 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => handlePromoteProperty(property.id)}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 text-xs bg-red-50 text-red-700 hover:bg-red-100 border-red-200" onClick={() => handleRejectPromotion(property.id)}>
                              Rejeitar
                            </Button>
                          </div>
                        )}
                        {property.isPromoted && !property.requestedPackage && (
                          <div className="mt-2">
                            <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                              Promovido
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        property.status === 'Disponível' ? 'bg-green-100 text-green-800' :
                        property.status === 'Vendido' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {property.status || 'Disponível'}
                      </span>
                      {!property.isApproved && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleApproveProperty(property.id)}
                          title="Aprovar Imóvel"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => handleDeleteProperty(property.id)}
                        title="Excluir Imóvel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'agencies' && (
        <PremiumAgenciesAdmin />
      )}
    </div>
  );
}

