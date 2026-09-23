import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { trackPropertyEvent } from '@/services/propertyEventService';

interface FavoriteContextType {
  favoriteIds: Set<string>;
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<boolean>;
  syncGuestFavoritesOnLogin: () => Promise<void>;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

const GUEST_FAVORITES_STORAGE_KEY = 'meuplace_guest_favorites';

export function FavoriteProvider({ children }: { children: ReactNode }) {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [favoriteList, setFavoriteList] = useState<string[]>([]);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Set lookup for O(1) checks without N+1 queries
  const favoriteIds = useMemo(() => new Set(favoriteList), [favoriteList]);

  // Carrega favoritos iniciais: do perfil autenticado ou do localStorage seguro (apenas IDs)
  useEffect(() => {
    if (currentUser && userProfile) {
      const userFavs: string[] = Array.isArray(userProfile.favorites) ? userProfile.favorites : [];
      setFavoriteList(userFavs);

      // Sincroniza favoritos pendentes de quando o utilizador era visitante
      syncGuestFavoritesToUser(currentUser.uid, userFavs);
    } else if (!currentUser) {
      try {
        const stored = localStorage.getItem(GUEST_FAVORITES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setFavoriteList(parsed.filter(id => typeof id === 'string'));
          }
        } else {
          setFavoriteList([]);
        }
      } catch (e) {
        console.error('Erro ao ler favoritos locais do visitante:', e);
        setFavoriteList([]);
      }
    }
  }, [currentUser?.uid, userProfile?.favorites]);

  // Sincronização segura de favoritos temporários do visitante para a conta Firestore
  const syncGuestFavoritesToUser = async (uid: string, currentFavs: string[]) => {
    try {
      const guestStored = localStorage.getItem(GUEST_FAVORITES_STORAGE_KEY);
      if (!guestStored) return;

      const guestIds: string[] = JSON.parse(guestStored);
      if (!Array.isArray(guestIds) || guestIds.length === 0) {
        localStorage.removeItem(GUEST_FAVORITES_STORAGE_KEY);
        return;
      }

      // Filtrar apenas os que o utilizador ainda não tem
      const newIdsToSync = guestIds.filter(id => typeof id === 'string' && !currentFavs.includes(id));

      if (newIdsToSync.length > 0) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          favorites: arrayUnion(...newIdsToSync)
        });

        const merged = Array.from(new Set([...currentFavs, ...newIdsToSync]));
        setFavoriteList(merged);
        updateUserProfile({ favorites: merged });
        toast.info(`${newIdsToSync.length} imóvel(eis) dos seus favoritos anteriores foram sincronizados com a sua conta.`);
      }

      localStorage.removeItem(GUEST_FAVORITES_STORAGE_KEY);
    } catch (err) {
      console.error('Erro ao sincronizar favoritos locais para o Firestore:', err);
    }
  };

  const isFavorite = (propertyId: string): boolean => {
    return favoriteIds.has(propertyId);
  };

  const toggleFavorite = async (propertyId: string): Promise<boolean> => {
    if (!propertyId || typeof propertyId !== 'string') return false;

    // Evita double-clicks rápidos concorrentes no mesmo imóvel
    if (pendingOperations.has(propertyId)) {
      return favoriteIds.has(propertyId);
    }

    const wasFavorite = favoriteIds.has(propertyId);
    const willBeFavorite = !wasFavorite;

    // 1. Atualização Otimista Imediata na UI
    const nextList = willBeFavorite
      ? [...favoriteList, propertyId]
      : favoriteList.filter(id => id !== propertyId);

    setFavoriteList(nextList);
    setPendingOperations(prev => new Set(prev).add(propertyId));

    // Telemetria real
    trackPropertyEvent({
      eventType: willBeFavorite ? 'favorite_add' : 'favorite_remove',
      propertyId,
      userId: currentUser?.uid || null,
      source: 'property_card'
    });

    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          favorites: willBeFavorite ? arrayUnion(propertyId) : arrayRemove(propertyId)
        });

        // Sincroniza estado de auth
        updateUserProfile({ favorites: nextList });

        if (willBeFavorite) {
          toast.success('Imóvel adicionado aos favoritos.');
        } else {
          toast.info('Imóvel removido dos favoritos.');
        }
      } catch (error) {
        console.error('Erro ao atualizar favorito no Firestore:', error);
        // Rollback otimista
        setFavoriteList(favoriteList);
        toast.error('Não foi possível salvar o favorito. Tente novamente.');
      } finally {
        setPendingOperations(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      }
    } else {
      // Visitante não autenticado: armazena somente os IDs no localStorage (sem dados sensíveis)
      try {
        localStorage.setItem(GUEST_FAVORITES_STORAGE_KEY, JSON.stringify(nextList));
        if (willBeFavorite) {
          toast.success('Imóvel guardado nos favoritos temporários. Inicie sessão para sincronizar entre dispositivos!');
        } else {
          toast.info('Imóvel removido dos favoritos.');
        }
      } catch (err) {
        console.error('Erro ao salvar favoritos locais:', err);
      } finally {
        setPendingOperations(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      }
    }

    return willBeFavorite;
  };

  const syncGuestFavoritesOnLogin = async () => {
    if (currentUser) {
      await syncGuestFavoritesToUser(currentUser.uid, favoriteList);
    }
  };

  return (
    <FavoriteContext.Provider value={{
      favoriteIds,
      isFavorite,
      toggleFavorite,
      syncGuestFavoritesOnLogin
    }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorites deve ser usado dentro de um FavoriteProvider');
  }
  return context;
};
