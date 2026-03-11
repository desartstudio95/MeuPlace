import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on home page
  if (location.pathname === '/') return null;

  const handleBack = () => {
    // Check if there is a history stack to go back to within the app
    // window.history.state.idx > 0 implies we've navigated within the app
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Fallback logic for direct access or empty history
      const path = location.pathname;
      if (path.includes('/properties/') && path !== '/properties') {
        navigate('/properties');
      } else if (path.includes('/dashboard') || path.includes('/add-property')) {
        navigate('/');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-40 flex justify-start">
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="flex items-center text-gray-600 hover:text-brand-green hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>
    </div>
  );
}
