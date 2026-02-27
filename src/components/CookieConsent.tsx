import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg border-t border-gray-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-300 text-center sm:text-left">
          Utilizamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa{' '}
          <a href="/privacy" className="text-brand-green hover:underline">Política de Privacidade</a>.
        </p>
        <Button 
          onClick={handleAccept}
          className="bg-brand-green hover:bg-brand-green-hover text-white whitespace-nowrap"
        >
          Aceitar Cookies
        </Button>
      </div>
    </div>
  );
}
