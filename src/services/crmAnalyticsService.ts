/**
 * MEUPLACE — CRM V1: SALES ANALYTICS SERVICE
 * 
 * Camada centralizada de agregação, cálculos e normalização para o CRM Dashboard.
 * 
 * Princípios Fundamentais:
 * 1. ZERO FAKE DATA: Apenas métricas reais derivadas das coleções existentes (leads, viewings, lead_tasks, lead_activities).
 * 2. RBAC & Tenant Isolation: Apenas dados autorizados ao utilizador (agente/proprietário/admin).
 * 3. Zero N+1: Agregações em memória a partir dos dados no escopo.
 * 4. Fuso Horário de Moçambique (CAT / UTC+2) com boundaries estritos.
 * 5. Proteção Matemática contra Divisão por Zero, NaN e Infinity.
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreUtils';
import { 
  Lead, 
  LeadStatus, 
  LeadPriority, 
  LeadSource, 
  LeadTask, 
  Viewing, 
  LeadActivity,
  UserRole
} from '@/types';
import { 
  CrmDatePreset, 
  getDateRangeBoundaries, 
  isWithinDateRange, 
  generateTrendIntervals, 
  safePercentage,
  parseToDate,
  startOfDayMozambique,
  endOfDayMozambique,
  formatDateMozambique
} from '@/utils/crmDateUtils';
import { 
  calculateLeadScore, 
  determineLeadHealth, 
  calculateStaleInfo, 
  calculateLeadSla, 
  FIRST_CONTACT_SLA_HOURS,
  LeadHealthStatus,
  ScoreBreakdownItem,
  LeadSlaInfo
} from '@/utils/crmIntelligence';
import { deriveLeadNextAction, NextActionInfo } from '@/utils/crmNextAction';

export interface CrmAnalyticsFilter {
  userId: string;
  userRole: UserRole | string;
  scope?: 'assigned' | 'owner' | 'all';
  datePreset?: CrmDatePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  status?: LeadStatus | 'all';
  priority?: LeadPriority | 'all';
  source?: LeadSource | 'all';
  propertyId?: string | 'all';
  agentId?: string | 'all';
}

export interface FunnelStageData {
  stage: 'new' | 'contacted' | 'qualified' | 'negotiating' | 'won';
  label: string;
  count: number;
  conversionRate: number | null; // % em relação à etapa anterior
  overallRate: number | null;    // % em relação ao total do funil
}

export interface TrendPoint {
  key: string;
  date: string;
  fullDate: string;
  newLeads: number;
  wonLeads: number;
  completedViewings: number;
}

export interface LeadSourceStat {
  source: string;
  label: string;
  count: number;
  percentage: number | null;
}

export interface PropertyPerformanceItem {
  propertyId: string;
  propertyTitle: string;
  leadsCount: number;
  viewingsCount: number;
  wonCount: number;
  conversionRate: number | null;
}

export interface AgentPerformanceItem {
  agentId: string;
  agentName: string;
  assignedLeads: number;
  contacted: number;
  qualified: number;
  negotiating: number;
  won: number;
  pendingTasks: number;
  completedTasks: number;
  viewings: number;
  wonRate: number | null;
}

export interface AttentionQueueItem {
  leadId: string;
  customerName: string;
  propertyTitle: string;
  category: 'overdue' | 'no_first_contact' | 'stale' | 'viewing_today' | 'high_priority' | 'no_next_action';
  urgency: 'critical' | 'high' | 'medium';
  reason: string;
  actionText: string;
  score: number;
  health: LeadHealthStatus;
  createdAt: any;
  lastContactAt?: any;
}

export interface CrmSlaMetrics {
  firstContactSlaHours: number;
  averageResponseTimeHours: number | null;
  medianResponseTimeHours: number | null;
  fastestResponseTimeHours: number | null;
  slowestResponseTimeHours: number | null;
  leadsContactedCount: number;
  leadsWithinSlaCount: number;
  leadsBreachedSlaCount: number;
  leadsPendingContactCount: number;
  slaComplianceRate: number | null;
}

export interface CrmSalesProductivity {
  totalAssignedLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  negotiatingLeads: number;
  wonLeads: number;
  completedTasks: number;
  overdueTasks: number;
  completedViewings: number;
  staleLeadsCount: number;
  leadsWithoutNextAction: number;
}

export interface CrmAnalyticsResult {
  period: {
    preset: CrmDatePreset;
    startDate: string;
    endDate: string;
    label: string;
  };
  scope: 'assigned' | 'owner' | 'all';
  kpis: {
    leads: {
      total: number;
      new: number;
      contacted: number;
      qualified: number;
      negotiating: number;
      won: number;
      lost: number;
      archived: number;
      wonRate: number | null;
      qualificationRate: number | null;
      contactRate: number | null;
    };
    tasks: {
      total: number;
      pending: number;
      overdue: number;
      today: number;
      upcoming: number;
      completed: number;
      cancelled: number;
      completionRate: number | null;
    };
    viewings: {
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
      noShow: number;
      completionRate: number | null;
    };
  };
  funnel: {
    stages: FunnelStageData[];
    lostCount: number;
    lostRate: number | null;
    archivedCount: number;
    archivedRate: number | null;
  };
  trend: TrendPoint[];
  sources: LeadSourceStat[];
  propertyPerformance: PropertyPerformanceItem[];
  agentPerformance: AgentPerformanceItem[];
  attentionQueue: AttentionQueueItem[];
  slaMetrics: CrmSlaMetrics;
  salesProductivity: CrmSalesProductivity;
  recentActivities: LeadActivity[];
  availableProperties: { id: string; title: string }[];
  availableAgents: { id: string; name: string }[];
  hasSufficientData: boolean;
  emptyReason?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp Directo',
  contact_form: 'Formulário de Contacto',
  phone: 'Ligação Telefónica',
  viewing_request: 'Pedido de Visita',
  website: 'Website / Portal',
  referral: 'Indicação / Recomendação',
  instagram: 'Instagram',
  facebook: 'Facebook'
};

export const crmAnalyticsService = {
  /**
   * Obtém os analytics completos do CRM respeitando escopo, filtros e período.
   */
  async getDashboardAnalytics(filter: CrmAnalyticsFilter): Promise<CrmAnalyticsResult> {
    const { userId, userRole } = filter;
    if (!userId) {
      throw new Error('Identificação do usuário é obrigatória para consultar o CRM Analytics.');
    }

    // 1. Resolução estrita de escopo (RBAC)
    const isAdmin = userRole === 'admin';
    let resolvedScope: 'assigned' | 'owner' | 'all' = filter.scope || 'assigned';
    if (!isAdmin && resolvedScope === 'all') {
      resolvedScope = 'assigned';
    }

    // 2. Limites temporais no fuso horário de Moçambique (CAT / UTC+2)
    const datePreset = filter.datePreset || '30d';
    const boundaries = getDateRangeBoundaries(datePreset, filter.startDate, filter.endDate);
    const { startDate, endDate, label: periodLabel } = boundaries;

    // 3. Execução paralela de consultas canónicas para as coleções autorizadas
    const [rawLeads, rawTasks, rawViewings, rawActivities] = await Promise.all([
      this.fetchLeadsForScope(userId, resolvedScope, isAdmin),
      this.fetchTasksForScope(userId, resolvedScope, isAdmin),
      this.fetchViewingsForScope(userId, resolvedScope, isAdmin),
      this.fetchActivitiesForScope(userId, resolvedScope, isAdmin)
    ]);

    // 4. Filtragem em memória (Data, Imóvel, Status, Prioridade, Origem, Agente)
    const filteredLeads = rawLeads.filter(lead => {
      // Filtro de data de criação
      if (datePreset !== 'all' && !isWithinDateRange(lead.createdAt, startDate, endDate)) {
        return false;
      }
      // Filtro de imóvel
      if (filter.propertyId && filter.propertyId !== 'all' && lead.propertyId !== filter.propertyId) {
        return false;
      }
      // Filtro de status
      if (filter.status && filter.status !== 'all' && lead.status !== filter.status) {
        return false;
      }
      // Filtro de prioridade
      if (filter.priority && filter.priority !== 'all' && lead.priority !== filter.priority) {
        return false;
      }
      // Filtro de origem
      if (filter.source && filter.source !== 'all' && lead.source !== filter.source) {
        return false;
      }
      // Filtro de agente específico (quando selecionado por admin/gestor)
      if (filter.agentId && filter.agentId !== 'all' && lead.agentId !== filter.agentId) {
        return false;
      }
      return true;
    });

    const filteredViewings = rawViewings.filter(v => {
      if (datePreset !== 'all') {
        const vDate = v.preferredDate || v.createdAt;
        if (!isWithinDateRange(vDate, startDate, endDate)) return false;
      }
      if (filter.propertyId && filter.propertyId !== 'all' && v.propertyId !== filter.propertyId) {
        return false;
      }
      if (filter.agentId && filter.agentId !== 'all' && v.agentId !== filter.agentId) {
        return false;
      }
      return true;
    });

    const filteredTasks = rawTasks.filter(t => {
      if (filter.propertyId && filter.propertyId !== 'all' && t.propertyId !== filter.propertyId) {
        return false;
      }
      if (filter.agentId && filter.agentId !== 'all' && t.assignedTo !== filter.agentId) {
        return false;
      }
      return true;
    });

    // 5. Agregações e Cálculos Matemáticos

    // 5.1 KPIs de Leads
    const totalLeads = filteredLeads.length;
    const leadsNew = filteredLeads.filter(l => l.status === 'new').length;
    const leadsContacted = filteredLeads.filter(l => l.status === 'contacted').length;
    const leadsQualified = filteredLeads.filter(l => l.status === 'qualified').length;
    const leadsNegotiating = filteredLeads.filter(l => l.status === 'negotiating').length;
    const leadsWon = filteredLeads.filter(l => l.status === 'won').length;
    const leadsLost = filteredLeads.filter(l => l.status === 'lost').length;
    const leadsArchived = filteredLeads.filter(l => l.status === 'archived').length;

    const eligibleLeads = totalLeads - leadsArchived;
    const wonRate = safePercentage(leadsWon, eligibleLeads);
    const qualificationRate = safePercentage(leadsQualified + leadsNegotiating + leadsWon, eligibleLeads);
    const contactRate = safePercentage(totalLeads - leadsNew, totalLeads);

    // 5.2 KPIs de Follow-ups (Tarefas)
    const now = new Date();
    const todayStart = startOfDayMozambique(now);
    const todayEnd = endOfDayMozambique(now);

    let tasksPending = 0;
    let tasksOverdue = 0;
    let tasksToday = 0;
    let tasksUpcoming = 0;
    let tasksCompleted = 0;
    let tasksCancelled = 0;

    filteredTasks.forEach(task => {
      if (task.status === 'completed') {
        tasksCompleted++;
      } else if (task.status === 'cancelled') {
        tasksCancelled++;
      } else if (task.status === 'pending') {
        tasksPending++;
        const dueDate = parseToDate(task.dueAt);
        if (!dueDate) {
          tasksUpcoming++;
        } else if (dueDate < todayStart) {
          tasksOverdue++;
        } else if (dueDate >= todayStart && dueDate <= todayEnd) {
          tasksToday++;
        } else {
          tasksUpcoming++;
        }
      }
    });

    const taskCompletionRate = safePercentage(tasksCompleted, tasksCompleted + tasksPending + tasksCancelled);

    // 5.3 KPIs de Visitas (Viewings)
    let vPending = 0;
    let vConfirmed = 0;
    let vCompleted = 0;
    let vCancelled = 0;
    let vNoShow = 0;

    filteredViewings.forEach(v => {
      if (v.status === 'pending') vPending++;
      else if (v.status === 'confirmed') vConfirmed++;
      else if (v.status === 'completed') vCompleted++;
      else if (v.status === 'cancelled' || v.status === 'rejected') vCancelled++;
      else if (v.status === 'no_show') vNoShow++;
    });

    const viewingTotal = filteredViewings.length;
    const viewingCompletionRate = safePercentage(vCompleted, vCompleted + vConfirmed + vNoShow + vCancelled);

    // 5.4 Funil de Vendas Comercial
    // Na máquina de estados: quem alcançou 'won' passou pelas fases anteriores
    const funnelWonCount = leadsWon;
    const funnelNegotiatingCount = leadsNegotiating + funnelWonCount;
    const funnelQualifiedCount = leadsQualified + funnelNegotiatingCount;
    const funnelContactedCount = leadsContacted + funnelQualifiedCount;
    const funnelNewCount = totalLeads - leadsArchived; // Elegíveis que entraram no funil

    const funnelStages: FunnelStageData[] = [
      {
        stage: 'new',
        label: 'Novos / Entrada',
        count: funnelNewCount,
        conversionRate: funnelNewCount > 0 ? 100 : null,
        overallRate: 100
      },
      {
        stage: 'contacted',
        label: 'Contactados',
        count: funnelContactedCount,
        conversionRate: safePercentage(funnelContactedCount, funnelNewCount),
        overallRate: safePercentage(funnelContactedCount, funnelNewCount)
      },
      {
        stage: 'qualified',
        label: 'Qualificados',
        count: funnelQualifiedCount,
        conversionRate: safePercentage(funnelQualifiedCount, funnelContactedCount),
        overallRate: safePercentage(funnelQualifiedCount, funnelNewCount)
      },
      {
        stage: 'negotiating',
        label: 'Em Negociação',
        count: funnelNegotiatingCount,
        conversionRate: safePercentage(funnelNegotiatingCount, funnelQualifiedCount),
        overallRate: safePercentage(funnelNegotiatingCount, funnelNewCount)
      },
      {
        stage: 'won',
        label: 'Negócios Ganhos',
        count: funnelWonCount,
        conversionRate: safePercentage(funnelWonCount, funnelNegotiatingCount),
        overallRate: safePercentage(funnelWonCount, funnelNewCount)
      }
    ];

    const lostRate = safePercentage(leadsLost, totalLeads);
    const archivedRate = safePercentage(leadsArchived, totalLeads);

    // 5.5 Gráfico de Tendência (Trend Intervals discretos)
    const trendIntervals = generateTrendIntervals(datePreset, startDate, endDate);
    const trendPoints: TrendPoint[] = trendIntervals.map(interval => {
      // Contagem real de leads criados neste intervalo
      const newLeads = filteredLeads.filter(l => isWithinDateRange(l.createdAt, interval.start, interval.end)).length;
      
      // Contagem de leads fechados/convertidos neste intervalo
      const wonLeads = filteredLeads.filter(l => {
        if (l.status !== 'won') return false;
        const wonDate = l.convertedAt || l.updatedAt;
        return isWithinDateRange(wonDate, interval.start, interval.end);
      }).length;

      // Visitas realizadas neste intervalo
      const completedViewings = filteredViewings.filter(v => {
        if (v.status !== 'completed') return false;
        const vDate = v.preferredDate || v.updatedAt;
        return isWithinDateRange(vDate, interval.start, interval.end);
      }).length;

      return {
        key: interval.key,
        date: interval.label,
        fullDate: interval.fullDate,
        newLeads,
        wonLeads,
        completedViewings
      };
    });

    // 5.6 Origens de Leads (Lead Sources)
    const sourceCountMap = new Map<string, number>();
    filteredLeads.forEach(lead => {
      const src = lead.source || 'sem_informacao';
      sourceCountMap.set(src, (sourceCountMap.get(src) || 0) + 1);
    });

    const sources: LeadSourceStat[] = Array.from(sourceCountMap.entries())
      .map(([sourceKey, count]) => ({
        source: sourceKey,
        label: SOURCE_LABELS[sourceKey] || (sourceKey === 'sem_informacao' ? 'Sem informação' : sourceKey),
        count,
        percentage: safePercentage(count, totalLeads)
      }))
      .sort((a, b) => b.count - a.count);

    // 5.7 Desempenho por Imóvel (Property Performance) — ZERO N+1
    const propertyMap = new Map<string, {
      propertyTitle: string;
      leadsCount: number;
      viewingsCount: number;
      wonCount: number;
    }>();

    filteredLeads.forEach(lead => {
      const propId = lead.propertyId || 'prop_sem_id';
      const existing = propertyMap.get(propId) || {
        propertyTitle: lead.propertyTitle || 'Imóvel sem título',
        leadsCount: 0,
        viewingsCount: 0,
        wonCount: 0
      };
      existing.leadsCount++;
      if (lead.status === 'won') existing.wonCount++;
      propertyMap.set(propId, existing);
    });

    filteredViewings.forEach(v => {
      const propId = v.propertyId || 'prop_sem_id';
      const existing = propertyMap.get(propId) || {
        propertyTitle: v.propertyTitle || 'Imóvel sem título',
        leadsCount: 0,
        viewingsCount: 0,
        wonCount: 0
      };
      existing.viewingsCount++;
      propertyMap.set(propId, existing);
    });

    const propertyPerformance: PropertyPerformanceItem[] = Array.from(propertyMap.entries())
      .map(([propId, data]) => ({
        propertyId: propId,
        propertyTitle: data.propertyTitle,
        leadsCount: data.leadsCount,
        viewingsCount: data.viewingsCount,
        wonCount: data.wonCount,
        conversionRate: safePercentage(data.wonCount, data.leadsCount)
      }))
      .sort((a, b) => b.leadsCount - a.leadsCount);

    // 5.8 Desempenho Operacional por Agente (Apenas métricas operacionais, ZERO ranking competitivo)
    const agentMap = new Map<string, AgentPerformanceItem>();

    filteredLeads.forEach(lead => {
      const agId = lead.agentId || lead.propertyOwnerId || 'nao_atribuido';
      const item = agentMap.get(agId) || {
        agentId: agId,
        agentName: agId === userId ? 'Meu Atendimento' : `Agente ${agId.slice(0, 6)}`,
        assignedLeads: 0,
        contacted: 0,
        qualified: 0,
        negotiating: 0,
        won: 0,
        pendingTasks: 0,
        completedTasks: 0,
        viewings: 0,
        wonRate: null
      };

      item.assignedLeads++;
      if (['contacted', 'qualified', 'negotiating', 'won'].includes(lead.status)) item.contacted++;
      if (['qualified', 'negotiating', 'won'].includes(lead.status)) item.qualified++;
      if (['negotiating', 'won'].includes(lead.status)) item.negotiating++;
      if (lead.status === 'won') item.won++;

      agentMap.set(agId, item);
    });

    filteredTasks.forEach(task => {
      const agId = task.assignedTo || 'nao_atribuido';
      const item = agentMap.get(agId);
      if (item) {
        if (task.status === 'pending') item.pendingTasks++;
        if (task.status === 'completed') item.completedTasks++;
      }
    });

    filteredViewings.forEach(v => {
      const agId = v.agentId || v.propertyOwnerId || 'nao_atribuido';
      const item = agentMap.get(agId);
      if (item) {
        item.viewings++;
      }
    });

    const agentPerformance: AgentPerformanceItem[] = Array.from(agentMap.values()).map(item => ({
      ...item,
      wonRate: safePercentage(item.won, item.assignedLeads)
    }));

    // 5.9 Lista de Imóveis e Agentes disponíveis para os Dropdowns de Filtro
    const availableProperties = Array.from(propertyMap.entries()).map(([id, p]) => ({
      id,
      title: p.propertyTitle
    }));

    const availableAgents = agentPerformance.map(a => ({
      id: a.agentId,
      name: a.agentName
    }));

    // 5.10 Atividades Comerciais Recentes (Timeline Pulse)
    const recentActivities = rawActivities.slice(0, 10);

    // 5.11 Fila de Atenção Prioritária (Attention Queue) & Inteligência Comercial Determinística
    const attentionQueue: AttentionQueueItem[] = [];
    const responseTimes: number[] = [];
    let leadsWithinSlaCount = 0;
    let leadsBreachedSlaCount = 0;
    let leadsPendingContactCount = 0;
    let staleLeadsCount = 0;
    let leadsWithoutNextActionCount = 0;

    filteredLeads.forEach(lead => {
      const leadTasks = filteredTasks.filter(t => t.leadId === lead.id);
      const leadViewings = filteredViewings.filter(v => v.leadId === lead.id);
      const leadActivities = rawActivities.filter(a => a.leadId === lead.id);

      const scoreResult = calculateLeadScore(lead, leadTasks, leadViewings, leadActivities, now);
      const healthInfo = determineLeadHealth(lead, scoreResult.score, leadTasks, leadActivities, now);
      const staleInfo = calculateStaleInfo(lead, leadActivities, now);
      const slaInfo = calculateLeadSla(lead, leadActivities, now, FIRST_CONTACT_SLA_HOURS);
      const nextAction = deriveLeadNextAction(lead, leadTasks, leadViewings, leadActivities, now);

      const isOpenOpportunity = lead.status !== 'won' && lead.status !== 'lost' && lead.status !== 'archived';

      if (staleInfo.isStale && isOpenOpportunity) {
        staleLeadsCount++;
      }

      if (nextAction.type === 'idle' && isOpenOpportunity) {
        leadsWithoutNextActionCount++;
      }

      // Rastreamento de Tempo de Resposta e SLA
      if (slaInfo.hasContact && slaInfo.responseTimeHours !== null) {
        responseTimes.push(slaInfo.responseTimeHours);
        if (slaInfo.isWithinSla) {
          leadsWithinSlaCount++;
        } else {
          leadsBreachedSlaCount++;
        }
      } else if (isOpenOpportunity) {
        if (slaInfo.isBreached) {
          leadsBreachedSlaCount++;
        } else {
          leadsPendingContactCount++;
        }
      }

      // Elegibilidade para a Fila de Atenção (apenas oportunidades ativas e abertas)
      if (isOpenOpportunity) {
        let queueItem: AttentionQueueItem | null = null;

        // 1. Tarefa de follow-up atrasada
        if (nextAction.type === 'task_overdue') {
          queueItem = {
            leadId: lead.id || '',
            customerName: lead.customerName,
            propertyTitle: lead.propertyTitle,
            category: 'overdue',
            urgency: 'critical',
            reason: nextAction.reason,
            actionText: nextAction.action,
            score: scoreResult.score,
            health: healthInfo.status,
            createdAt: lead.createdAt,
            lastContactAt: lead.lastContactAt
          };
        }
        // 2. Visita agendada para hoje
        else if (nextAction.type === 'viewing_today') {
          queueItem = {
            leadId: lead.id || '',
            customerName: lead.customerName,
            propertyTitle: lead.propertyTitle,
            category: 'viewing_today',
            urgency: 'critical',
            reason: nextAction.reason,
            actionText: nextAction.action,
            score: scoreResult.score,
            health: healthInfo.status,
            createdAt: lead.createdAt,
            lastContactAt: lead.lastContactAt
          };
        }
        // 3. Lead novo sem primeiro contacto
        else if (lead.status === 'new') {
          queueItem = {
            leadId: lead.id || '',
            customerName: lead.customerName,
            propertyTitle: lead.propertyTitle,
            category: 'no_first_contact',
            urgency: slaInfo.isBreached ? 'critical' : 'high',
            reason: slaInfo.isBreached ? `Aguardando atendimento há mais de ${FIRST_CONTACT_SLA_HOURS}h (Fora do SLA).` : 'Lead novo aguardando primeiro contacto comercial.',
            actionText: 'Registrar primeiro contacto',
            score: scoreResult.score,
            health: healthInfo.status,
            createdAt: lead.createdAt,
            lastContactAt: lead.lastContactAt
          };
        }
        // 4. Lead parado / Stale
        else if (staleInfo.isStale) {
          queueItem = {
            leadId: lead.id || '',
            customerName: lead.customerName,
            propertyTitle: lead.propertyTitle,
            category: 'stale',
            urgency: 'high',
            reason: `Sem interação comercial há ${staleInfo.daysInactive} dias.`,
            actionText: 'Reativar lead',
            score: scoreResult.score,
            health: healthInfo.status,
            createdAt: lead.createdAt,
            lastContactAt: lead.lastContactAt
          };
        }
        // 5. Prioridade alta sem próxima ação
        else if (lead.priority === 'high' && nextAction.type === 'idle') {
          queueItem = {
            leadId: lead.id || '',
            customerName: lead.customerName,
            propertyTitle: lead.propertyTitle,
            category: 'high_priority',
            urgency: 'medium',
            reason: 'Lead de alta prioridade sem follow-up programado.',
            actionText: 'Agendar follow-up',
            score: scoreResult.score,
            health: healthInfo.status,
            createdAt: lead.createdAt,
            lastContactAt: lead.lastContactAt
          };
        }
        // 6. Sem nenhuma ação futura definida
        else if (nextAction.type === 'idle') {
          queueItem = {
            leadId: lead.id || '',
            customerName: lead.customerName,
            propertyTitle: lead.propertyTitle,
            category: 'no_next_action',
            urgency: 'medium',
            reason: 'Oportunidade ativa sem tarefa ou visita programada.',
            actionText: 'Programar follow-up',
            score: scoreResult.score,
            health: healthInfo.status,
            createdAt: lead.createdAt,
            lastContactAt: lead.lastContactAt
          };
        }

        if (queueItem) {
          attentionQueue.push(queueItem);
        }
      }
    });

    // Ordenação da fila de atenção: urgência (critical > high > medium) e score desc
    const urgencyWeight = { critical: 0, high: 1, medium: 2 };
    attentionQueue.sort((a, b) => {
      const uDiff = urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
      if (uDiff !== 0) return uDiff;
      return b.score - a.score;
    });

    // Métricas de SLA
    const contactedCount = responseTimes.length;
    let avgResponseTime: number | null = null;
    let medianResponseTime: number | null = null;
    let fastestResponseTime: number | null = null;
    let slowestResponseTime: number | null = null;

    if (contactedCount > 0) {
      const sum = responseTimes.reduce((acc, v) => acc + v, 0);
      avgResponseTime = Math.round((sum / contactedCount) * 10) / 10;

      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      fastestResponseTime = sortedTimes[0];
      slowestResponseTime = sortedTimes[sortedTimes.length - 1];

      const mid = Math.floor(sortedTimes.length / 2);
      medianResponseTime = sortedTimes.length % 2 !== 0
        ? sortedTimes[mid]
        : Math.round(((sortedTimes[mid - 1] + sortedTimes[mid]) / 2) * 10) / 10;
    }

    const slaMetrics: CrmSlaMetrics = {
      firstContactSlaHours: FIRST_CONTACT_SLA_HOURS,
      averageResponseTimeHours: avgResponseTime,
      medianResponseTimeHours: medianResponseTime,
      fastestResponseTimeHours: fastestResponseTime,
      slowestResponseTimeHours: slowestResponseTime,
      leadsContactedCount: contactedCount,
      leadsWithinSlaCount,
      leadsBreachedSlaCount,
      leadsPendingContactCount,
      slaComplianceRate: safePercentage(leadsWithinSlaCount, contactedCount)
    };

    // Produtividade Comercial
    const salesProductivity: CrmSalesProductivity = {
      totalAssignedLeads: totalLeads,
      contactedLeads: leadsContacted,
      qualifiedLeads: leadsQualified,
      negotiatingLeads: leadsNegotiating,
      wonLeads: leadsWon,
      completedTasks: tasksCompleted,
      overdueTasks: tasksOverdue,
      completedViewings: vCompleted,
      staleLeadsCount,
      leadsWithoutNextAction: leadsWithoutNextActionCount
    };

    const hasSufficientData = totalLeads > 0 || filteredTasks.length > 0 || filteredViewings.length > 0;

    return {
      period: {
        preset: datePreset,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        label: periodLabel
      },
      scope: resolvedScope,
      kpis: {
        leads: {
          total: totalLeads,
          new: leadsNew,
          contacted: leadsContacted,
          qualified: leadsQualified,
          negotiating: leadsNegotiating,
          won: leadsWon,
          lost: leadsLost,
          archived: leadsArchived,
          wonRate,
          qualificationRate,
          contactRate
        },
        tasks: {
          total: filteredTasks.length,
          pending: tasksPending,
          overdue: tasksOverdue,
          today: tasksToday,
          upcoming: tasksUpcoming,
          completed: tasksCompleted,
          cancelled: tasksCancelled,
          completionRate: taskCompletionRate
        },
        viewings: {
          total: viewingTotal,
          pending: vPending,
          confirmed: vConfirmed,
          completed: vCompleted,
          cancelled: vCancelled,
          noShow: vNoShow,
          completionRate: viewingCompletionRate
        }
      },
      funnel: {
        stages: funnelStages,
        lostCount: leadsLost,
        lostRate,
        archivedCount: leadsArchived,
        archivedRate
      },
      trend: trendPoints,
      sources,
      propertyPerformance,
      agentPerformance,
      attentionQueue,
      slaMetrics,
      salesProductivity,
      recentActivities,
      availableProperties,
      availableAgents,
      hasSufficientData,
      emptyReason: !hasSufficientData ? 'Nenhum lead ou atividade comercial registrada no período selecionado.' : undefined
    };
  },

  /**
   * Busca Leads correspondentes ao escopo de autorização do utilizador.
   */
  async fetchLeadsForScope(userId: string, scope: 'assigned' | 'owner' | 'all', isAdmin: boolean): Promise<Lead[]> {
    const leadsRef = collection(db, 'leads');
    const constraints: QueryConstraint[] = [];

    if (scope === 'assigned' && userId) {
      constraints.push(where('agentId', '==', userId));
    } else if (scope === 'owner' && userId) {
      constraints.push(where('propertyOwnerId', '==', userId));
    } else if (scope === 'all' && isAdmin) {
      // Admin pode ver todos os leads
    } else {
      constraints.push(where('agentId', '==', userId));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(500)); // Limite de proteção contra varredura ilimitada

    try {
      const q = query(leadsRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Lead, 'id'>)
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'leads');
      return [];
    }
  },

  /**
   * Busca Tarefas (Follow-ups) do utilizador.
   */
  async fetchTasksForScope(userId: string, scope: 'assigned' | 'owner' | 'all', isAdmin: boolean): Promise<LeadTask[]> {
    const tasksRef = collection(db, 'lead_tasks');
    const constraints: QueryConstraint[] = [];

    if (scope === 'all' && isAdmin) {
      constraints.push(orderBy('dueAt', 'asc'));
      constraints.push(limit(500));
    } else {
      constraints.push(where('assignedTo', '==', userId));
      constraints.push(orderBy('dueAt', 'asc'));
      constraints.push(limit(200));
    }

    try {
      const q = query(tasksRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<LeadTask, 'id'>)
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'lead_tasks');
      return [];
    }
  },

  /**
   * Busca Visitas do utilizador.
   */
  async fetchViewingsForScope(userId: string, scope: 'assigned' | 'owner' | 'all', isAdmin: boolean): Promise<Viewing[]> {
    const viewingsRef = collection(db, 'viewings');
    const constraints: QueryConstraint[] = [];

    if (scope === 'assigned' && userId) {
      constraints.push(where('agentId', '==', userId));
    } else if (scope === 'owner' && userId) {
      constraints.push(where('propertyOwnerId', '==', userId));
    } else if (scope === 'all' && isAdmin) {
      // Sem filtro de agente para admin
    } else {
      constraints.push(where('agentId', '==', userId));
    }

    constraints.push(orderBy('preferredDate', 'asc'));
    constraints.push(limit(300));

    try {
      const q = query(viewingsRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Viewing, 'id'>)
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'viewings');
      return [];
    }
  },

  /**
   * Busca Atividades Comerciais Recentes.
   */
  async fetchActivitiesForScope(userId: string, scope: 'assigned' | 'owner' | 'all', isAdmin: boolean): Promise<LeadActivity[]> {
    const activitiesRef = collection(db, 'lead_activities');
    const constraints: QueryConstraint[] = [];

    if (scope === 'all' && isAdmin) {
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(20));
    } else {
      constraints.push(where('actorId', '==', userId));
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(20));
    }

    try {
      const q = query(activitiesRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<LeadActivity, 'id'>)
      }));
    } catch {
      // Se não houver índice composto de actorId+createdAt, tenta sem quebrar o dashboard
      return [];
    }
  }
};
