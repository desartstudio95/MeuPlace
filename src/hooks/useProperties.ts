import { useState, useEffect, useCallback } from 'react';
import { propertyService } from '@/services/propertyService';
import { Property } from '@/types';
import { useNotifications } from '@/context/NotificationContext';

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const data = await propertyService.getProperties();
      setProperties(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
      addNotification({
        title: 'Erro',
        message: 'Não foi possível carregar os imóveis.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const approveProperty = async (id: string) => {
    try {
      await propertyService.approveProperty(id);
      setProperties(prev => prev.map(p => p.id === id ? { ...p, isApproved: true, status: 'Disponível' } : p));
      addNotification({
        title: 'Sucesso',
        message: 'Imóvel aprovado com sucesso.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error approving property:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível aprovar o imóvel.',
        type: 'error'
      });
    }
  };

  const rejectProperty = async (id: string) => {
    try {
      await propertyService.rejectProperty(id);
      setProperties(prev => prev.map(p => p.id === id ? { ...p, isApproved: false, status: 'Pendente' } : p));
      addNotification({
        title: 'Sucesso',
        message: 'Imóvel rejeitado/desativado com sucesso.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error rejecting property:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível rejeitar o imóvel.',
        type: 'error'
      });
    }
  };

  const deleteProperty = async (id: string) => {
    try {
      await propertyService.deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
      addNotification({
        title: 'Sucesso',
        message: 'Imóvel excluído com sucesso.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting property:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível excluir o imóvel.',
        type: 'error'
      });
    }
  };

  return {
    properties,
    loading,
    error,
    refreshProperties: fetchProperties,
    approveProperty,
    rejectProperty,
    deleteProperty
  };
}
