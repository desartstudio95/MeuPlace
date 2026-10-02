/**
 * MEUPLACE — CRM V1: DETERMINISTIC INTELLIGENCE & SALES PRODUCTIVITY (FASE 5.5)
 * 
 * REGRA ABSOLUTA: 100% DETERMINÍSTICO — ZERO IA / ZERO MACHINE LEARNING
 * Todas as pontuações, indicadores de saúde e status de SLA são baseados em regras
 * comerciais estritas, reproduzíveis e auditáveis sobre dados reais existentes.
 */

import { 
  Lead, 
  LeadTask, 
  Viewing, 
  LeadActivity, 
  LeadStatus, 
  LeadPriority 
} from '@/types';
import { parseToDate } from '@/utils/crmDateUtils';

// =============================================================================
// 1. CONFIGURAÇÕES E CONSTANTES OPERACIONAIS (SLA & THRESHOLDS)
// =============================================================================

export const FIRST_CONTACT_SLA_HOURS = 24; // SLA padrão de primeiro atendimento: 24 horas
export const STALE_ATTENTION_DAYS = 3;     // Início de atenção por inatividade: 3 dias
export const STALE_CRITICAL_DAYS = 7;      // Classificação como Stale / Parado: 7 dias

// Tipos de atividade que confirmam contacto comercial ativo (exclui telemetria de navegação)
export const COMMERCIAL_CONTACT_ACTIVITY_TYPES = [
  'lead_contacted',
  'call_logged',
  'whatsapp_sent',
  'email_sent'
] as const;

// =============================================================================
// 2. LEAD SCORING DETERMINÍSTICO V1 (0 - 100)
// =============================================================================

export interface ScoreBreakdownItem {
  ruleId: string;
  description: string;
  points: number; // positivo para bonificação, negativo para penalização
}

export interface LeadScoreResult {
  score: number; // 0 a 100 normalizado
  breakdown: ScoreBreakdownItem[];
  rawTotal: number;
}

/**
 * Calcula a pontuação determinística do Lead (0-100) com justificativa detalhada.
 * Zero IA. Zero probabilidade. Zero Math.random().
 */
export function calculateLeadScore(
  lead: Lead,
  tasks: LeadTask[] = [],
  viewings: Viewing[] = [],
  activities: LeadActivity[] = [],
  nowReference: Date = new Date()
): LeadScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  let total = 0;

  // 1. Pontuação pelo Estágio do Funil (Pipeline Status)
  switch (lead.status) {
    case 'won':
      breakdown.push({ ruleId: 'status_won', description: 'Negócio fechado e ganho', points: 50 });
      total += 50;
      break;
    case 'negotiating':
      breakdown.push({ ruleId: 'status_negotiating', description: 'Proposta comercial em negociação ativa', points: 35 });
      total += 35;
      break;
    case 'qualified':
      breakdown.push({ ruleId: 'status_qualified', description: 'Comprador qualificado e interesse validado', points: 25 });
      total += 25;
      break;
    case 'contacted':
      breakdown.push({ ruleId: 'status_contacted', description: 'Primeiro contacto realizado com o cliente', points: 15 });
      total += 15;
      break;
    case 'new':
      breakdown.push({ ruleId: 'status_new', description: 'Lead novo recém-registrado na base', points: 5 });
      total += 5;
      break;
    case 'lost':
      breakdown.push({ ruleId: 'status_lost', description: 'Negócio perdido / não convertido', points: -25 });
      total -= 25;
      break;
    case 'archived':
      breakdown.push({ ruleId: 'status_archived', description: 'Lead arquivado ou descartado', points: -35 });
      total -= 35;
      break;
  }

  // 2. Pontuação por Prioridade Comercial
  const priority = lead.priority || 'medium';
  if (priority === 'high') {
    breakdown.push({ ruleId: 'priority_high', description: 'Prioridade alta / urgente atribuída', points: 10 });
    total += 10;
  } else if (priority === 'medium') {
    breakdown.push({ ruleId: 'priority_medium', description: 'Prioridade padrão (média)', points: 5 });
    total += 5;
  }

  // 3. Contacto Comercial Efetivo
  const hasCommercialContact = activities.some(a => 
    COMMERCIAL_CONTACT_ACTIVITY_TYPES.includes(a.type as any)
  ) || lead.status !== 'new';

  if (hasCommercialContact) {
    breakdown.push({ ruleId: 'contact_verified', description: 'Atendimento comercial ativo verificado', points: 15 });
    total += 15;
  }

  // 4. Agendamentos de Visita ao Imóvel (Viewings)
  const completedViewings = viewings.filter(v => v.status === 'completed');
  const confirmedViewings = viewings.filter(v => v.status === 'confirmed');
  const pendingViewings = viewings.filter(v => v.status === 'pending');
  const noShowViewings = viewings.filter(v => v.status === 'no_show');

  if (completedViewings.length > 0) {
    breakdown.push({ ruleId: 'viewing_completed', description: `${completedViewings.length} visita(s) presencial(is) realizada(s)`, points: 20 });
    total += 20;
  } else if (confirmedViewings.length > 0) {
    breakdown.push({ ruleId: 'viewing_confirmed', description: 'Visita agendada e confirmada', points: 15 });
    total += 15;
  } else if (pendingViewings.length > 0) {
    breakdown.push({ ruleId: 'viewing_requested', description: 'Solicitação de visita registrada', points: 10 });
    total += 10;
  }

  if (noShowViewings.length > 0) {
    breakdown.push({ ruleId: 'viewing_noshow', description: 'Cliente não compareceu à visita (no-show)', points: -10 });
    total -= 10;
  }

  // 5. Histórico de Follow-ups (Tarefas)
  const completedTasks = tasks.filter(t => t.status === 'completed');
  if (completedTasks.length > 0) {
    const taskPoints = Math.min(completedTasks.length * 5, 15);
    breakdown.push({ ruleId: 'tasks_completed', description: `${completedTasks.length} follow-up(s) cumprido(s) com sucesso`, points: taskPoints });
    total += taskPoints;
  }

  // 6. Penalidade por Tarefas Atrasadas (Overdue)
  const nowMs = nowReference.getTime();
  const overdueTasks = tasks.filter(t => {
    if (t.status !== 'pending' || !t.dueAt) return false;
    const d = parseToDate(t.dueAt);
    return d ? d.getTime() < nowMs : false;
  });

  if (overdueTasks.length > 0) {
    const penalty = Math.min(overdueTasks.length * 15, 30);
    breakdown.push({ ruleId: 'tasks_overdue', description: `${overdueTasks.length} tarefa(s) de follow-up atrasada(s)`, points: -penalty });
    total -= penalty;
  }

  // 7. Recência da Atividade Comercial
  const lastActiveDate = getLatestCommercialDate(lead, activities);
  if (lastActiveDate) {
    const diffHours = (nowMs - lastActiveDate.getTime()) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffDays <= 2) {
      breakdown.push({ ruleId: 'activity_fresh', description: 'Interação comercial recente (últimas 48h)', points: 10 });
      total += 10;
    } else if (diffDays <= 6) {
      breakdown.push({ ruleId: 'activity_moderate', description: 'Interação comercial nos últimos 6 dias', points: 5 });
      total += 5;
    } else if (diffDays >= STALE_CRITICAL_DAYS && lead.status !== 'won' && lead.status !== 'archived') {
      const stalePenalty = diffDays >= 14 ? 20 : 10;
      breakdown.push({ ruleId: 'stale_inactivity', description: `Sem interação comercial há ${Math.floor(diffDays)} dias`, points: -stalePenalty });
      total -= stalePenalty;
    }
  }

  // 8. Penalidade de SLA para Lead Novo
  if (lead.status === 'new') {
    const createdDate = parseToDate(lead.createdAt);
    if (createdDate) {
      const hoursSinceCreation = (nowMs - createdDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > FIRST_CONTACT_SLA_HOURS) {
        breakdown.push({ ruleId: 'sla_breached', description: `Lead sem contacto inicial há mais de ${FIRST_CONTACT_SLA_HOURS}h`, points: -15 });
        total -= 15;
      }
    }
  }

  // Normalização estrita 0 - 100 com proteção contra NaN e Infinity
  const safeTotal = Number.isFinite(total) ? Math.round(total) : 0;
  const normalizedScore = Math.max(0, Math.min(100, safeTotal));

  // Explicabilidade: Garante que a soma dos itens do breakdown seja 100% idêntica ao score final
  if (safeTotal > 100) {
    breakdown.push({
      ruleId: 'score_cap',
      description: 'Ajuste de normalização ao teto máximo (100 pts)',
      points: -(safeTotal - 100)
    });
  } else if (safeTotal < 0) {
    breakdown.push({
      ruleId: 'score_floor',
      description: 'Ajuste de normalização ao piso mínimo (0 pts)',
      points: -safeTotal
    });
  }

  return {
    score: normalizedScore,
    breakdown,
    rawTotal: safeTotal
  };
}

// =============================================================================
// 3. ESTADO OPERACIONAL DE SAÚDE DO LEAD (LEAD HEALTH / ENGAGEMENT)
// =============================================================================

export type LeadHealthStatus = 'healthy' | 'attention' | 'stale';

export interface LeadHealthInfo {
  status: LeadHealthStatus;
  label: string;
  badgeVariant: 'emerald' | 'amber' | 'rose';
  reason: string;
}

/**
 * Avalia o estado operacional de saúde do Lead a partir de regras comerciais transparentes.
 */
export function determineLeadHealth(
  lead: Lead,
  score: number,
  tasks: LeadTask[] = [],
  activities: LeadActivity[] = [],
  nowReference: Date = new Date()
): LeadHealthInfo {
  // Desfechos fechados possuem estado fixo e não são tratados como leads ativos estagnados
  if (lead.status === 'won') {
    return {
      status: 'healthy',
      label: 'Fechado (Ganho)',
      badgeVariant: 'emerald',
      reason: 'Oportunidade convertida com sucesso em negócio ganho.'
    };
  }
  if (lead.status === 'lost' || lead.status === 'archived') {
    return {
      status: 'healthy',
      label: lead.status === 'lost' ? 'Encerrado (Perdido)' : 'Encerrado (Arquivado)',
      badgeVariant: 'amber',
      reason: 'Oportunidade finalizada e encerrada no pipeline comercial.'
    };
  }

  const nowMs = nowReference.getTime();
  const lastActiveDate = getLatestCommercialDate(lead, activities);
  const diffDays = lastActiveDate ? (nowMs - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24) : 999;

  // Verifica tarefas atrasadas
  const hasOverdueTasks = tasks.some(t => {
    if (t.status !== 'pending' || !t.dueAt) return false;
    const d = parseToDate(t.dueAt);
    return d ? d.getTime() < nowMs : false;
  });

  // Verifica SLA de lead novo
  const createdDate = parseToDate(lead.createdAt);
  const hoursSinceCreation = createdDate ? (nowMs - createdDate.getTime()) / (1000 * 60 * 60) : 0;
  const isNewSlaBreached = lead.status === 'new' && hoursSinceCreation > FIRST_CONTACT_SLA_HOURS;

  // Regra 1: STALE (Parado / Abandono)
  if (diffDays >= STALE_CRITICAL_DAYS || score < 20) {
    return {
      status: 'stale',
      label: 'Parado (Stale)',
      badgeVariant: 'rose',
      reason: `Sem nenhuma interação comercial há ${Math.floor(diffDays)} dias.`
    };
  }

  // Regra 2: ATTENTION (Exige Atenção Imediata)
  if (hasOverdueTasks || isNewSlaBreached || diffDays >= STALE_ATTENTION_DAYS || score < 50) {
    let reason = 'Oportunidade requer acompanhamento do corretor.';
    if (hasOverdueTasks) reason = 'Possui tarefa de follow-up com prazo de vencimento expirado.';
    else if (isNewSlaBreached) reason = `Lead novo aguardando primeiro contacto há mais de ${FIRST_CONTACT_SLA_HOURS}h.`;
    else if (diffDays >= STALE_ATTENTION_DAYS) reason = `Sem interação comercial há ${Math.floor(diffDays)} dias.`;

    return {
      status: 'attention',
      label: 'Atenção Necessária',
      badgeVariant: 'amber',
      reason
    };
  }

  // Regra 3: HEALTHY (Saudável / Ativo)
  return {
    status: 'healthy',
    label: 'Ativo e Saudável',
    badgeVariant: 'emerald',
    reason: 'Comunicação recente, sem tarefas atrasadas e dentro do fluxo regular.'
  };
}

// =============================================================================
// 4. DETECÇÃO DE INATIVIDADE (STALE LEADS)
// =============================================================================

export interface StaleInfo {
  isStale: boolean;
  daysInactive: number;
  lastActivityDate: Date | null;
  statusLabel: 'Ativo' | 'Atenção' | 'Parado';
}

export function calculateStaleInfo(
  lead: Lead,
  activities: LeadActivity[] = [],
  nowReference: Date = new Date()
): StaleInfo {
  // Leads encerrados em estados terminais não são considerados ativos nem estagnados
  if (lead.status === 'won' || lead.status === 'lost' || lead.status === 'archived') {
    return {
      isStale: false,
      daysInactive: 0,
      lastActivityDate: null,
      statusLabel: 'Ativo'
    };
  }

  const lastDate = getLatestCommercialDate(lead, activities);
  if (!lastDate) {
    return {
      isStale: false,
      daysInactive: 0,
      lastActivityDate: null,
      statusLabel: 'Ativo'
    };
  }

  const diffMs = nowReference.getTime() - lastDate.getTime();
  const daysInactive = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let statusLabel: 'Ativo' | 'Atenção' | 'Parado' = 'Ativo';
  if (daysInactive >= STALE_CRITICAL_DAYS) {
    statusLabel = 'Parado';
  } else if (daysInactive >= STALE_ATTENTION_DAYS) {
    statusLabel = 'Atenção';
  }

  return {
    isStale: daysInactive >= STALE_CRITICAL_DAYS,
    daysInactive,
    lastActivityDate: lastDate,
    statusLabel
  };
}

// =============================================================================
// 5. ANÁLISE DE SLA E TEMPO DE PRIMEIRO CONTACTO (RESPONSE TIME)
// =============================================================================

export interface LeadSlaInfo {
  hasContact: boolean;
  firstContactDate: Date | null;
  responseTimeHours: number | null;
  isWithinSla: boolean;
  isBreached: boolean;
  hoursElapsedSinceCreation: number;
  slaStatusText: 'Dentro do SLA' | 'Fora do SLA' | 'Aguardando Contacto';
  slaVariant: 'emerald' | 'rose' | 'amber';
}

/**
 * Calcula o tempo de resposta e conformidade de SLA para o primeiro contacto comercial.
 * Utiliza exclusivamente eventos comerciais (lead_activities), descartando telemetria.
 */
export function calculateLeadSla(
  lead: Lead,
  activities: LeadActivity[] = [],
  nowReference: Date = new Date(),
  slaThresholdHours: number = FIRST_CONTACT_SLA_HOURS
): LeadSlaInfo {
  const createdDate = parseToDate(lead.createdAt);
  const nowMs = nowReference.getTime();
  const createdMs = createdDate && Number.isFinite(createdDate.getTime()) ? createdDate.getTime() : nowMs;
  const hoursElapsed = Math.max(0, Math.round(((nowMs - createdMs) / (1000 * 60 * 60)) * 10) / 10);

  // Localiza a primeira atividade comercial de contacto
  const commercialActivities = activities
    .filter(a => COMMERCIAL_CONTACT_ACTIVITY_TYPES.includes(a.type as any))
    .sort((a, b) => {
      const dateA = parseToDate(a.createdAt)?.getTime() || Infinity;
      const dateB = parseToDate(b.createdAt)?.getTime() || Infinity;
      return dateA - dateB;
    });

  const firstContactActivity = commercialActivities[0];
  const firstContactDate = firstContactActivity ? parseToDate(firstContactActivity.createdAt) : parseToDate(lead.lastContactAt);

  // Cenário 1: Primeiro contacto já foi realizado
  if (firstContactDate && lead.status !== 'new') {
    const contactMs = firstContactDate.getTime();
    if (!Number.isFinite(contactMs) || !Number.isFinite(createdMs)) {
      return {
        hasContact: true,
        firstContactDate,
        responseTimeHours: null,
        isWithinSla: true,
        isBreached: false,
        hoursElapsedSinceCreation: hoursElapsed,
        slaStatusText: 'Dentro do SLA',
        slaVariant: 'emerald'
      };
    }

    // Garante que o tempo de resposta não seja negativo nem NaN/Infinity
    const responseTimeMs = Math.max(0, contactMs - createdMs);
    const responseTimeHours = Math.round((responseTimeMs / (1000 * 60 * 60)) * 10) / 10;
    const isWithinSla = responseTimeHours <= slaThresholdHours;

    return {
      hasContact: true,
      firstContactDate,
      responseTimeHours,
      isWithinSla,
      isBreached: !isWithinSla,
      hoursElapsedSinceCreation: hoursElapsed,
      slaStatusText: isWithinSla ? 'Dentro do SLA' : 'Fora do SLA',
      slaVariant: isWithinSla ? 'emerald' : 'rose'
    };
  }

  // Cenário 2: Lead encerrado em estado terminal sem contacto registrado (não é pendente de contacto)
  if (lead.status === 'lost' || lead.status === 'archived') {
    return {
      hasContact: false,
      firstContactDate: null,
      responseTimeHours: null,
      isWithinSla: true,
      isBreached: false,
      hoursElapsedSinceCreation: hoursElapsed,
      slaStatusText: 'Dentro do SLA',
      slaVariant: 'emerald'
    };
  }

  // Cenário 3: Ainda sem primeiro contacto registrado
  const isBreached = hoursElapsed > slaThresholdHours;

  return {
    hasContact: false,
    firstContactDate: null,
    responseTimeHours: null,
    isWithinSla: !isBreached,
    isBreached,
    hoursElapsedSinceCreation: hoursElapsed,
    slaStatusText: isBreached ? 'Fora do SLA' : 'Aguardando Contacto',
    slaVariant: isBreached ? 'rose' : 'amber'
  };
}

// =============================================================================
// 6. HELPER AUXILIAR: DATA DA ÚLTIMA ATIVIDADE COMERCIAL
// =============================================================================

export function getLatestCommercialDate(lead: Lead, activities: LeadActivity[] = []): Date | null {
  const dates: Date[] = [];

  const created = parseToDate(lead.createdAt);
  if (created) dates.push(created);

  const updated = parseToDate(lead.updatedAt);
  if (updated) dates.push(updated);

  const lastContact = parseToDate(lead.lastContactAt);
  if (lastContact) dates.push(lastContact);

  activities.forEach(a => {
    const d = parseToDate(a.createdAt);
    if (d) dates.push(d);
  });

  if (dates.length === 0) return null;

  return new Date(Math.max(...dates.map(d => d.getTime())));
}
