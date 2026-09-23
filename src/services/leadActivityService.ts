/**
 * MEUPLACE — CRM V1: LEAD ACTIVITY SERVICE
 * Gestão do histórico/timeline comercial append-only de leads.
 * 
 * Regras Estritas:
 * - Append-only (clientes nunca podem editar ou apagar atividades)
 * - ActorId derivado estritamente do usuário autenticado ou 'system'
 * - Queries sempre paginadas com limite e cursor
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy,
  startAfter,
  serverTimestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { 
  LeadActivity, 
  LeadActivityType, 
  LeadActivityActorRole 
} from '@/types';

export interface CreateLeadActivityInput {
  leadId: string;
  propertyId: string;
  type: LeadActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  actorName?: string;
  actorRole?: LeadActivityActorRole;
}

export interface GetLeadActivitiesOptions {
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}

export interface GetLeadActivitiesResult {
  activities: LeadActivity[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export const leadActivityService = {
  /**
   * Cria uma atividade comercial na timeline do lead.
   * Append-only: grava um documento imutável com serverTimestamp.
   */
  async createActivity(input: CreateLeadActivityInput): Promise<string> {
    const user = auth.currentUser;
    const actorId = user ? user.uid : 'system';
    const actorRole = input.actorRole || (user ? 'agent' : 'system');
    const actorName = input.actorName || user?.displayName || (user ? 'Agente' : 'Sistema');

    if (!input.leadId || typeof input.leadId !== 'string') {
      throw new Error('Identificador de lead inválido para registro de atividade.');
    }
    if (!input.propertyId || typeof input.propertyId !== 'string') {
      throw new Error('Identificador de imóvel inválido para registro de atividade.');
    }
    if (!input.title || typeof input.title !== 'string') {
      throw new Error('Título da atividade é obrigatório.');
    }

    const activityData: Omit<LeadActivity, 'id'> = {
      leadId: input.leadId,
      propertyId: input.propertyId,
      type: input.type,
      actorId,
      actorName,
      actorRole,
      title: input.title.trim().slice(0, 200),
      description: input.description ? input.description.trim().slice(0, 2000) : undefined,
      metadata: input.metadata || {},
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'lead_activities'), activityData);
    return docRef.id;
  },

  /**
   * Obtém as atividades de um lead com paginação eficiente por cursor.
   * Evita carregar todo o histórico de uma só vez.
   */
  async getLeadActivities(
    leadId: string, 
    options?: GetLeadActivitiesOptions
  ): Promise<GetLeadActivitiesResult> {
    if (!leadId) {
      return { activities: [], lastDoc: null, hasMore: false };
    }

    const pageSize = Math.min(Math.max(options?.limitCount || 20, 1), 100);
    const activitiesRef = collection(db, 'lead_activities');

    let q = query(
      activitiesRef,
      where('leadId', '==', leadId),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );

    if (options?.lastDoc) {
      q = query(
        activitiesRef,
        where('leadId', '==', leadId),
        orderBy('createdAt', 'desc'),
        startAfter(options.lastDoc),
        limit(pageSize + 1)
      );
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const finalDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const activities: LeadActivity[] = finalDocs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<LeadActivity, 'id'>)
    }));

    const lastDoc = finalDocs.length > 0 ? finalDocs[finalDocs.length - 1] : null;

    return {
      activities,
      lastDoc,
      hasMore
    };
  },

  /**
   * Helper: Registra contacto realizado com o cliente.
   */
  async logLeadContacted(
    leadId: string, 
    propertyId: string, 
    channel: 'whatsapp' | 'phone' | 'email',
    notes?: string
  ): Promise<string> {
    const channelNames = {
      whatsapp: 'WhatsApp',
      phone: 'Chamada Telefónica',
      email: 'Email'
    };
    return this.createActivity({
      leadId,
      propertyId,
      type: 'lead_contacted',
      title: `Contacto realizado via ${channelNames[channel] || channel}`,
      description: notes,
      metadata: { channel }
    });
  },

  /**
   * Helper: Registra mudança de status do lead.
   */
  async logStatusChanged(
    leadId: string,
    propertyId: string,
    fromStatus: string,
    toStatus: string,
    reason?: string
  ): Promise<string> {
    return this.createActivity({
      leadId,
      propertyId,
      type: 'status_changed',
      title: `Status alterado de "${fromStatus}" para "${toStatus}"`,
      description: reason,
      metadata: { fromStatus, toStatus }
    });
  },

  /**
   * Helper: Registra adição de anotação interna no lead.
   */
  async logNoteAdded(
    leadId: string,
    propertyId: string,
    note: string
  ): Promise<string> {
    return this.createActivity({
      leadId,
      propertyId,
      type: 'note_added',
      title: 'Nota interna adicionada',
      description: note
    });
  },

  /**
   * Helper: Registra reatribuição de lead para novo agente.
   */
  async logAssignmentChanged(
    leadId: string,
    propertyId: string,
    fromAgentId?: string,
    toAgentId?: string
  ): Promise<string> {
    return this.createActivity({
      leadId,
      propertyId,
      type: fromAgentId ? 'reassigned' : 'assigned',
      title: fromAgentId ? 'Lead reatribuído a novo responsável' : 'Lead atribuído a responsável',
      metadata: { fromAgentId, toAgentId }
    });
  }
};
