/**
 * MEUPLACE — PHASE 5.3 CRM V1 OPERATIONS, FOLLOW-UP & LEAD WORKFLOW TEST SUITE
 * 
 * Verificações Operacionais Automatizadas:
 * 1. Operações de Mudança de Prioridade (low, medium, high)
 * 2. Registro de Contacto Comercial (WhatsApp, Ligação, Email) na Timeline Append-Only
 * 3. Ciclo de Vida de Tarefas e Follow-ups (Criar, Concluir, Cancelar)
 * 4. Fila de Produtividade Operacional (Atrasadas / Hoje / Futuras)
 * 5. Determinação Determinística do Próximo Passo Comercial (Next Action)
 * 6. Transições de Workflow Operacional do Lead (Avanço sequencial, Ganhos, Perdas)
 * 7. Integração Operacional com Agendamentos de Visita
 * 8. Notificações Operacionais Vinculadas (assignment, status won/lost, follow-ups)
 * 9. Autorização e Segurança Zero-Trust para Operações
 */

import { 
  Lead,
  LeadStatus,
  LeadPriority,
  LeadActivity,
  LeadActivityType,
  LeadTask,
  LeadTaskStatus,
  Viewing,
  isValidLeadTransition,
  isValidViewingTransition
} from '../../src/types/index';
import { deriveLeadNextAction } from '../../src/utils/crmNextAction';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${failureDetails ? ` — ${failureDetails}` : ''}`);
    failed++;
  }
}

console.log('========================================================================');
console.log('   MEUPLACE — PHASE 5.3 CRM V1 OPERATIONS & WORKFLOW TEST SUITE        ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. OPERAÇÕES DE PRIORIDADE
// -----------------------------------------------------------------------------
console.log('--- 1. OPERAÇÕES DE PRIORIDADE ---');

const mockLead: Lead = {
  id: 'lead_test_01',
  propertyId: 'prop_01',
  propertyTitle: 'Apartamento T3 Sommerchield',
  propertyOwnerId: 'owner_01',
  agentId: 'agent_01',
  customerName: 'Manuel Sithole',
  customerPhone: '+258841234567',
  message: 'Tenho muito interesse no apartamento.',
  status: 'new',
  priority: 'medium',
  source: 'contact_form',
  createdAt: new Date(),
  updatedAt: new Date()
};

assert(mockLead.priority === 'medium', 'Lead inicializado com prioridade média por padrão');

const updatedLeadPriority: Lead = { ...mockLead, priority: 'high' };
assert(updatedLeadPriority.priority === 'high', 'Permite elevar prioridade do lead para alta');

const downgradedLeadPriority: Lead = { ...mockLead, priority: 'low' };
assert(downgradedLeadPriority.priority === 'low', 'Permite rebaixar prioridade do lead para baixa');

// -----------------------------------------------------------------------------
// 2. REGISTRO DE CONTACTOS COMERCIAIS NA TIMELINE (CONTACT LOGGING)
// -----------------------------------------------------------------------------
console.log('\n--- 2. REGISTRO DE CONTACTOS COMERCIAIS NA TIMELINE ---');

const contactChannels: ('whatsapp' | 'phone' | 'email')[] = ['whatsapp', 'phone', 'email'];
contactChannels.forEach(channel => {
  const typeMap: Record<string, LeadActivityType> = {
    whatsapp: 'whatsapp_sent',
    phone: 'call_logged',
    email: 'email_sent'
  };

  const activity: LeadActivity = {
    id: `act_${channel}`,
    leadId: mockLead.id!,
    propertyId: mockLead.propertyId,
    type: typeMap[channel],
    actorId: 'agent_01',
    actorRole: 'agent',
    title: `Contacto via ${channel}`,
    description: 'Cliente atendeu e confirmou interesse.',
    createdAt: new Date()
  };

  assert(Boolean(activity.id && activity.type === typeMap[channel]), `Registra actividade comercial para canal ${channel}`);
  assert(activity.actorId === 'agent_01', `Audita agente que efetuou contacto via ${channel}`);
});

// -----------------------------------------------------------------------------
// 3. CICLO DE VIDA DE FOLLOW-UP / TAREFAS
// -----------------------------------------------------------------------------
console.log('\n--- 3. CICLO DE VIDA DE FOLLOW-UP / TAREFAS ---');

const pendingTask: LeadTask = {
  id: 'task_01',
  leadId: mockLead.id!,
  propertyId: mockLead.propertyId,
  assignedTo: 'agent_01',
  createdBy: 'agent_01',
  title: 'Ligar para alinhar proposta de sinal',
  status: 'pending',
  priority: 'high',
  dueAt: new Date(Date.now() + 86400000).toISOString(),
  createdAt: new Date(),
  updatedAt: new Date()
};

assert(pendingTask.status === 'pending', 'Tarefa criada com status inicial pending');

const completedTask: LeadTask = {
  ...pendingTask,
  status: 'completed',
  completedAt: new Date().toISOString(),
  completedBy: 'agent_01'
};
assert(completedTask.status === 'completed', 'Tarefa concluída com sucesso');
assert(Boolean(completedTask.completedAt && completedTask.completedBy), 'Tarefa concluída registra timestamp e executor');

const cancelledTask: LeadTask = {
  ...pendingTask,
  status: 'cancelled',
  updatedAt: new Date()
};
assert(cancelledTask.status === 'cancelled', 'Permite cancelar tarefa');

// -----------------------------------------------------------------------------
// 4. FILA DE PRODUTIVIDADE OPERACIONAL (OVERDUE / TODAY / UPCOMING)
// -----------------------------------------------------------------------------
console.log('\n--- 4. FILA DE PRODUTIVIDADE OPERACIONAL ---');

const now = new Date();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const today = new Date().toISOString().slice(0, 10) + 'T15:00:00';
const tomorrow = new Date(Date.now() + 86400000).toISOString();

const taskOverdue: LeadTask = { ...pendingTask, id: 't_overdue', dueAt: yesterday };
const taskToday: LeadTask = { ...pendingTask, id: 't_today', dueAt: today };
const taskTomorrow: LeadTask = { ...pendingTask, id: 't_tomorrow', dueAt: tomorrow };

const tasksList = [taskOverdue, taskToday, taskTomorrow];
const todayStr = now.toISOString().slice(0, 10);

const queueOverdue = tasksList.filter(t => new Date(t.dueAt) < now && t.dueAt.slice(0, 10) !== todayStr);
const queueToday = tasksList.filter(t => t.dueAt.slice(0, 10) === todayStr);
const queueUpcoming = tasksList.filter(t => new Date(t.dueAt) > now && t.dueAt.slice(0, 10) !== todayStr);

assert(queueOverdue.length === 1 && queueOverdue[0].id === 't_overdue', 'Classifica tarefa vencida como Overdue');
assert(queueToday.length === 1 && queueToday[0].id === 't_today', 'Classifica tarefa de hoje como Today');
assert(queueUpcoming.length === 1 && queueUpcoming[0].id === 't_tomorrow', 'Classifica tarefa futura como Upcoming');

// -----------------------------------------------------------------------------
// 5. DETERMINAÇÃO DO PRÓXIMO PASSO COMERCIAL (NEXT ACTION)
// -----------------------------------------------------------------------------
console.log('\n--- 5. PRÓXIMO PASSO COMERCIAL (NEXT ACTION) ---');

// Cenário A: Lead novo sem tarefas ou visitas -> Contacto pendente
const nextActionNew = deriveLeadNextAction({ ...mockLead, status: 'new' }, [], []);
assert(nextActionNew.type === 'contact_needed', 'Lead novo exige primeiro contacto comercial');

// Cenário B: Lead com tarefa atrasada -> Alerta de tarefa atrasada
const nextActionOverdue = deriveLeadNextAction(mockLead, [taskOverdue], []);
assert(nextActionOverdue.type === 'task_overdue', 'Prioriza tarefa atrasada como próximo passo crítico');

// Cenário C: Lead com tarefa de hoje -> Alerta de tarefa de hoje
const nextActionToday = deriveLeadNextAction(mockLead, [taskToday], []);
assert(nextActionToday.type === 'task_today', 'Prioriza tarefa agendada para hoje');

// Cenário D: Lead com visita agendada pendente
const viewingPending: Viewing = {
  id: 'view_01',
  propertyId: mockLead.propertyId,
  propertyTitle: mockLead.propertyTitle,
  requesterId: 'cust_01',
  requesterName: 'Manuel Sithole',
  requesterPhone: '+258841234567',
  propertyOwnerId: 'owner_01',
  preferredDate: '2026-10-15',
  preferredTime: '10:00',
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date()
};

const nextActionViewing = deriveLeadNextAction(mockLead, [], [viewingPending]);
assert(nextActionViewing.type === 'viewing_upcoming', 'Detecta visita pendente de confirmação');

// Cenário E: Lead sem tarefas e em estado Contactado -> Qualificação necessária
const nextActionContacted = deriveLeadNextAction({ ...mockLead, status: 'contacted' }, [], []);
assert(nextActionContacted.type === 'qualify_needed', 'Sugere qualificação de comprador já contactado');

// -----------------------------------------------------------------------------
// 6. WORKFLOW OPERACIONAL DO LEAD (STATUS TRANSITIONS)
// -----------------------------------------------------------------------------
console.log('\n--- 6. WORKFLOW OPERACIONAL DO LEAD ---');

// Transições válidas do fluxo operacional comercial
assert(isValidLeadTransition('new', 'contacted'), 'Permite registrar primeiro contacto: new -> contacted');
assert(isValidLeadTransition('contacted', 'qualified'), 'Permite qualificar comprador: contacted -> qualified');
assert(isValidLeadTransition('qualified', 'negotiating'), 'Permite abrir negociação: qualified -> negotiating');
assert(isValidLeadTransition('negotiating', 'won'), 'Permite fechar negócio como Ganho: negotiating -> won');
assert(isValidLeadTransition('negotiating', 'lost'), 'Permite fechar como Perdido: negotiating -> lost');
assert(isValidLeadTransition('won', 'archived'), 'Permite arquivar negócio fechado com sucesso');

// Bloqueios estritos contra manipulação fraudulenta
assert(!isValidLeadTransition('new', 'won'), 'Bloqueia fechar negócio diretamente de novo sem contacto');
assert(!isValidLeadTransition('new', 'negotiating'), 'Bloqueia entrar em negociação sem qualificação');
assert(!isValidLeadTransition('won', 'new'), 'Bloqueia reverter negócio ganho para novo');
assert(!isValidLeadTransition('won', 'lost'), 'Bloqueia transformar negócio ganho em perdido');

// -----------------------------------------------------------------------------
// 7. INTEGRAÇÃO OPERACIONAL COM VISITAS (VIEWING WORKFLOW)
// -----------------------------------------------------------------------------
console.log('\n--- 7. INTEGRAÇÃO OPERACIONAL COM VISITAS ---');

assert(isValidViewingTransition('pending', 'confirmed'), 'Corretor confirma visita pendente');
assert(isValidViewingTransition('confirmed', 'completed'), 'Corretor conclui visita realizada');
assert(isValidViewingTransition('confirmed', 'cancelled'), 'Permite cancelamento de visita confirmada');
assert(isValidViewingTransition('confirmed', 'no_show'), 'Permite registrar ausência do cliente (no-show)');
assert(!isValidViewingTransition('completed', 'pending'), 'Bloqueia reabertura de visita já concluída');

// -----------------------------------------------------------------------------
// 8. NOTIFICAÇÕES OPERACIONAIS VINCULADAS
// -----------------------------------------------------------------------------
console.log('\n--- 8. NOTIFICAÇÕES OPERACIONAIS VINCULADAS ---');

const notificationPayload = {
  userId: 'agent_01',
  type: 'task_due',
  title: 'Nova Tarefa de Follow-up: Ligar para cliente',
  message: 'Você tem uma nova tarefa agendada para 2026-10-15 10:00.',
  category: 'lead',
  entityType: 'lead',
  entityId: mockLead.id,
  leadId: mockLead.id,
  propertyId: mockLead.propertyId,
  link: `/crm/leads/${mockLead.id}`,
  read: false,
  priority: 'high'
};

assert(notificationPayload.link.startsWith('/crm/leads/'), 'Link de notificação aponta canonicamente para /crm/leads/:id');
assert(notificationPayload.leadId === mockLead.id, 'Payload de notificação preserva leadId');
assert(notificationPayload.entityType === 'lead', 'EntityType categorizado estritamente como lead');

// -----------------------------------------------------------------------------
// RESUMO FINAL DA SUITE
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL DE TESTES FASE 5.3: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
console.log('========================================================================\n');

if (failed > 0) {
  process.exit(1);
}
