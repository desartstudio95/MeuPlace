import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, PlusCircle, User, Search, LogOut, Building2, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!currentUser;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img 
                src="https://i.ibb.co/yBVKb9hJ/Logotipo-para-corretora-de-im-veis-preto-e-bege-simples-Website.png" 
                alt="MeuPlace Logo" 
                className="h-14 w-auto object-contain" 
              />
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-brand-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Início
              </Link>
              <Link
                to="/properties"
                className="border-transparent text-gray-500 hover:border-brand-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Imóveis
              </Link>
              <Link
                to="/about"
                className="border-transparent text-gray-500 hover:border-brand-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Sobre
              </Link>
            </div>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center space-x-4">
            <NotificationsPopover />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-gray-700 hidden lg:flex mr-2">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt={userProfile.displayName || 'Avatar'} className="h-8 w-8 rounded-full object-cover mr-2 border border-gray-200" />
                  ) : (
                    <User className="h-8 w-8 rounded-full bg-gray-100 p-1.5 text-gray-500 mr-2" />
                  )}
                  <span>Olá, <span className="font-medium">{userProfile?.displayName || currentUser?.email?.split('@')[0]}</span></span>
                </div>
                {userProfile?.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <Building2 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/my-files">
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Arquivos
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Perfil
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              </Link>
            )}
            
            <Link to="/add-property">
              <Button className="bg-brand-green hover:bg-brand-green-hover text-white">
                <PlusCircle className="h-4 w-4 mr-2" />
                Anunciar Imóvel
              </Button>
            </Link>
          </div>
          <div className="-mr-2 flex items-center md:hidden">
            <NotificationsPopover />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green ml-2"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="bg-brand-green/10 border-brand-green text-brand-green block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Início
            </Link>
            <Link
              to="/properties"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Imóveis
            </Link>
            <Link
              to="/add-property"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Anunciar Imóvel
            </Link>
          </div>
          <div className="pt-4 pb-4 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    {userProfile?.photoURL ? (
                      <img src={userProfile.photoURL} alt={userProfile.displayName || 'Avatar'} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <User className="h-10 w-10 rounded-full bg-gray-100 p-2 text-gray-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{userProfile?.displayName || currentUser?.email?.split('@')[0]}</div>
                    <div className="text-sm font-medium text-gray-500">{currentUser?.email}</div>
                  </div>
                </div>
                <Link
                  to="/dashboard"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  Meu Dashboard
                </Link>
                <div className="px-4">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-red-600" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            ) : (
              <div className="px-4">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full justify-center">
                    <User className="h-4 w-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
