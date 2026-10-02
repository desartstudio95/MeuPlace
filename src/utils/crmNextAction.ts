/**
 * MEUPLACE — CRM V1: OPERATIONAL NEXT ACTION V1 (FASE 5.5)
 * 
 * Determinação determinística e explicável do próximo passo comercial para o corretor:
 * Prioridade:
 * 1. Tarefa de follow-up atrasada (urgência máxima)
 * 2. Visita agendada para hoje (preparação de visita)
 * 3. Tarefa de follow-up agendada para hoje
 * 4. Visita futura pendente de confirmação ou agendada
 * 5. Primeiro contacto pendente (novo lead)
 * 6. Lead parado / stale (recuperação de contacto)
 * 7. Qualificação de comprador contactado
 * 8. Follow-up programado futuro
 * 9. Em dia / sem ação pendente
 * 
 * Regra: ZERO IA. Ação e justificativa derivadas de dados reais.
 */

import { Lead, LeadTask, Viewing, LeadActivity } from '@/types';
import { parseToDate } from '@/utils/crmDateUtils';
import { getLatestCommercialDate, STALE_CRITICAL_DAYS } from '@/utils/crmIntelligence';

export type NextActionType = 
  | 'task_overdue' 
  | 'viewing_today' 
  | 'task_today' 
  | 'viewing_upcoming' 
  | 'contact_needed' 
  | 'stale_recovery' 
  | 'qualify_needed' 
  | 'task_upcoming' 
  | 'idle';

export interface NextActionInfo {
  type: NextActionType;
  title: string;
  action: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  badgeText: string;
  badgeVariant: 'rose' | 'amber' | 'blue' | 'emerald' | 'gray';
  dueDate?: string;
  targetId?: string;
  sourceEntity?: 'lead' | 'task' | 'viewing' | 'activity';
}

/**
 * Deriva a próxima ação operacional a partir de entidades reais carregadas.
 * Produz resultado 100% determinístico e explicável.
 */
export function deriveLeadNextAction(
  lead: Lead,
  tasks: LeadTask[] = [],
  viewings: Viewing[] = [],
  activities: LeadActivity[] = [],
  nowReference: Date = new Date()
): NextActionInfo {
  const now = nowReference;
  const todayStr = now.toISOString().slice(0, 10);
  const nowMs = now.getTime();

  // Estados Terminais: Leads encerrados (won, lost, archived) não possuem ações operacionais ativas pendentes
  if (lead.status === 'won') {
    return {
      type: 'idle',
      title: 'Negócio fechado e ganho',
      action: 'Nenhuma ação pendente',
      description: 'Oportunidade convertida com sucesso em negócio ganho.',
      reason: 'Lead ganho e finalizado.',
      priority: 'low',
      badgeText: 'Ganho',
      badgeVariant: 'emerald',
      sourceEntity: 'lead'
    };
  }

  if (lead.status === 'lost') {
    return {
      type: 'idle',
      title: 'Oportunidade perdida',
      action: 'Nenhuma ação pendente',
      description: 'Lead encerrado sem conversão no pipeline.',
      reason: 'Oportunidade encerrada como perdida.',
      priority: 'low',
      badgeText: 'Perdido',
      badgeVariant: 'gray',
      sourceEntity: 'lead'
    };
  }

  if (lead.status === 'archived') {
    return {
      type: 'idle',
      title: 'Lead arquivado',
      action: 'Nenhuma ação pendente',
      description: 'Oportunidade arquivada no sistema.',
      reason: 'Lead arquivado.',
      priority: 'low',
      badgeText: 'Arquivado',
      badgeVariant: 'gray',
      sourceEntity: 'lead'
    };
  }

  // 1. Verificar tarefas pendentes
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const dateA = a.dueAt ? parseToDate(a.dueAt)?.getTime() || Infinity : Infinity;
    const dateB = b.dueAt ? parseToDate(b.dueAt)?.getTime() || Infinity : Infinity;
    return dateA - dateB;
  });

  // 2. Verificar visitas ativas (pendentes ou confirmadas)
  const activeViewings = viewings.filter(v => v.status === 'pending' || v.status === 'confirmed');
  const sortedViewings = [...activeViewings].sort((a, b) => {
    const dateA = `${a.preferredDate}T${a.preferredTime || '00:00'}`;
    const dateB = `${b.preferredDate}T${b.preferredTime || '00:00'}`;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Prioridade 1: Tarefa atrasada (Overdue)
  const overdueTask = sortedTasks.find(t => {
    if (!t.dueAt) return false;
    const d = parseToDate(t.dueAt);
    if (!d) return false;
    const dStr = t.dueAt.slice(0, 10);
    return d.getTime() < nowMs && dStr !== todayStr;
  });

  if (overdueTask) {
    return {
      type: 'task_overdue',
      title: `Tarefa atrasada: ${overdueTask.title}`,
      action: 'Concluir tarefa atrasada',
      description: overdueTask.description || 'Lembrete de follow-up que já venceu.',
      reason: `Tarefa agendada para ${overdueTask.dueAt.replace('T', ' ')} expirou sem conclusão registrada.`,
      priority: 'high',
      badgeText: 'Atrasada',
      badgeVariant: 'rose',
      dueDate: overdueTask.dueAt,
      targetId: overdueTask.id,
      sourceEntity: 'task'
    };
  }

  // Prioridade 2: Visita para Hoje
  const todayViewing = sortedViewings.find(v => v.preferredDate === todayStr);
  if (todayViewing) {
    const isPending = todayViewing.status === 'pending';
    return {
      type: isPending ? 'viewing_upcoming' : 'viewing_today',
      title: isPending ? `Confirmar visita para hoje às ${todayViewing.preferredTime}` : `Visita agendada para hoje às ${todayViewing.preferredTime}`,
      action: isPending ? 'Confirmar visita de hoje' : 'Realizar visita agendada',
      description: isPending ? 'Solicitação de visita para hoje aguardando confirmação.' : `Visita confirmada ao imóvel "${todayViewing.propertyTitle}".`,
      reason: `Visita agendada para o dia de hoje às ${todayViewing.preferredTime}.`,
      priority: 'high',
      badgeText: isPending ? 'Confirmar Hoje' : 'Visita Hoje',
      badgeVariant: isPending ? 'amber' : 'emerald',
      dueDate: `${todayViewing.preferredDate} ${todayViewing.preferredTime}`,
      targetId: todayViewing.id,
      sourceEntity: 'viewing'
    };
  }

  // Prioridade 3: Tarefa para Hoje
  const todayTask = sortedTasks.find(t => {
    if (!t.dueAt) return false;
    return t.dueAt.slice(0, 10) === todayStr;
  });

  if (todayTask) {
    return {
      type: 'task_today',
      title: `Tarefa de hoje: ${todayTask.title}`,
      action: 'Executar tarefa de hoje',
      description: todayTask.description || 'Lembrete agendado para o dia de hoje.',
      reason: `Follow-up agendado especificamente para o dia de hoje (${todayTask.dueAt.slice(11, 16) || 'horário comercial'}).`,
      priority: 'high',
      badgeText: 'Hoje',
      badgeVariant: 'amber',
      dueDate: todayTask.dueAt,
      targetId: todayTask.id,
      sourceEntity: 'task'
    };
  }

  // Prioridade 4: Visita Futura (Pendente ou Confirmada)
  if (sortedViewings.length > 0) {
    const nextViewing = sortedViewings[0];
    const isPending = nextViewing.status === 'pending';
    return {
      type: 'viewing_upcoming',
      title: isPending ? `Confirmar visita: ${nextViewing.preferredDate} às ${nextViewing.preferredTime}` : `Visita agendada: ${nextViewing.preferredDate} às ${nextViewing.preferredTime}`,
      action: isPending ? 'Confirmar agendamento de visita' : 'Preparar visita agendada',
      description: isPending ? 'Solicitação de visita aguardando confirmação do corretor/proprietário.' : 'Visita confirmada ao imóvel.',
      reason: isPending ? 'O cliente aguarda confirmação da data solicitada.' : 'Visita futura programada no calendário comercial.',
      badgeText: isPending ? 'A Confirmar' : 'Visita Marcada',
      badgeVariant: isPending ? 'amber' : 'emerald',
      priority: isPending ? 'high' : 'medium',
      dueDate: `${nextViewing.preferredDate} ${nextViewing.preferredTime}`,
      targetId: nextViewing.id,
      sourceEntity: 'viewing'
    };
  }

  // Prioridade 5: Primeiro contacto pendente (Novo Lead)
  if (lead.status === 'new') {
    const createdDate = parseToDate(lead.createdAt);
    const hoursElapsed = createdDate ? Math.round((nowMs - createdDate.getTime()) / (1000 * 60 * 60)) : 0;
    return {
      type: 'contact_needed',
      title: 'Realizar primeiro contacto comercial',
      action: 'Fazer primeiro contacto',
      description: 'Lead novo sem interação registrada. Entre em contacto via WhatsApp ou Chamada.',
      reason: hoursElapsed > 0 
        ? `Lead registrado há ${hoursElapsed}h ainda sem primeiro atendimento confirmado.`
        : 'Lead recém-registrado aguardando primeiro contacto comercial.',
      badgeText: 'Contacto Pendente',
      badgeVariant: 'rose',
      priority: 'high',
      sourceEntity: 'lead'
    };
  }

  // Prioridade 6: Lead Parado / Stale (Recuperação de Oportunidade)
  const lastActiveDate = getLatestCommercialDate(lead, activities);
  if (lastActiveDate) {
    const daysInactive = Math.floor((nowMs - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysInactive >= STALE_CRITICAL_DAYS) {
      return {
        type: 'stale_recovery',
        title: `Retomar contacto com ${lead.customerName}`,
        action: 'Reativar lead parado',
        description: `Lead sem interação há ${daysInactive} dias. Envie uma mensagem de follow-up.`,
        reason: `Última atividade comercial registrada foi há ${daysInactive} dias. Risco de perda por descontinuidade.`,
        badgeText: 'Lead Parado',
        badgeVariant: 'rose',
        priority: 'high',
        sourceEntity: 'lead'
      };
    }
  }

  // Prioridade 7: Qualificação de Comprador já contactado
  if (lead.status === 'contacted') {
    return {
      type: 'qualify_needed',
      title: 'Qualificar interesse do comprador',
      action: 'Avançar qualificação',
      description: 'Verifique capacidade financeira, urgência e agende visita para qualificar.',
      reason: 'Primeiro contacto realizado. Próximo passo é validar critérios de qualificação.',
      badgeText: 'Qualificação',
      badgeVariant: 'amber',
      priority: 'medium',
      sourceEntity: 'lead'
    };
  }

  // Prioridade 8: Próxima Tarefa Futura Programada
  if (sortedTasks.length > 0) {
    const futureTask = sortedTasks[0];
    return {
      type: 'task_upcoming',
      title: `Próxima tarefa: ${futureTask.title}`,
      action: 'Acompanhar tarefa futura',
      description: futureTask.description || 'Follow-up programado.',
      reason: `Tarefa futura agendada para ${futureTask.dueAt?.replace('T', ' ')}.`,
      badgeText: 'Programada',
      badgeVariant: 'blue',
      priority: 'low',
      dueDate: futureTask.dueAt,
      targetId: futureTask.id,
      sourceEntity: 'task'
    };
  }

  // Prioridade 9: Sem Ação Imediata Pendente
  return {
    type: 'idle',
    title: 'Nenhuma ação pendente',
    action: 'Monitorar oportunidade',
    description: 'Lead sem tarefas ativas ou visitas agendadas.',
    reason: 'Todas as ações registradas estão concluídas e em dia.',
    badgeText: 'Em Dia',
    badgeVariant: 'gray',
    priority: 'low',
    sourceEntity: 'lead'
  };
}
