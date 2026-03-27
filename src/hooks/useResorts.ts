import { useState, useEffect } from 'react';
import { Resort } from '@/types';
import { resortService } from '@/services/resortService';
import { useNotifications } from '@/context/NotificationContext';

export function useResorts() {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchResorts();
  }, []);

  const fetchResorts = async () => {
    setLoading(true);
    try {
      const data = await resortService.getResorts();
      setResorts(data);
    } catch (error) {
      console.error('Error fetching resorts:', error);
      addNotification({ title: 'Erro', message: 'Falha ao buscar resorts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const createResort = async (resortData: Omit<Resort, 'id'>) => {
    try {
      const id = await resortService.createResort(resortData);
      setResorts(prev => [{ ...resortData, id }, ...prev]);
      addNotification({ title: 'Sucesso', message: 'Resort criado com sucesso', type: 'success' });
      return id;
    } catch (error) {
      console.error('Error creating resort:', error);
      addNotification({ title: 'Erro', message: 'Falha ao criar resort', type: 'error' });
      throw error;
    }
  };

  const updateResort = async (id: string, resortData: Partial<Resort>) => {
    try {
      await resortService.updateResort(id, resortData);
      setResorts(prev => prev.map(r => r.id === id ? { ...r, ...resortData } : r));
      addNotification({ title: 'Sucesso', message: 'Resort atualizado com sucesso', type: 'success' });
    } catch (error) {
      console.error('Error updating resort:', error);
      addNotification({ title: 'Erro', message: 'Falha ao atualizar resort', type: 'error' });
      throw error;
    }
  };

  const deleteResort = async (id: string) => {
    try {
      await resortService.deleteResort(id);
      setResorts(prev => prev.filter(r => r.id !== id));
      addNotification({ title: 'Sucesso', message: 'Resort excluído com sucesso', type: 'success' });
    } catch (error) {
      console.error('Error deleting resort:', error);
      addNotification({ title: 'Erro', message: 'Falha ao excluir resort', type: 'error' });
      throw error;
    }
  };

  return {
    resorts,
    loading,
    fetchResorts,
    createResort,
    updateResort,
    deleteResort
  };
}
