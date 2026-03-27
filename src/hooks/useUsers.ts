import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';
import { UserProfile } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      addNotification({
        title: 'Erro',
        message: 'Não foi possível carregar os usuários.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const changeUserRole = async (uid: string, role: 'admin' | 'agent' | 'user' | 'resort') => {
    try {
      await authService.updateUserRole(uid, role);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
      addNotification({
        title: 'Sucesso',
        message: `Papel do usuário atualizado para ${role}.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating user role:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível atualizar o papel do usuário.',
        type: 'error'
      });
    }
  };

  const approveUser = async (uid: string) => {
    try {
      await authService.approveUser(uid);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isApproved: true } : u));
      addNotification({
        title: 'Sucesso',
        message: 'Usuário aprovado com sucesso.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error approving user:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível aprovar o usuário.',
        type: 'error'
      });
    }
  };

  const deactivateUser = async (uid: string) => {
    try {
      await authService.deactivateUser(uid);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isApproved: false } : u));
      addNotification({
        title: 'Sucesso',
        message: 'Usuário desativado com sucesso.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error deactivating user:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível desativar o usuário.',
        type: 'error'
      });
    }
  };

  const deleteUser = async (uid: string) => {
    try {
      await authService.deleteUser(uid);
      setUsers(prev => prev.filter(u => u.uid !== uid));
      addNotification({
        title: 'Sucesso',
        message: 'Usuário eliminado com sucesso.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting user:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível eliminar o usuário.',
        type: 'error'
      });
    }
  };

  const updateUserRating = async (uid: string, rating: number, reviewsCount: number) => {
    try {
      await authService.updateUserProfile(uid, { rating, reviews: reviewsCount });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, rating, reviews: reviewsCount } : u));
      addNotification({
        title: 'Sucesso',
        message: 'Avaliação do usuário atualizada com sucesso.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating user rating:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível atualizar a avaliação do usuário.',
        type: 'error'
      });
    }
  };

  const toggleResponsibleStatus = async (uid: string, currentStatus: boolean | undefined) => {
    const newStatus = !currentStatus;
    try {
      await authService.updateUserProfile(uid, { isResponsible: newStatus });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isResponsible: newStatus } : u));
      addNotification({
        title: 'Sucesso',
        message: `Status de responsabilidade atualizado com sucesso.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error updating responsible status:', err);
      addNotification({
        title: 'Erro',
        message: 'Não foi possível atualizar o status de responsabilidade.',
        type: 'error'
      });
    }
  };

  return {
    users,
    loading,
    error,
    refreshUsers: fetchUsers,
    changeUserRole,
    approveUser,
    deactivateUser,
    deleteUser,
    updateUserRating,
    toggleResponsibleStatus
  };
}
