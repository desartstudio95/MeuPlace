import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/LoadingScreen';

export function AdminLogin() {
  const { login, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async () => {
    try {
      setIsLoading(true);
      await login();
      
      // The ProtectedRoute will handle the actual role check when navigating to /admin
      // But we can do a quick check here to show a specific message
      toast.success('Login efetuado com sucesso', {
        description: 'Verificando permissões de administrador...'
      });
      
      navigate('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      let errorMessage = 'Não foi possível autenticar.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'O login foi cancelado. Por favor, tente novamente.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'O pop-up de login foi bloqueado pelo navegador. Por favor, permita pop-ups para este site.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Este domínio não está autorizado no Firebase. Contate o suporte.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Erro no login', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If already logged in and is admin, redirect immediately
  React.useEffect(() => {
    if (currentUser && userProfile?.role === 'admin') {
      navigate('/admin');
    }
  }, [currentUser, userProfile, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-gray-800 p-4 rounded-full shadow-lg border border-gray-700">
            <Shield className="h-12 w-12 text-brand-green" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Acesso Restrito
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Área exclusiva para administradores do sistema
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-2 text-gray-300 mb-6">
              <Lock className="h-5 w-5" />
              <span>Autenticação Segura Necessária</span>
            </div>

            <Button
              onClick={handleAdminLogin}
              disabled={isLoading}
              className="w-full flex justify-center py-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-gray-900 bg-brand-green hover:bg-brand-green-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green focus:ring-offset-gray-900 transition-colors"
            >
              {isLoading ? 'Autenticando...' : 'Entrar como Administrador'}
            </Button>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">
                    Acesso não autorizado é monitorado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
