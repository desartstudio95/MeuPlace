import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { AvailabilityConfirmationMethod } from '@/types/trustQuality';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

export const propertyFreshnessService = {
  /**
   * Reconfirma a disponibilidade real de um imóvel pelo anunciante ou agente responsável.
   * Cria carimbo temporal auditável.
   */
  async confirmAvailability(
    propertyId: string,
    method: AvailabilityConfirmationMethod = 'manual_confirmation',
    userId?: string
  ): Promise<{ success: boolean; confirmedAt: string }> {
    const path = `properties/${propertyId}`;
    try {
      const nowIso = new Date().toISOString();
      const confirmedBy = userId || auth.currentUser?.uid || 'system';

      await updateDoc(doc(db, 'properties', propertyId), {
        availabilityStatus: 'available',
        lastAvailabilityConfirmationAt: nowIso,
        availabilityConfirmedBy: confirmedBy,
        availabilityConfirmationMethod: method,
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        confirmedAt: nowIso
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  /**
   * Marca o imóvel com novo status de disponibilidade com registo auditável.
   */
  async updateAvailabilityStatus(
    propertyId: string,
    status: 'available' | 'reserved' | 'sold' | 'rented' | 'unavailable',
    userId?: string
  ): Promise<boolean> {
    const path = `properties/${propertyId}`;
    try {
      const confirmedBy = userId || auth.currentUser?.uid || 'system';
      const nowIso = new Date().toISOString();

      await updateDoc(doc(db, 'properties', propertyId), {
        availabilityStatus: status,
        status: status === 'available' ? 'Disponível' : status === 'sold' ? 'Vendido' : status === 'rented' ? 'Arrendado' : 'Inativo',
        lastAvailabilityConfirmationAt: nowIso,
        availabilityConfirmedBy: confirmedBy,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  }
};
