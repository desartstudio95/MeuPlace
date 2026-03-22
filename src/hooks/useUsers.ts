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

  return {
    users,
    loading,
    error,
    refreshUsers: fetchUsers,
    changeUserRole,
    approveUser
  };
}
