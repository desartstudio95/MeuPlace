import { 
  collection, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property, PropertyReport } from '@/types';
import { 
  ModerationQueueItem, 
  DuplicateCandidate 
} from '@/types/trustQuality';
import { calculatePropertyQualityScore } from '@/utils/propertyQualityScore';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';

export const marketplaceModerationService = {
  /**
   * Consolida a fila de moderação do marketplace a partir de:
   * 1. Imóveis pendentes de aprovação inicial
   * 2. Denúncias abertas de utilizadores
   * 3. Candidatos a duplicado pendentes de revisão
   */
  buildModerationQueue(
    properties: Property[],
    reports: PropertyReport[] = [],
    duplicateCandidates: DuplicateCandidate[] = []
  ): ModerationQueueItem[] {
    const queue: ModerationQueueItem[] = [];

    // 1. Imóveis pendentes de aprovação
    const pendingProps = properties.filter(p => !p.isApproved && p.status !== 'Inativo');
    pendingProps.forEach(prop => {
      const qScore = calculatePropertyQualityScore(prop);
      queue.push({
        id: `mod_prop_${prop.id}`,
        propertyId: prop.id,
        propertyTitle: prop.title,
        agentId: prop.agentId,
        agentName: prop.agent?.name,
        price: prop.price,
        location: prop.location,
        reason: 'new_listing',
        priority: qScore.score < 40 ? 'urgent' : 'normal',
        status: 'pending',
        qualityScore: qScore.score,
        submittedAt: typeof prop.createdAt === 'string' ? prop.createdAt : new Date().toISOString()
      });
    });

    // 2. Denúncias abertas
    const openReports = reports.filter(r => r.status === 'open' || r.status === 'reviewing');
    openReports.forEach(report => {
      const relatedProp = properties.find(p => p.id === report.propertyId);
      if (relatedProp) {
        queue.push({
          id: `mod_rep_${report.id || report.propertyId}`,
          propertyId: report.propertyId,
          propertyTitle: relatedProp.title,
          agentId: relatedProp.agentId,
          agentName: relatedProp.agent?.name,
          price: relatedProp.price,
          location: relatedProp.location,
          reason: 'user_report',
          priority: report.reason === 'fraud' || report.reason === 'inexistent' ? 'urgent' : 'high',
          status: 'pending',
          reportCount: openReports.filter(r => r.propertyId === report.propertyId).length,
          submittedAt: typeof report.createdAt === 'string' ? report.createdAt : new Date().toISOString()
        });
      }
    });

    // 3. Candidatos de duplicado
    const openDuplicates = duplicateCandidates.filter(d => d.status === 'pending_review');
    openDuplicates.forEach(dup => {
      queue.push({
        id: `mod_dup_${dup.id}`,
        propertyId: dup.primaryPropertyId,
        propertyTitle: dup.primaryPropertyTitle,
        agentId: dup.primaryPropertyAgentId,
        price: dup.primaryPropertyPrice,
        location: dup.primaryPropertyLocation,
        reason: 'duplicate_suspect',
        priority: dup.similarityScore >= 80 ? 'high' : 'normal',
        status: 'pending',
        duplicateScore: dup.similarityScore,
        submittedAt: dup.detectedAt
      });
    });

    // Ordenação determinística: urgentes primeiro, depois mais recentes
    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
    return queue.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  },

  /**
   * Executa ação de moderação em um imóvel (Aprovar, Rejeitar, Solicitar Alterações).
   */
  async processModerationAction(
    propertyId: string,
    action: 'approve' | 'reject' | 'changes_requested',
    reviewerId: string,
    notes?: string
  ): Promise<boolean> {
    const path = `properties/${propertyId}`;
    try {
      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (action === 'approve') {
        updateData.isApproved = true;
        updateData.moderationStatus = 'approved';
        updateData.status = 'Disponível';
      } else if (action === 'reject') {
        updateData.isApproved = false;
        updateData.moderationStatus = 'rejected';
        updateData.status = 'Inativo';
      } else if (action === 'changes_requested') {
        updateData.isApproved = false;
        updateData.moderationStatus = 'changes_requested';
      }

      await updateDoc(doc(db, 'properties', propertyId), updateData);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  }
};
