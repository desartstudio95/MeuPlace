import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property } from '@/types';
import { DuplicateCandidate, DuplicateCandidateStatus } from '@/types/trustQuality';
import { findDuplicateCandidates } from '@/utils/propertyDuplicateDetection';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

export const propertyDuplicateService = {
  /**
   * Executa a varredura determinística para um imóvel contra o catálogo
   * e armazena os candidatos gerados para revisão humana.
   * Regra 11: NUNCA apaga automaticamente os anúncios.
   */
  async scanAndRecordDuplicates(
    targetProperty: Property,
    catalog: Property[]
  ): Promise<DuplicateCandidate[]> {
    const candidates = findDuplicateCandidates(targetProperty, catalog, 65);
    if (candidates.length === 0) return [];

    const path = 'duplicate_candidates';
    try {
      for (const candidate of candidates) {
        // Verifica se já existe candidato registado para este par
        const existingQ = query(
          collection(db, path),
          where('primaryPropertyId', '==', candidate.primaryPropertyId),
          where('comparedPropertyId', '==', candidate.comparedPropertyId),
          limit(1)
        );
        const existingSnap = await getDocs(existingQ);
        if (existingSnap.empty) {
          await addDoc(collection(db, path), candidate);
        }
      }
      return candidates;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return candidates; // fallback seguro sem quebrar
    }
  },

  /**
   * Lista candidatos de duplicados para a fila de moderação do administrador.
   */
  async getOpenCandidates(): Promise<DuplicateCandidate[]> {
    const path = 'duplicate_candidates';
    try {
      const q = query(
        collection(db, path),
        where('status', '==', 'pending_review'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DuplicateCandidate));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  /**
   * Resolve um candidato de duplicado (apenas moderador / admin).
   */
  async resolveCandidate(
    candidateId: string,
    resolution: DuplicateCandidateStatus,
    reviewerId: string,
    notes?: string
  ): Promise<boolean> {
    const path = `duplicate_candidates/${candidateId}`;
    try {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, 'duplicate_candidates', candidateId), {
        status: resolution,
        reviewedAt: nowIso,
        reviewedBy: reviewerId,
        notes: notes || ''
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  }
};
