import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { VerificationRecord, VerificationType, VerificationStatus } from '@/types/trustQuality';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

export const propertyVerificationService = {
  /**
   * Submete um pedido de verificação formal para um imóvel ou anunciante.
   */
  async submitVerificationRequest(input: {
    entityType: 'property' | 'agent' | 'user';
    entityId: string;
    verificationType: VerificationType;
    documentUrls?: string[];
    evidenceNotes?: string;
  }): Promise<string> {
    const path = 'verification_records';
    try {
      const nowIso = new Date().toISOString();
      const record: Omit<VerificationRecord, 'id'> = {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: input.verificationType,
        status: 'pending',
        documentUrls: input.documentUrls || [],
        evidenceNotes: input.evidenceNotes || '',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      const docRef = await addDoc(collection(db, path), record);

      // Atualiza status pendente na entidade correspondente se for property
      if (input.entityType === 'property') {
        await updateDoc(doc(db, 'properties', input.entityId), {
          verificationStatus: 'pending',
          updatedAt: serverTimestamp()
        });
      }

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  /**
   * Avalia e decide sobre um registo de verificação (apenas Moderador / Admin).
   */
  async reviewVerification(
    recordId: string,
    status: 'verified' | 'rejected',
    reviewerId: string,
    rejectionReason?: string
  ): Promise<boolean> {
    const path = `verification_records/${recordId}`;
    try {
      const nowIso = new Date().toISOString();
      const updateData: Partial<VerificationRecord> = {
        status,
        verifiedBy: reviewerId,
        verifiedAt: status === 'verified' ? nowIso : undefined,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        updatedAt: nowIso
      };

      await updateDoc(doc(db, 'verification_records', recordId), updateData);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  /**
   * Lista registos de verificação associados a uma entidade.
   */
  async getVerificationsForEntity(
    entityType: 'property' | 'agent' | 'user',
    entityId: string
  ): Promise<VerificationRecord[]> {
    const path = 'verification_records';
    try {
      const q = query(
        collection(db, path),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as VerificationRecord));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  }
};
