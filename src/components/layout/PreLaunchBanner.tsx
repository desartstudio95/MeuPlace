import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X, Flame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function PreLaunchBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    const dismissed = sessionStorage.getItem('meuplace_prelaunch_banner_dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('meuplace_prelaunch_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  // Destination based on login status
  const targetUrl = !currentUser 
    ? '/register?role=agent' 
    : userProfile?.role === 'agent' 
      ? '/plans' 
      : '/plans';

  return (
    <div className="relative bg-gradient-to-r from-[#6b1c82] via-[#b357d3] to-[#6b1c82] text-white text-xs sm:text-sm py-2.5 px-4 sm:px-8 border-b border-brand-purple-hover/60 z-50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 justify-center sm:justify-start flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-green text-gray-950 font-extrabold text-[11px] tracking-wide uppercase shadow-sm animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-current" />
            Pré-Lançamento
          </span>

          <p className="text-gray-200 font-medium text-center sm:text-left">
            <span className="font-bold text-white">Atenção Agentes e Corretores:</span> Anuncie os seus imóveis por apenas{' '}
            <span className="text-brand-green font-extrabold underline decoration-brand-green/60 decoration-2">
              500 MT / mês
            </span>{' '}
            nesta fase de estreia!
          </p>

          <Link
            to={targetUrl}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-green hover:text-brand-green-hover transition-colors underline-offset-4 hover:underline ml-1"
          >
            <span>Garantir Vaga</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-md transition-colors flex-shrink-0"
          title="Fechar aviso"
          aria-label="Fechar aviso de pré-lançamento"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
