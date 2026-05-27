import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property } from '@/types';
import { toast } from 'sonner';

interface CompareContextType {
  propertiesToCompare: Property[];
  addToCompare: (property: Property) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  isComparing: (propertyId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [propertiesToCompare, setPropertiesToCompare] = useState<Property[]>([]);

  // Load from session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('compareProps');
      if (stored) {
        setPropertiesToCompare(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save to session storage when changes occur
  useEffect(() => {
    sessionStorage.setItem('compareProps', JSON.stringify(propertiesToCompare));
  }, [propertiesToCompare]);

  const addToCompare = (property: Property) => {
    if (propertiesToCompare.length >= 4) {
      toast.error('Pode comparar no máximo 4 imóveis de cada vez.');
      return;
    }
    
    if (!propertiesToCompare.some(p => p.id === property.id)) {
      setPropertiesToCompare(prev => [...prev, property]);
      toast.success('Imóvel adicionado à comparação.');
    }
  };

  const removeFromCompare = (propertyId: string) => {
    setPropertiesToCompare(prev => prev.filter(p => p.id !== propertyId));
    toast.info('Imóvel removido da comparação.');
  };

  const clearCompare = () => {
    setPropertiesToCompare([]);
  };

  const isComparing = (propertyId: string) => {
    return propertiesToCompare.some(p => p.id === propertyId);
  };

  return (
    <CompareContext.Provider value={{
      propertiesToCompare,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isComparing
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
