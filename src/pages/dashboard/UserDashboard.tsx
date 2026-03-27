import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/PropertyCard';
import { Heart, MessageSquare, User, Settings, LogOut, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property } from '@/types';

export function UserDashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the user's favorite properties from Firestore
    // For now, we'll just simulate loading
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        // Simulated fetch
        setTimeout(() => {
          setFavorites([]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const tabs = [
    { id: 'favorites', label: 'Meus Favoritos', icon: Heart },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
    { id: 'profile', label: 'Meu Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center text-xl font-bold text-brand-green">
              {userProfile?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 truncate">{userProfile?.displayName || 'Usuário'}</h2>
              <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-green/10 text-brand-green'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sair da Conta
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meus Favoritos</h1>
                <p className="text-gray-600">Imóveis que você salvou para ver depois.</p>
              </div>
              <Button onClick={() => navigate('/properties')} className="bg-brand-green hover:bg-brand-green/90 text-white">
                <Search className="h-4 w-4 mr-2" />
                Buscar Imóveis
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum favorito ainda</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Você ainda não salvou nenhum imóvel. Navegue pelas nossas opções e clique no coração para salvar seus favoritos aqui.
                </p>
                <Button onClick={() => navigate('/properties')} className="bg-brand-green hover:bg-brand-green/90 text-white">
                  Explorar Imóveis
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
              <p className="text-gray-600">Seu histórico de contato com agentes.</p>
            </div>
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma mensagem</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Você ainda não enviou mensagens para nenhum agente.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-brand-green/10 flex items-center justify-center text-3xl font-bold text-brand-green">
                  {userProfile?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{userProfile?.displayName || 'Usuário'}</h3>
                  <p className="text-gray-600">{currentUser?.email}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/profile')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
