import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle } from 'lucide-react';

export function PendingApproval() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro em Análise</h2>
          <p className="text-gray-600 mb-6">
            O seu cadastro foi recebido e está sendo analisado pela nossa equipe. 
            Você receberá um email assim que sua conta for aprovada para começar a anunciar imóveis.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-md text-left mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">O que acontece agora?</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Verificação de documentos (CRECI/Licença)</li>
              <li>Validação de identidade</li>
              <li>Aprovação em até 24 horas úteis</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link to="/">
              <Button variant="outline" className="w-full">
                Voltar para a Página Inicial
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" className="w-full text-sm text-gray-500">
                Precisa de ajuda? Entre em contato
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
