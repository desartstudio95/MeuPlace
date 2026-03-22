import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export function VerifyEmail() {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-brand-green/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-brand-green" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify your email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100 text-center">
          <p className="text-gray-600 mb-6">
            Enviamos um email de verificação para <span className="font-semibold text-gray-900">{email}</span>. Verifique-o e faça login.
          </p>
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md mb-6 border border-amber-200">
            <strong>Atenção:</strong> Após a verificação, o seu cadastro passará por uma análise. Você precisará aguardar a aprovação de um administrador para ter acesso completo à plataforma.
          </p>
          
          <Link to="/login">
            <Button className="w-full bg-brand-green hover:bg-brand-green-hover text-white">
              Ir para o Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
