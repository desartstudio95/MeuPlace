import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home page
  if (location.pathname === '/') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-brand-green hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
    </div>
  );
}
