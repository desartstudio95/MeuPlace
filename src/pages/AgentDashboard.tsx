import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertyCard } from '@/components/PropertyCard';
import { PROPERTIES } from '@/data/mockData';
import { 
  LayoutDashboard, 
  Home, 
  User, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MessageSquare, 
  TrendingUp,
  Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AgentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mock data for the dashboard
  const myProperties = PROPERTIES.slice(0, 3); // Simulate user's properties
  const stats = [
    { label: 'Imóveis Ativos', value: myProperties.length, icon: Home, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Visualizações Totais', value: '1,234', icon: Eye, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Leads (Mensagens)', value: '15', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Taxa de Conversão', value: '2.4%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const [profileData, setProfileData] = useState({
    name: user?.name || 'Agente Imobiliário',
    email: user?.email || 'agente@meuplace.co.mz',
    phone: '+258 84 123 4567',
    whatsapp: '+258 84 123 4567',
    bio: 'Especialista em imóveis de luxo na cidade de Maputo com mais de 5 anos de experiência.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Perfil atualizado com sucesso!');
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este imóvel?')) {
      alert(`Imóvel ${id} excluído (simulação).`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold">
              {profileData.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 truncate max-w-[140px]">{profileData.name}</h2>
              <p className="text-xs text-gray-500">Agente Verificado</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'properties' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Home className="mr-3 h-5 w-5" />
              Meus Imóveis
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-brand-green/10 text-brand-green' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User className="mr-3 h-5 w-5" />
              Meu Perfil
            </button>
          </nav>
        </div>
        
        <div className="p-4 mt-auto">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
              <p className="text-gray-500">Bem-vindo de volta, {profileData.name}.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                    <div className={`p-3 rounded-full ${stat.bg} mr-4`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity or Quick Actions could go here */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Imóveis Recentes</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('properties')}>Ver Todos</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProperties.map(property => (
                  <div key={property.id} className="relative group">
                    <PropertyCard property={property} />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/edit-property/${property.id}`}>
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white shadow-sm hover:bg-gray-100">
                          <Edit className="h-4 w-4 text-gray-700" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Meus Imóveis</h1>
                <p className="text-gray-500">Gerencie seus anúncios publicados.</p>
              </div>
              <Link to="/add-property">
                <Button className="bg-brand-green hover:bg-brand-green-hover">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Imóvel
                </Button>
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imóvel</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img className="h-10 w-10 rounded-md object-cover" src={property.images[0]} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{property.title}</div>
                              <div className="text-sm text-gray-500">{property.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{property.currency} {property.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Ativo
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Link to={`/edit-property/${property.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                              onClick={() => handleDeleteProperty(property.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-gray-500">Gerencie suas informações pessoais e de contato.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b border-gray-100">
                  <div className="relative group">
                    <img 
                      src={profileData.avatar} 
                      alt="Profile" 
                      className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-medium text-gray-900">Foto de Perfil</h3>
                    <p className="text-sm text-gray-500 mb-3">JPG, GIF ou PNG. Max 1MB.</p>
                    <Button type="button" variant="outline" size="sm">Alterar Foto</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <Input 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input 
                      type="email" 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <Input 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <Input 
                      value={profileData.whatsapp} 
                      onChange={(e) => setProfileData({...profileData, whatsapp: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Sobre Mim</label>
                  <textarea 
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="bg-brand-green hover:bg-brand-green-hover">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
