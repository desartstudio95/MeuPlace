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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { 
  Lead, 
  LeadSource, 
  LeadStatus, 
  LeadPriority,
  Property, 
  isValidLeadTransition, 
  ALLOWED_LEAD_TRANSITIONS 
} from '@/types';
import { trackLeadEvent } from './leadEventService';
import { leadActivityService } from './leadActivityService';

export { isValidLeadTransition, ALLOWED_LEAD_TRANSITIONS };

export interface CreateLeadInput {
  propertyId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  message: string;
  contactPreference?: 'whatsapp' | 'phone' | 'email';
  source?: LeadSource;
  // Honeypot anti-bot trap (must be empty for human submissions)
  honeypot?: string;
}

export interface CreateLeadResult {
  success: boolean;
  leadId: string;
  isDuplicate: boolean;
  message: string;
}

export interface GetLeadsFilter {
  agentId?: string;
  propertyOwnerId?: string;
  propertyId?: string;
  status?: LeadStatus;
  limitCount?: number;
}

// Anti-Spam: Cooldown local de submissão (10 segundos entre requisições na mesma sessão)
let lastSubmissionTimestamp = 0;
const SUBMISSION_COOLDOWN_MS = 10000;

/**
 * Validação rigorosa dos dados de contacto do lead.
 */
export function validateLeadInput(input: Partial<CreateLeadInput>): { valid: boolean; error?: string } {
  // Verificação de armadilha anti-bot honeypot
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { valid: false, error: 'Submissão bloqueada por filtro anti-bot.' };
  }

  if (!input.propertyId || typeof input.propertyId !== 'string') {
    return { valid: false, error: 'Identificador do imóvel inválido.' };
  }

  const name = (input.customerName || '').trim();
  if (name.length < 2) {
    return { valid: false, error: 'Por favor informe o seu nome completo (mínimo 2 caracteres).' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'O nome informado excede o limite máximo permitido.' };
  }

  const phone = (input.customerPhone || '').replace(/\s+/g, '');
  if (phone.length < 7 || phone.length > 25) {
    return { valid: false, error: 'Por favor informe um número de telefone válido (mínimo 7 dígitos).' };
  }

  if (input.customerEmail) {
    const email = input.customerEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'O formato do email informado é inválido.' };
    }
  }

  const msg = (input.message || '').trim();
  if (msg.length < 5) {
    return { valid: false, error: 'A mensagem deve conter pelo menos 5 caracteres.' };
  }
  if (msg.length > 2000) {
    return { valid: false, error: 'A mensagem excede o limite de 2000 caracteres.' };
  }

  return { valid: true };
}

export const leadService = {
  /**
   * Criação segura de lead com validação de backend/integridade de imóvel,
   * prevenção de duplicação temporal e geração de notificação para o anunciante.
   */
  async createLead(input: CreateLeadInput, propertyCache?: Property | null): Promise<CreateLeadResult> {
    // 1. Validação de formato e anti-spam
    const validation = validateLeadInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const now = Date.now();
    if (now - lastSubmissionTimestamp < SUBMISSION_COOLDOWN_MS) {
      throw new Error('Aguarde alguns segundos antes de enviar outra mensagem.');
    }
    lastSubmissionTimestamp = now;

    // 2. Garantir integridade do Imóvel e derivar destinatários reais
    let property: Property | null = propertyCache || null;
    if (!property || property.id !== input.propertyId) {
      const propSnap = await getDoc(doc(db, 'properties', input.propertyId));
      if (!propSnap.exists()) {
        throw new Error('O imóvel solicitado não foi encontrado no sistema.');
      }
      property = { id: propSnap.id, ...propSnap.data() } as Property;
    }

    // O imóvel deve ser público e aprovado
    if (property.isApproved === false) {
      throw new Error('Este imóvel não está disponível para receber contactos públicos.');
    }

    // Derivação estrita de destinatário (não confiamos no cliente para decidir quem recebe)
    const propertyOwnerId = property.agentId || (property as any).ownerId || (property as any).userId;
    if (!propertyOwnerId) {
      throw new Error('Imóvel sem anunciante responsável registrado.');
    }

    const cleanPhone = input.customerPhone.trim();
    const cleanEmail = input.customerEmail ? input.customerEmail.trim().toLowerCase() : undefined;
    const currentUserId = auth.currentUser?.uid;

    // 3. Verificação de Lead Duplicado (Últimas 24 horas)
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const leadsRef = collection(db, 'leads');
      const duplicateQuery = query(
        leadsRef,
        where('propertyId', '==', property.id),
        where('customerPhone', '==', cleanPhone),
        limit(3)
      );

      const querySnap = await getDocs(duplicateQuery);
      let existingLeadId: string | null = null;

      for (const d of querySnap.docs) {
        const leadData = d.data();
        const createdAtDate = leadData.createdAt?.toDate 
          ? leadData.createdAt.toDate() 
          : new Date(leadData.createdAt || 0);

        if (createdAtDate >= twentyFourHoursAgo && ['new', 'contacted'].includes(leadData.status)) {
          existingLeadId = d.id;
          break;
        }
      }

      // Se já houver lead recente ativo, atualizamos apenas a última interação para evitar spam de docs
      if (existingLeadId) {
        await updateDoc(doc(db, 'leads', existingLeadId), {
          lastContactAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          message: input.message.trim() // Atualiza com a última mensagem
        });

        await trackLeadEvent(property.id, 'lead_created', {
          leadId: existingLeadId,
          source: input.source || 'contact_form'
        });

        return {
          success: true,
          leadId: existingLeadId,
          isDuplicate: true,
          message: 'Recebemos a sua mensagem adicional! O anunciante já possui o seu contacto e responderá em breve.'
        };
      }
    } catch (e) {
      // Se a consulta de duplicação falhar (ex: índice composto em indexação), prossegue criando o lead
      if ((import.meta as any).env?.DEV) {
        console.warn('[LeadService] Verificação de duplicata ignorada por erro de query:', e);
      }
    }

    // 4. Criação do Novo Lead com status estrito 'new' e prioridade padrão 'medium'
    const newLead: Omit<Lead, 'id'> = {
      propertyId: property.id,
      propertyTitle: property.title,
      propertyOwnerId,
      agentId: property.agentId || propertyOwnerId,
      ...(property.agent?.agency ? { agencyId: property.agent.agency } : {}),
      ...(currentUserId ? { customerId: currentUserId } : {}),
      customerName: input.customerName.trim(),
      customerPhone: cleanPhone,
      ...(cleanEmail ? { customerEmail: cleanEmail } : {}),
      message: input.message.trim(),
      contactPreference: input.contactPreference || 'whatsapp',
      source: input.source || 'contact_form',
      status: 'new',
      priority: 'medium',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastContactAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'leads'), newLead);

    // 5. Notificação segura ao Anunciante/Proprietário com tipo canónico 'lead_received'
    try {
      await addDoc(collection(db, 'user_notifications'), {
        userId: propertyOwnerId,
        type: 'lead_received',
        title: `Novo Lead: ${property.title.substring(0, 40)}`,
        message: `${input.customerName.trim()} demonstrou interesse no seu imóvel. Contacto: ${cleanPhone}`,
        category: 'lead',
        entityType: 'lead',
        entityId: docRef.id,
        propertyId: property.id,
        leadId: docRef.id,
        link: `/agent/dashboard?tab=leads&leadId=${docRef.id}`,
        read: false,
        priority: 'high',
        createdAt: serverTimestamp()
      });
    } catch {
      // Notificação secundária não bloqueia a criação do lead
    }

    // 6. Rastreamento de Evento de Negócio Seguro
    await trackLeadEvent(property.id, 'lead_created', {
      leadId: docRef.id,
      source: input.source || 'contact_form'
    });

    // 7. Registro de Atividade Comercial na Timeline (CRM V1)
    try {
      await leadActivityService.createActivity({
        leadId: docRef.id,
        propertyId: property.id,
        type: 'lead_created',
        title: `Oportunidade criada via ${input.source || 'formulário de contacto'}`,
        description: input.message.trim(),
        actorRole: 'buyer',
        metadata: { source: input.source || 'contact_form', customerPhone: cleanPhone }
      });
    } catch (e) {
      console.warn('[leadService] Falha ao registrar activity de criação:', e);
    }

    return {
      success: true,
      leadId: docRef.id,
      isDuplicate: false,
      message: 'O seu contacto foi enviado com sucesso ao anunciante.'
    };
  },

  /**
   * Consulta protegida de leads com filtros indexáveis e limites de proteção.
   */
  async getLeads(filter: GetLeadsFilter): Promise<Lead[]> {
    const leadsRef = collection(db, 'leads');
    const constraints: any[] = [];

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

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(filter.limitCount || 50));

    const q = query(leadsRef, ...constraints);
    const snap = await getDocs(q);

    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as Lead[];
  },

  /**
   * Obter lead por ID com validação de existência.
   */
  async getLeadById(leadId: string): Promise<Lead | null> {
    if (!leadId) return null;
    const snap = await getDoc(doc(db, 'leads', leadId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Lead;
  },

  /**
   * Transição controlada de estado do Lead (State Machine Enforcement).
   * Impede saltos ilegais como won -> new ou modificação arbitrária.
   */
  async updateLeadStatus(
    leadId: string, 
    newStatus: LeadStatus, 
    notes?: string
  ): Promise<{ success: boolean; previousStatus: LeadStatus; newStatus: LeadStatus }> {
    if (!leadId) throw new Error('Identificador do lead é obrigatório.');
    
    const leadRef = doc(db, 'leads', leadId);
    const snap = await getDoc(leadRef);
    if (!snap.exists()) {
      throw new Error('Lead não encontrado.');
    }

    const currentLead = snap.data() as Lead;
    const currentStatus = currentLead.status;

    if (!isValidLeadTransition(currentStatus, newStatus)) {
      throw new Error(`Transição de estado inválida: não é permitido alterar lead de "${currentStatus}" para "${newStatus}".`);
    }

    const updates: Record<string, any> = {
      status: newStatus,
      updatedAt: serverTimestamp()
    };

    if (newStatus === 'contacted' || newStatus === 'qualified' || newStatus === 'negotiating') {
      updates.lastContactAt = serverTimestamp();
    }

    if (newStatus === 'qualified') {
      updates.qualifiedAt = serverTimestamp();
    }

    if (newStatus === 'won') {
      updates.convertedAt = serverTimestamp();
    }

    if (newStatus === 'lost') {
      updates.lostAt = serverTimestamp();
    }

    if (newStatus === 'archived') {
      updates.archivedAt = serverTimestamp();
    }

    if (notes) {
      updates.statusNote = notes.trim();
    }

    await updateDoc(leadRef, updates);

    // Registra evento de negócio auditável
    await trackLeadEvent(currentLead.propertyId, 'lead_status_changed', {
      leadId,
      source: 'crm_lead_management'
    });

    // Registra na timeline de atividades do CRM V1
    try {
      await leadActivityService.createActivity({
        leadId,
        propertyId: currentLead.propertyId,
        type: newStatus === 'won' ? 'converted' : newStatus === 'lost' ? 'lost' : 'status_changed',
        title: `Status alterado de "${currentStatus}" para "${newStatus}"`,
        description: notes,
        metadata: { previousStatus: currentStatus, newStatus }
      });
    } catch (e) {
      console.warn('[leadService] Falha ao registrar activity de status:', e);
    }

    // Notificação operacional para status crítico (won / lost)
    try {
      if (newStatus === 'won' || newStatus === 'lost') {
        const notifyTarget = currentLead.agentId || currentLead.propertyOwnerId;
        if (notifyTarget) {
          await addDoc(collection(db, 'user_notifications'), {
            userId: notifyTarget,
            type: newStatus === 'won' ? 'lead_won' : 'lead_lost',
            title: newStatus === 'won' ? `🎉 Lead Ganho / Convertido!` : `Lead Perdido / Não Fechado`,
            message: newStatus === 'won'
              ? `O lead de ${currentLead.customerName} referente ao imóvel "${currentLead.propertyTitle.substring(0, 30)}" foi marcado como Ganho!`
              : `O lead de ${currentLead.customerName} foi marcado como Perdido.${notes ? ` Motivo: ${notes}` : ''}`,
            category: 'lead',
            entityType: 'lead',
            entityId: leadId,
            leadId,
            propertyId: currentLead.propertyId,
            link: `/crm/leads/${leadId}`,
            read: false,
            priority: newStatus === 'won' ? 'high' : 'normal',
            createdAt: serverTimestamp()
          });
        }
      }
    } catch {
      // Notificação secundária não bloqueia fluxo
    }

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus
    };
  },

  /**
   * Atribuição / Reatribuição de lead para um agente responsável.
   */
  async assignLead(leadId: string, newAgentId: string): Promise<void> {
    if (!leadId) throw new Error('Identificador do lead é obrigatório.');
    if (!newAgentId) throw new Error('Novo agente responsável é obrigatório.');

    const leadRef = doc(db, 'leads', leadId);
    const snap = await getDoc(leadRef);
    if (!snap.exists()) throw new Error('Lead não encontrado.');

    const currentLead = snap.data() as Lead;
    const oldAgentId = currentLead.agentId;

    if (oldAgentId === newAgentId) return;

    await updateDoc(leadRef, {
      agentId: newAgentId,
      updatedAt: serverTimestamp()
    });

    // Registra na timeline de atividades
    try {
      await leadActivityService.logAssignmentChanged(
        leadId, 
        currentLead.propertyId, 
        oldAgentId, 
        newAgentId
      );
    } catch (e) {
      console.warn('[leadService] Falha ao registrar activity de assignment:', e);
    }

    // Notifica o novo agente responsável
    try {
      await addDoc(collection(db, 'user_notifications'), {
        userId: newAgentId,
        type: 'lead_assigned',
        title: `Lead Atribuído: ${currentLead.customerName}`,
        message: `Foi-lhe atribuído o lead de ${currentLead.customerName} referente ao imóvel "${currentLead.propertyTitle.substring(0, 35)}".`,
        category: 'lead',
        entityType: 'lead',
        entityId: leadId,
        leadId,
        propertyId: currentLead.propertyId,
        link: `/crm/leads/${leadId}`,
        read: false,
        priority: 'high',
        createdAt: serverTimestamp()
      });
    } catch {
      // Notificação secundária não bloqueia fluxo
    }
  },

  /**
   * Atualização de prioridade do lead no pipeline CRM.
   */
  async updateLeadPriority(leadId: string, priority: LeadPriority): Promise<void> {
    if (!leadId) throw new Error('Identificador do lead é obrigatório.');
    const leadRef = doc(db, 'leads', leadId);
    const snap = await getDoc(leadRef);
    if (!snap.exists()) throw new Error('Lead não encontrado.');

    const currentLead = snap.data() as Lead;
    const oldPriority = currentLead.priority || 'medium';

    if (oldPriority === priority) return;

    await updateDoc(leadRef, {
      priority,
      updatedAt: serverTimestamp()
    });

    try {
      await leadActivityService.createActivity({
        leadId,
        propertyId: currentLead.propertyId,
        type: 'priority_changed',
        title: `Prioridade alterada de "${oldPriority}" para "${priority}"`,
        description: `Prioridade comercial ajustada para ${priority}.`,
        metadata: { oldPriority, newPriority: priority }
      });
    } catch (e) {
      console.warn('[leadService] Falha ao registrar activity de prioridade:', e);
    }
  },

  /**
   * Adiciona uma nota comercial ao lead.
   */
  async addLeadNote(leadId: string, note: string): Promise<string> {
    if (!leadId) throw new Error('Identificador do lead é obrigatório.');
    const leadRef = doc(db, 'leads', leadId);
    const snap = await getDoc(leadRef);
    if (!snap.exists()) throw new Error('Lead não encontrado.');

    const currentLead = snap.data() as Lead;
    return leadActivityService.logNoteAdded(leadId, currentLead.propertyId, note);
  },

  /**
   * Arquivamento formal de lead.
   */
  async archiveLead(leadId: string): Promise<void> {
    await this.updateLeadStatus(leadId, 'archived');
  }
};
