import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  Building2, 
  LogOut, 
  Menu, 
  X,
  Settings
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Imóveis', path: '/admin/properties', icon: Home },
    { name: 'Agentes', path: '/admin/agents', icon: Users },
    { name: 'Agências Premium', path: '/admin/agencies', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-brand-green p-1.5 rounded-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MeuPlace Admin</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-brand-green/10 text-brand-green' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-green' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2 mb-4">
              <img 
                src={userProfile?.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.displayName || 'Admin'}`} 
                alt="Admin" 
                className="h-10 w-10 rounded-full bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.displayName || 'Administrador'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair do Painel
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm lg:hidden">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-brand-green p-1.5 rounded-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">MeuPlace Admin</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
