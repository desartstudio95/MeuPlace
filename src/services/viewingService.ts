import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { 
  Viewing, 
  ViewingStatus, 
  Property, 
  Lead,
  LeadActivityType,
  isValidViewingTransition, 
  ALLOWED_VIEWING_TRANSITIONS 
} from '@/types';
import { trackLeadEvent } from './leadEventService';
import { leadActivityService } from './leadActivityService';

export { isValidViewingTransition, ALLOWED_VIEWING_TRANSITIONS };

export interface CreateViewingInput {
  propertyId: string;
  leadId?: string; // FASE 2: Relação opcional com lead existente
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  preferredDate: string;
  preferredTime: string;
  alternativeDate?: string;
  alternativeTime?: string;
  notes?: string;
  honeypot?: string;
}

export interface CreateViewingResult {
  success: boolean;
  viewingId: string;
  message: string;
}

export interface GetViewingsFilter {
  agentId?: string;
  propertyOwnerId?: string;
  requesterId?: string;
  propertyId?: string;
  leadId?: string;
  status?: ViewingStatus;
  limitCount?: number;
}

export function validateViewingInput(input: Partial<CreateViewingInput>): { valid: boolean; error?: string } {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { valid: false, error: 'Submissão bloqueada por filtro anti-bot.' };
  }

  if (!input.propertyId) return { valid: false, error: 'Imóvel inválido.' };
  if (!input.requesterName || input.requesterName.trim().length < 2) {
    return { valid: false, error: 'Por favor informe o seu nome.' };
  }
  const cleanPhone = (input.requesterPhone || '').replace(/\s+/g, '');
  if (cleanPhone.length < 7 || cleanPhone.length > 25) {
    return { valid: false, error: 'Por favor informe um contacto telefónico válido.' };
  }
  if (!input.preferredDate) {
    return { valid: false, error: 'Selecione a data preferida para a visita.' };
  }

  // Verificar se a data não está no passado
  const selectedDate = new Date(input.preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(selectedDate.getTime()) || selectedDate < today) {
    return { valid: false, error: 'A data da visita deve ser hoje ou uma data futura.' };
  }

  if (!input.preferredTime) {
    return { valid: false, error: 'Selecione o horário preferido para a visita.' };
  }

  if (input.notes && input.notes.length > 1000) {
    return { valid: false, error: 'As observações excedem o limite de 1000 caracteres.' };
  }

  return { valid: true };
}

export const viewingService = {
  async requestViewing(input: CreateViewingInput, propertyCache?: Property | null): Promise<CreateViewingResult> {
    const validation = validateViewingInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 1. Obter e verificar imóvel
    let property: Property | null = propertyCache || null;
    if (!property || property.id !== input.propertyId) {
      const snap = await getDoc(doc(db, 'properties', input.propertyId));
      if (!snap.exists()) {
        throw new Error('Imóvel não encontrado.');
      }
      property = { id: snap.id, ...snap.data() } as Property;
    }

    if (property.isApproved === false) {
      throw new Error('Este imóvel não está disponível para agendamento.');
    }

    const propertyOwnerId = property.agentId || (property as any).ownerId || (property as any).userId;
    if (!propertyOwnerId) {
      throw new Error('Anunciante responsável não encontrado.');
    }

    // 2. FASE 2: Validação estrita da relação Lead -> Viewing
    if (input.leadId) {
      const leadSnap = await getDoc(doc(db, 'leads', input.leadId));
      if (!leadSnap.exists()) {
        throw new Error('O lead associado à visita não foi encontrado.');
      }
      const leadData = leadSnap.data() as Lead;
      if (leadData.propertyId !== input.propertyId) {
        throw new Error('Associação de lead inválida: o lead informado pertence a outro imóvel.');
      }
    }

    const currentUserId = auth.currentUser?.uid || 'guest_' + Date.now();

    // 3. Montar objeto da visita com status estritamente PENDENTE
    const newViewing: Omit<Viewing, 'id'> = {
      propertyId: property.id,
      propertyTitle: property.title,
      ...(input.leadId ? { leadId: input.leadId } : {}),
      requesterId: currentUserId,
      requesterName: input.requesterName.trim(),
      requesterPhone: input.requesterPhone.trim(),
      ...(input.requesterEmail ? { requesterEmail: input.requesterEmail.trim().toLowerCase() } : {}),
      propertyOwnerId,
      agentId: property.agentId || propertyOwnerId,
      ...(property.agent?.agency ? { agencyId: property.agent.agency } : {}),
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      ...(input.alternativeDate ? { alternativeDate: input.alternativeDate } : {}),
      ...(input.alternativeTime ? { alternativeTime: input.alternativeTime } : {}),
      status: 'pending', // Solicitante NUNCA pode auto-confirmar visita
      notes: (input.notes || '').trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'viewings'), newViewing);

    // 4. Notificar Anunciante com tipo canónico 'viewing_requested'
    try {
      await addDoc(collection(db, 'user_notifications'), {
        userId: propertyOwnerId,
        type: 'viewing_requested',
        title: `Pedido de Visita: ${property.title.substring(0, 35)}`,
        message: `${input.requesterName} solicitou visita para ${input.preferredDate} às ${input.preferredTime}.`,
        category: 'viewing',
        entityType: 'viewing',
        entityId: docRef.id,
        propertyId: property.id,
        viewingId: docRef.id,
        ...(input.leadId ? { leadId: input.leadId } : {}),
        link: `/agent/dashboard?tab=viewings&viewingId=${docRef.id}`,
        read: false,
        priority: 'high',
        createdAt: serverTimestamp()
      });
    } catch {
      // Ignora erro de notificação secundária
    }

    // 5. Telemetria de Evento de Negócio Seguro
    await trackLeadEvent(property.id, 'viewing_requested', {
      viewingId: docRef.id,
      ...(input.leadId ? { leadId: input.leadId } : {}),
      source: 'viewing_modal'
    });

    // 6. Se vinculado a um lead, registra na timeline de atividades
    if (input.leadId) {
      try {
        await leadActivityService.createActivity({
          leadId: input.leadId,
          propertyId: property.id,
          type: 'viewing_requested',
          title: `Visita solicitada para ${input.preferredDate} (${input.preferredTime})`,
          metadata: { viewingId: docRef.id, preferredDate: input.preferredDate, preferredTime: input.preferredTime }
        });
      } catch (e) {
        console.warn('[viewingService] Falha ao registrar activity de visita:', e);
      }
    }

    return {
      success: true,
      viewingId: docRef.id,
      message: 'Pedido de visita enviado com sucesso! O anunciante confirmará a disponibilidade.'
    };
  },

  /**
   * Consulta protegida de visitas com índices otimizados.
   */
  async getViewings(filter: GetViewingsFilter): Promise<Viewing[]> {
    const viewingsRef = collection(db, 'viewings');
    const constraints: any[] = [];

    if (filter.agentId) {
      constraints.push(where('agentId', '==', filter.agentId));
    } else if (filter.propertyOwnerId) {
      constraints.push(where('propertyOwnerId', '==', filter.propertyOwnerId));
    } else if (filter.requesterId) {
      constraints.push(where('requesterId', '==', filter.requesterId));
    }

    if (filter.propertyId) {
      constraints.push(where('propertyId', '==', filter.propertyId));
    }

    if (filter.leadId) {
      constraints.push(where('leadId', '==', filter.leadId));
    }

    if (filter.status) {
      constraints.push(where('status', '==', filter.status));
    }

    constraints.push(orderBy('preferredDate', 'asc'));
    constraints.push(limit(filter.limitCount || 50));

    const q = query(viewingsRef, ...constraints);
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Viewing[];
  },

  /**
   * Obter visita por ID.
   */
  async getViewingById(viewingId: string): Promise<Viewing | null> {
    if (!viewingId) return null;
    const snap = await getDoc(doc(db, 'viewings', viewingId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Viewing;
  },

  /**
   * Transição controlada de estado da Visita (Viewing State Machine).
   */
  async updateViewingStatus(
    viewingId: string, 
    newStatus: ViewingStatus, 
    rejectionReason?: string
  ): Promise<{ success: boolean; previousStatus: ViewingStatus; newStatus: ViewingStatus }> {
    if (!viewingId) throw new Error('Identificador da visita é obrigatório.');

    const viewingRef = doc(db, 'viewings', viewingId);
    const snap = await getDoc(viewingRef);
    if (!snap.exists()) {
      throw new Error('Visita não encontrada.');
    }

    const currentViewing = snap.data() as Viewing;
    const currentStatus = currentViewing.status;

    if (!isValidViewingTransition(currentStatus, newStatus)) {
      throw new Error(`Transição de estado inválida: não é permitido alterar visita de "${currentStatus}" para "${newStatus}".`);
    }

    const updates: Record<string, any> = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };

    if (newStatus === 'rejected' && rejectionReason) {
      updates.rejectionReason = rejectionReason.trim();
    }

    await updateDoc(viewingRef, updates);

    // Notificar o solicitante se for utilizador cadastrado
    if (currentViewing.requesterId && !currentViewing.requesterId.startsWith('guest_')) {
      try {
        await addDoc(collection(db, 'user_notifications'), {
          userId: currentViewing.requesterId,
          type: 'viewing_status_changed',
          title: `Atualização da Visita: ${currentViewing.propertyTitle.substring(0, 30)}`,
          message: `O estado da sua visita agendada para ${currentViewing.preferredDate} foi alterado para "${newStatus}".`,
          category: 'viewing',
          entityType: 'viewing',
          entityId: viewingId,
          viewingId,
          propertyId: currentViewing.propertyId,
          read: false,
          priority: 'normal',
          createdAt: serverTimestamp()
        });
      } catch {
        // Notificação secundária não bloqueia fluxo
      }
    }

    // Registra evento de negócio auditável
    await trackLeadEvent(currentViewing.propertyId, 'viewing_status_changed', {
      viewingId,
      source: 'viewing_management'
    });

    // Se vinculado a um lead, registra na timeline do CRM
    if (currentViewing.leadId) {
      try {
        const activityTypeMap: Record<ViewingStatus, LeadActivityType> = {
          confirmed: 'viewing_confirmed',
          completed: 'viewing_completed',
          cancelled: 'viewing_cancelled',
          rejected: 'status_changed',
          no_show: 'status_changed',
          pending: 'status_changed'
        };
        await leadActivityService.createActivity({
          leadId: currentViewing.leadId,
          propertyId: currentViewing.propertyId,
          type: activityTypeMap[newStatus] || 'status_changed',
          title: `Visita ${newStatus === 'confirmed' ? 'confirmada' : newStatus === 'completed' ? 'realizada com sucesso' : newStatus === 'cancelled' ? 'cancelada' : 'atualizada para ' + newStatus}`,
          description: rejectionReason,
          metadata: { viewingId, previousStatus: currentStatus, newStatus }
        });
      } catch (e) {
        console.warn('[viewingService] Falha ao registrar activity de status de visita:', e);
      }
    }

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus
    };
  },

  /**
   * Obtém visitas associadas a um lead específico (ordenadas por data decrescente).
   */
  async getLeadViewings(leadId: string, limitCount = 20): Promise<Viewing[]> {
    if (!leadId) return [];
    const q = query(
      collection(db, 'viewings'),
      where('leadId', '==', leadId),
      orderBy('createdAt', 'desc'),
      limit(Math.min(limitCount, 50))
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Viewing[];
  },

  /**
   * Obtém próximas visitas agendadas para um lead (data futura).
   */
  async getUpcomingLeadViewings(leadId: string, limitCount = 10): Promise<Viewing[]> {
    if (!leadId) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'viewings'),
      where('leadId', '==', leadId),
      where('preferredDate', '>=', todayStr),
      orderBy('preferredDate', 'asc'),
      limit(Math.min(limitCount, 20))
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Viewing[];
  },

  /**
   * Obtém histórico completo de visitas passadas para um lead.
   */
  async getLeadViewingHistory(leadId: string, limitCount = 20): Promise<Viewing[]> {
    return this.getLeadViewings(leadId, limitCount);
  }
};
