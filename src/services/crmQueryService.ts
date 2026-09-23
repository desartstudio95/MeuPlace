/**
 * MEUPLACE — CRM V1: QUERY SERVICE
 * Camada centralizada de consultas para o CRM V1 com paginação estrita por cursor,
 * ordenação consistente e proteção contra consultas sem limites ou varreduras completas.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy,
  startAfter,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';
import { 
  Lead, 
  LeadStatus, 
  LeadPriority, 
  LeadSource,
  LeadActivity,
  LeadTask,
  Viewing,
  Property
} from '@/types';
import { leadActivityService } from './leadActivityService';
import { leadTaskService } from './leadTaskService';
import { viewingService } from './viewingService';

export interface CrmLeadFilter {
  agentId?: string;
  propertyOwnerId?: string;
  propertyId?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  source?: LeadSource;
}

export interface CrmPaginationOptions {
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}

export interface CrmLeadsResult {
  leads: Lead[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  totalReturned: number;
}

export interface LeadDetailAggregate {
  lead: Lead;
  property: Property | null;
  activities: LeadActivity[];
  tasks: LeadTask[];
  viewings: Viewing[];
}

export const crmQueryService = {
  /**
   * Obtém os detalhes do imóvel associado ao lead.
   */
  async getPropertyForLead(propertyId: string): Promise<Property | null> {
    if (!propertyId) return null;
    try {
      const snap = await getDoc(doc(db, 'properties', propertyId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as Omit<Property, 'id'>) };
    } catch {
      return null;
    }
  },

  /**
   * Obtém um lead individual por ID com validação de existência.
   */
  async getLeadById(leadId: string): Promise<Lead | null> {
    if (!leadId) return null;
    try {
      const snap = await getDoc(doc(db, 'leads', leadId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...(snap.data() as Omit<Lead, 'id'>) };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `leads/${leadId}`);
      return null;
    }
  },

  /**
   * Lead Detail Aggregate: busca o lead e as 3 coleções filhas paginadas
   * (atividades, tarefas e visitas) sem carregar dados de outros leads.
   * Evita problema N+1 e respeita isolamento de inquilino.
   */
  async getLeadDetail(leadId: string): Promise<LeadDetailAggregate | null> {
    const lead = await this.getLeadById(leadId);
    if (!lead) return null;

    // Busca concorrente paginada das sub-entidades do lead e do imóvel
    const [property, activitiesRes, tasksRes, viewings] = await Promise.all([
      this.getPropertyForLead(lead.propertyId),
      leadActivityService.getLeadActivities(leadId, { limitCount: 20 }),
      leadTaskService.getLeadTasks(leadId, { limitCount: 20 }),
      viewingService.getLeadViewings(leadId, 20)
    ]);

    return {
      lead,
      property,
      activities: activitiesRes.activities,
      tasks: tasksRes.tasks,
      viewings
    };
  },

  /**
   * Consulta centralizada de leads com filtros indexáveis e paginação por cursor.
   */
  async getLeadsFiltered(
    filter: CrmLeadFilter, 
    pagination?: CrmPaginationOptions
  ): Promise<CrmLeadsResult> {
    const pageSize = Math.min(Math.max(pagination?.limitCount || 20, 1), 50);
    const leadsRef = collection(db, 'leads');
    const constraints: QueryConstraint[] = [];

    // Isolamento de proprietário / agente (deve conter pelo menos um filtro de escopo se não for admin)
    if (filter.agentId) {
      constraints.push(where('agentId', '==', filter.agentId));
    } else if (filter.propertyOwnerId) {
      constraints.push(where('propertyOwnerId', '==', filter.propertyOwnerId));
    }

    if (filter.propertyId) {
      constraints.push(where('propertyId', '==', filter.propertyId));
    }

    if (filter.status) {
      constraints.push(where('status', '==', filter.status));
    }

    if (filter.priority) {
      constraints.push(where('priority', '==', filter.priority));
    }

    if (filter.source) {
      constraints.push(where('source', '==', filter.source));
    }

    // Ordenação padrão por data de criação decrescente
    constraints.push(orderBy('createdAt', 'desc'));

    if (pagination?.lastDoc) {
      constraints.push(startAfter(pagination.lastDoc));
    }

    // Busca pageSize + 1 para determinar hasMore
    constraints.push(limit(pageSize + 1));

    try {
      const q = query(leadsRef, ...constraints);
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageSize;
      const finalDocs = hasMore ? docs.slice(0, pageSize) : docs;

      const leads: Lead[] = finalDocs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Lead, 'id'>)
      }));

      const lastDoc = finalDocs.length > 0 ? finalDocs[finalDocs.length - 1] : null;

      return {
        leads,
        lastDoc,
        hasMore,
        totalReturned: leads.length
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'leads');
      return {
        leads: [],
        lastDoc: null,
        hasMore: false,
        totalReturned: 0
      };
    }
  },

  /**
   * Obtém leads de um agente (Inbox / Pipeline) com paginação por cursor.
   */
  async getLeadsForAgent(
    agentId: string, 
    options?: { status?: LeadStatus; limitCount?: number; lastDoc?: DocumentSnapshot }
  ): Promise<CrmLeadsResult> {
    return this.getLeadsFiltered(
      { agentId, status: options?.status },
      { limitCount: options?.limitCount, lastDoc: options?.lastDoc }
    );
  },

  /**
   * Obtém leads de um proprietário com paginação por cursor.
   */
  async getLeadsForOwner(
    propertyOwnerId: string, 
    options?: { status?: LeadStatus; limitCount?: number; lastDoc?: DocumentSnapshot }
  ): Promise<CrmLeadsResult> {
    return this.getLeadsFiltered(
      { propertyOwnerId, status: options?.status },
      { limitCount: options?.limitCount, lastDoc: options?.lastDoc }
    );
  },

  /**
   * Fila Operacional de Follow-ups do Agente/Usuário:
   * Categoriza tarefas pendentes em atrasadas (overdue), de hoje (today) e futuras (upcoming).
   */
  async getFollowUpQueue(userId: string, limitCount: number = 50): Promise<{
    overdue: LeadTask[];
    today: LeadTask[];
    upcoming: LeadTask[];
    totalPending: number;
  }> {
    if (!userId) {
      return { overdue: [], today: [], upcoming: [], totalPending: 0 };
    }

    const res = await leadTaskService.getTasksForUser(userId, {
      status: 'pending',
      limitCount
    });

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const overdue: LeadTask[] = [];
    const today: LeadTask[] = [];
    const upcoming: LeadTask[] = [];

    res.tasks.forEach(task => {
      if (!task.dueAt) {
        upcoming.push(task);
        return;
      }
      const taskDate = new Date(task.dueAt);
      const taskDateStr = task.dueAt.slice(0, 10);

      if (taskDate < now && taskDateStr !== todayStr) {
        overdue.push(task);
      } else if (taskDateStr === todayStr) {
        today.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return {
      overdue,
      today,
      upcoming,
      totalPending: res.tasks.length
    };
  }
};
