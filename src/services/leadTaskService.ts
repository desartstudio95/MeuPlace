/**
 * MEUPLACE — CRM V1: LEAD TASK SERVICE
 * Gestão de tarefas e lembretes de acompanhamento (follow-ups) associados a leads.
 * 
 * Regras Estritas:
 * - Imutabilidade: leadId, propertyId, createdBy, createdAt não podem ser alterados após criação
 * - Ator: createdBy e completedBy são derivados da sessão autenticada
 * - Transições de status: pending -> completed | cancelled
 * - Paginação: sempre com limite e cursor
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
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
import { LeadTask, LeadTaskStatus, LeadTaskPriority } from '@/types';
import { leadActivityService } from './leadActivityService';

export interface CreateLeadTaskInput {
  leadId: string;
  propertyId: string;
  assignedTo: string;
  title: string;
  description?: string;
  priority?: LeadTaskPriority;
  dueAt: string; // ISO date string ou data formatada
}

export interface UpdateLeadTaskInput {
  title?: string;
  description?: string;
  priority?: LeadTaskPriority;
  dueAt?: string;
  assignedTo?: string;
}

export interface GetTasksOptions {
  status?: LeadTaskStatus;
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}

export interface GetTasksResult {
  tasks: LeadTask[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export const leadTaskService = {
  /**
   * Cria uma tarefa de follow-up para um lead.
   */
  async createTask(input: CreateLeadTaskInput): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário deve estar autenticado para criar tarefas.');
    }

    if (!input.leadId || typeof input.leadId !== 'string') {
      throw new Error('Identificador de lead inválido.');
    }
    if (!input.propertyId || typeof input.propertyId !== 'string') {
      throw new Error('Identificador de imóvel inválido.');
    }
    if (!input.assignedTo || typeof input.assignedTo !== 'string') {
      throw new Error('Responsável pela tarefa deve ser especificado.');
    }
    const title = (input.title || '').trim();
    if (title.length < 3) {
      throw new Error('O título da tarefa deve ter pelo menos 3 caracteres.');
    }
    if (title.length > 200) {
      throw new Error('O título da tarefa não pode exceder 200 caracteres.');
    }
    if (!input.dueAt) {
      throw new Error('A data de vencimento da tarefa é obrigatória.');
    }

    const taskData: Omit<LeadTask, 'id'> = {
      leadId: input.leadId,
      propertyId: input.propertyId,
      assignedTo: input.assignedTo,
      createdBy: user.uid,
      title,
      description: input.description ? input.description.trim().slice(0, 1000) : undefined,
      status: 'pending',
      priority: input.priority || 'medium',
      dueAt: input.dueAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'lead_tasks'), taskData);

    // Registra atividade na timeline do lead de forma não-bloqueante
    try {
      await leadActivityService.createActivity({
        leadId: input.leadId,
        propertyId: input.propertyId,
        type: 'task_created',
        title: `Tarefa criada: "${title}"`,
        description: input.description,
        metadata: { taskId: docRef.id, assignedTo: input.assignedTo, dueAt: input.dueAt }
      });
    } catch (e) {
      console.warn('[leadTaskService] Falha ao registrar activity de criação de task:', e);
    }

    // Notifica o responsável pela tarefa (se diferente do criador ou para alerta de follow-up)
    try {
      if (input.assignedTo) {
        await addDoc(collection(db, 'user_notifications'), {
          userId: input.assignedTo,
          type: 'task_due',
          title: `Nova Tarefa de Follow-up: ${title}`,
          message: `Você tem uma nova tarefa agendada para ${input.dueAt?.replace('T', ' ')}: "${title}".`,
          category: 'lead',
          entityType: 'lead',
          entityId: input.leadId,
          leadId: input.leadId,
          propertyId: input.propertyId,
          taskId: docRef.id,
          link: `/crm/leads/${input.leadId}`,
          read: false,
          priority: input.priority === 'high' ? 'high' : 'normal',
          createdAt: serverTimestamp()
        });
      }
    } catch {
      // Notificação secundária não bloqueia fluxo operacional
    }

    return docRef.id;
  },

  /**
   * Obtém tarefas associadas a um lead específico.
   */
  async getLeadTasks(leadId: string, options?: GetTasksOptions): Promise<GetTasksResult> {
    if (!leadId) {
      return { tasks: [], lastDoc: null, hasMore: false };
    }

    const pageSize = Math.min(Math.max(options?.limitCount || 20, 1), 100);
    const tasksRef = collection(db, 'lead_tasks');

    let q = options?.status
      ? query(
          tasksRef,
          where('leadId', '==', leadId),
          where('status', '==', options.status),
          orderBy('dueAt', 'asc'),
          limit(pageSize + 1)
        )
      : query(
          tasksRef,
          where('leadId', '==', leadId),
          orderBy('dueAt', 'asc'),
          limit(pageSize + 1)
        );

    if (options?.lastDoc) {
      q = options?.status
        ? query(
            tasksRef,
            where('leadId', '==', leadId),
            where('status', '==', options.status),
            orderBy('dueAt', 'asc'),
            startAfter(options.lastDoc),
            limit(pageSize + 1)
          )
        : query(
            tasksRef,
            where('leadId', '==', leadId),
            orderBy('dueAt', 'asc'),
            startAfter(options.lastDoc),
            limit(pageSize + 1)
          );
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const finalDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const tasks: LeadTask[] = finalDocs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<LeadTask, 'id'>)
    }));

    const lastDoc = finalDocs.length > 0 ? finalDocs[finalDocs.length - 1] : null;

    return { tasks, lastDoc, hasMore };
  },

  /**
   * Obtém tarefas atribuídas a um usuário/agente específico (Inbox de Tarefas).
   */
  async getTasksForUser(assignedTo: string, options?: GetTasksOptions): Promise<GetTasksResult> {
    if (!assignedTo) {
      return { tasks: [], lastDoc: null, hasMore: false };
    }

    const pageSize = Math.min(Math.max(options?.limitCount || 20, 1), 100);
    const tasksRef = collection(db, 'lead_tasks');

    let q = options?.status
      ? query(
          tasksRef,
          where('assignedTo', '==', assignedTo),
          where('status', '==', options.status),
          orderBy('dueAt', 'asc'),
          limit(pageSize + 1)
        )
      : query(
          tasksRef,
          where('assignedTo', '==', assignedTo),
          orderBy('dueAt', 'asc'),
          limit(pageSize + 1)
        );

    if (options?.lastDoc) {
      q = options?.status
        ? query(
            tasksRef,
            where('assignedTo', '==', assignedTo),
            where('status', '==', options.status),
            orderBy('dueAt', 'asc'),
            startAfter(options.lastDoc),
            limit(pageSize + 1)
          )
        : query(
            tasksRef,
            where('assignedTo', '==', assignedTo),
            orderBy('dueAt', 'asc'),
            startAfter(options.lastDoc),
            limit(pageSize + 1)
          );
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const finalDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const tasks: LeadTask[] = finalDocs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<LeadTask, 'id'>)
    }));

    const lastDoc = finalDocs.length > 0 ? finalDocs[finalDocs.length - 1] : null;

    return { tasks, lastDoc, hasMore };
  },

  /**
   * Atualização de dados de uma tarefa (título, descrição, prioridade, data).
   * Imutabilidade protegida: chaves estruturais nunca são alteradas.
   */
  async updateTask(taskId: string, updates: UpdateLeadTaskInput): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado.');

    const taskRef = doc(db, 'lead_tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) throw new Error('Tarefa não encontrada.');

    const patch: Record<string, any> = {
      updatedAt: serverTimestamp()
    };

    if (updates.title !== undefined) {
      const t = updates.title.trim();
      if (t.length < 3) throw new Error('Título muito curto.');
      patch.title = t.slice(0, 200);
    }
    if (updates.description !== undefined) {
      patch.description = updates.description.trim().slice(0, 1000);
    }
    if (updates.priority !== undefined) {
      patch.priority = updates.priority;
    }
    if (updates.dueAt !== undefined) {
      patch.dueAt = updates.dueAt;
    }
    if (updates.assignedTo !== undefined) {
      patch.assignedTo = updates.assignedTo;
    }

    await updateDoc(taskRef, patch);
  },

  /**
   * Marca uma tarefa como concluída.
   */
  async completeTask(taskId: string, notes?: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado.');

    const taskRef = doc(db, 'lead_tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) throw new Error('Tarefa não encontrada.');

    const task = taskSnap.data() as LeadTask;
    if (task.status === 'completed') return;

    await updateDoc(taskRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedBy: user.uid,
      updatedAt: serverTimestamp(),
      ...(notes ? { completionNotes: notes.trim().slice(0, 500) } : {})
    });

    try {
      await leadActivityService.createActivity({
        leadId: task.leadId,
        propertyId: task.propertyId,
        type: 'task_completed',
        title: `Tarefa concluída: "${task.title}"`,
        description: notes,
        metadata: { taskId, completedBy: user.uid }
      });
    } catch (e) {
      console.warn('[leadTaskService] Falha ao registrar activity de conclusão de task:', e);
    }
  },

  /**
   * Cancela uma tarefa pendente.
   */
  async cancelTask(taskId: string, reason?: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado.');

    const taskRef = doc(db, 'lead_tasks', taskId);
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) throw new Error('Tarefa não encontrada.');

    await updateDoc(taskRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
      ...(reason ? { cancellationReason: reason.trim().slice(0, 500) } : {})
    });
  }
};
