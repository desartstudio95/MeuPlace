/**
 * MEUPLACE — CRM V1: DETERMINAÇÃO DETERMINÍSTICA DA PRÓXIMA AÇÃO COMERCIAL
 * Derivação dinâmica a partir de dados reais existentes:
 * 1. Tarefa pendente mais urgente (overdue > today > upcoming)
 * 2. Visita futura confirmada ou pendente
 * 3. Estado do Lead (ex: 'new' -> primeiro contacto obrigatório)
 * 4. Nenhuma ação pendente identificada
 */

import { Lead, LeadTask, Viewing } from '@/types';

export interface NextActionInfo {
  type: 'task_overdue' | 'task_today' | 'task_upcoming' | 'viewing_upcoming' | 'contact_needed' | 'qualify_needed' | 'idle';
  title: string;
  description: string;
  badgeText: string;
  badgeVariant: 'rose' | 'amber' | 'blue' | 'emerald' | 'gray';
  dueDate?: string;
  targetId?: string;
}

/**
 * Deriva a próxima ação operacional a partir de entidades reais já carregadas.
 * Não duplica dados persistidos no Firestore.
 */
export function deriveLeadNextAction(
  lead: Lead,
  tasks: LeadTask[] = [],
  viewings: Viewing[] = []
): NextActionInfo {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // 1. Verificar tarefas pendentes
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  if (pendingTasks.length > 0) {
    // Ordenar tarefas por data de vencimento ascendente
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      const dateA = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const dateB = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return dateA - dateB;
    });

    const urgentTask = sortedTasks[0];
    const taskDate = urgentTask.dueAt ? new Date(urgentTask.dueAt) : null;

    if (taskDate) {
      if (taskDate < now) {
        return {
          type: 'task_overdue',
          title: `Tarefa atrasada: ${urgentTask.title}`,
          description: urgentTask.description || 'Lembrete de follow-up que já venceu.',
          badgeText: 'Atrasada',
          badgeVariant: 'rose',
          dueDate: urgentTask.dueAt,
          targetId: urgentTask.id
        };
      }

      const taskDateStr = taskDate.toISOString().slice(0, 10);
      if (taskDateStr === todayStr) {
        return {
          type: 'task_today',
          title: `Tarefa de hoje: ${urgentTask.title}`,
          description: urgentTask.description || 'Lembrete agendado para o dia de hoje.',
          badgeText: 'Hoje',
          badgeVariant: 'amber',
          dueDate: urgentTask.dueAt,
          targetId: urgentTask.id
        };
      }

      return {
        type: 'task_upcoming',
        title: `Próxima tarefa: ${urgentTask.title}`,
        description: urgentTask.description || 'Follow-up programado.',
        badgeText: 'Programada',
        badgeVariant: 'blue',
        dueDate: urgentTask.dueAt,
        targetId: urgentTask.id
      };
    }
  }

  // 2. Verificar visitas futuras
  const activeViewings = viewings.filter(v => v.status === 'pending' || v.status === 'confirmed');
  if (activeViewings.length > 0) {
    // Ordenar por data da visita
    const sortedViewings = [...activeViewings].sort((a, b) => {
      const dateA = `${a.preferredDate}T${a.preferredTime || '00:00'}`;
      const dateB = `${b.preferredDate}T${b.preferredTime || '00:00'}`;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    const nextViewing = sortedViewings[0];
    const isPending = nextViewing.status === 'pending';

    return {
      type: 'viewing_upcoming',
      title: isPending ? `Confirmar visita: ${nextViewing.preferredDate} às ${nextViewing.preferredTime}` : `Visita agendada: ${nextViewing.preferredDate} às ${nextViewing.preferredTime}`,
      description: isPending ? 'Solicitação de visita aguardando confirmação do corretor/proprietário.' : 'Visita confirmada ao imóvel.',
      badgeText: isPending ? 'A Confirmar' : 'Visita Marcada',
      badgeVariant: isPending ? 'amber' : 'emerald',
      dueDate: `${nextViewing.preferredDate} ${nextViewing.preferredTime}`,
      targetId: nextViewing.id
    };
  }

  // 3. Derivação pelo Estado do Lead
  if (lead.status === 'new') {
    return {
      type: 'contact_needed',
      title: 'Realizar primeiro contacto',
      description: 'Lead novo sem interação registrada. Entre em contacto via WhatsApp ou Chamada.',
      badgeText: 'Contacto Pendente',
      badgeVariant: 'rose'
    };
  }

  if (lead.status === 'contacted') {
    return {
      type: 'qualify_needed',
      title: 'Qualificar interesse do comprador',
      description: 'Verifique capacidade financeira, urgência e agende visita para qualificar.',
      badgeText: 'Qualificação',
      badgeVariant: 'amber'
    };
  }

  // 4. Sem ação imediata pendente
  return {
    type: 'idle',
    title: 'Nenhuma ação pendente',
    description: 'Lead sem tarefas ativas ou visitas agendadas.',
    badgeText: 'Em Dia',
    badgeVariant: 'gray'
  };
}
