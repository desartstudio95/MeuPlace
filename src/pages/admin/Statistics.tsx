import React, { useState, useEffect } from 'react';
import { collection, getDocsFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingScreen } from '@/components/LoadingScreen';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Building2, Users, Eye, TrendingUp } from 'lucide-react';

export function AdminStatistics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalViews: 0,
    propertiesByCategory: [] as any[],
    propertiesByType: [] as any[],
    recentActivity: [] as any[]
  });

  const COLORS = ['#cb6ce6', '#72e331', '#3B82F6', '#FFBB28', '#FF8042'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch properties
        const propertiesPath = 'properties';
        let properties: any[] = [];
        try {
          const propertiesSnapshot = await getDocsFromServer(collection(db, propertiesPath));
          properties = propertiesSnapshot.docs.map(doc => doc.data());
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, propertiesPath);
        }
        
        // Fetch users
        const usersPath = 'users';
        let users: any[] = [];
        try {
          const usersSnapshot = await getDocsFromServer(collection(db, usersPath));
          users = usersSnapshot.docs.map(doc => doc.data());
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, usersPath);
        }

        // Calculate Category Stats
        const categoryCount: Record<string, number> = {};
        properties.forEach(p => {
          categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        });
        const propertiesByCategory = Object.keys(categoryCount).map(key => ({
          name: key,
          value: categoryCount[key]
        }));

        // Calculate Type Stats (Venda vs Arrendamento)
        const typeCount: Record<string, number> = {};
        properties.forEach(p => {
          typeCount[p.type] = (typeCount[p.type] || 0) + 1;
        });
        const propertiesByType = Object.keys(typeCount).map(key => ({
          name: key,
          value: typeCount[key]
        }));

        // Calculate Views
        const totalViews = properties.reduce((acc, p) => acc + (p.views || 0), 0);

        // Mock recent activity (properties added per month)
        const recentActivity = [
          { name: 'Jan', properties: 12 },
          { name: 'Fev', properties: 19 },
          { name: 'Mar', properties: 15 },
          { name: 'Abr', properties: 22 },
          { name: 'Mai', properties: 28 },
          { name: 'Jun', properties: properties.length }
        ];

        setStats({
          totalProperties: properties.length,
          totalUsers: users.length,
          totalViews,
          propertiesByCategory,
          propertiesByType,
          recentActivity
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Estatísticas e Relatórios</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total de Imóveis</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalProperties}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Usuários Registados</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Visualizações Totais</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalViews}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
            <h3 className="text-2xl font-bold text-gray-900">4.2%</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties Added Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Imóveis Adicionados (Últimos 6 meses)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line type="monotone" dataKey="properties" stroke="#72e331" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Properties by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Imóveis por Categoria</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.propertiesByCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" fill="#cb6ce6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Properties by Type (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição por Tipo</h3>
          <div className="h-80 flex items-center justify-center">
            {stats.propertiesByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.propertiesByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.propertiesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-500">Sem dados suficientes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
