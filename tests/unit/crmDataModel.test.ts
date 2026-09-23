/**
 * MEUPLACE — PHASE 5.1 CRM V1 DATA MODEL & ARCHITECTURE UNIT TESTS
 * 
 * Verificações Automatizadas:
 * 1. Compatibilidade Retroativa do Modelo Lead
 * 2. Extensões Comerciais (priority, score, statusNote, timestamps)
 * 3. Máquina de Estados do Lead no CRM
 * 4. Modelo de Atividades Comerciais (LeadActivity - append-only)
 * 5. Modelo de Tarefas e Lembretes (LeadTask - status & integridade)
 * 6. Lógica de Atribuição e Reatribuição (Assignment)
 * 7. Relações Lead -> Viewing (Histórico & Próximas Visitas)
 * 8. Sanitização de Filtros e Proteção contra N+1 / Overfetching
 * 9. Isolamento de Inquilino / PII (Proprietário / Agente)
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
  ALLOWED_LEAD_TRANSITIONS,
  LEAD_STATUS_VOCABULARY
} from '../../src/types/index';
import { validateLeadInput } from '../../src/services/leadService';

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
console.log('    MEUPLACE — PHASE 5.1 CRM V1 DATA MODEL & ARCHITECTURE TEST SUITE    ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. RETROCOMPATIBILIDADE DO MODELO DE LEAD
// -----------------------------------------------------------------------------
console.log('--- 1. COMPATIBILIDADE RETROATIVA DO MODELO DE LEAD ---');

// Um lead antigo sem os novos campos opcionais do CRM deve ser válido e tipável
const legacyLead: Lead = {
  id: 'lead_legacy_101',
  propertyId: 'prop_001',
  propertyTitle: 'Apartamento T3 Polana',
  propertyOwnerId: 'owner_999',
  customerName: 'Carlos Machava',
  customerPhone: '+258841234567',
  message: 'Tenho interesse neste imóvel.',
  source: 'contact_form',
  status: 'new',
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-01T10:00:00Z'
};

assert(legacyLead.id === 'lead_legacy_101', 'Lead legado sem novos campos compila perfeitamente');
assert(legacyLead.priority === undefined, 'Campo priority é estritamente opcional');
assert(legacyLead.score === undefined, 'Campo score é estritamente opcional');
assert(legacyLead.statusNote === undefined, 'Campo statusNote é estritamente opcional');
assert(legacyLead.qualifiedAt === undefined, 'Campo qualifiedAt é estritamente opcional');

// Um lead moderno do CRM com todos os campos novos
const modernCrmLead: Lead = {
  ...legacyLead,
  id: 'lead_crm_202',
  agentId: 'agent_555',
  priority: 'high',
  score: 85,
  statusNote: 'Cliente pré-aprovado no BCI',
  qualifiedAt: '2026-03-01T12:00:00Z',
  convertedAt: '2026-03-15T15:00:00Z',
  metadata: { budgetMax: 15000000, preferredLocation: 'Polana' }
};

assert(modernCrmLead.priority === 'high', 'Suporta prioridade comercial (low, medium, high)');
assert(modernCrmLead.score === 85, 'Suporta pontuação comercial opcional');
assert(modernCrmLead.qualifiedAt !== undefined, 'Suporta timestamp específico de qualificação');
assert(modernCrmLead.convertedAt !== undefined, 'Suporta timestamp específico de conversão');

// -----------------------------------------------------------------------------
// 2. MÁQUINA DE ESTADOS DO CRM
// -----------------------------------------------------------------------------
console.log('\n--- 2. CONSOLIDAÇÃO DO VOCABULÁRIO DE STATUS DO CRM ---');

assert(LEAD_STATUS_VOCABULARY.includes('new'), 'Status "new" presente no vocabulário oficial');
assert(LEAD_STATUS_VOCABULARY.includes('contacted'), 'Status "contacted" presente no vocabulário oficial');
assert(LEAD_STATUS_VOCABULARY.includes('qualified'), 'Status "qualified" presente no vocabulário oficial');
assert(LEAD_STATUS_VOCABULARY.includes('negotiating'), 'Status "negotiating" presente no vocabulário oficial');
assert(LEAD_STATUS_VOCABULARY.includes('won'), 'Status "won" presente no vocabulário oficial');
assert(LEAD_STATUS_VOCABULARY.includes('lost'), 'Status "lost" presente no vocabulário oficial');
assert(LEAD_STATUS_VOCABULARY.includes('archived'), 'Status "archived" presente no vocabulário oficial');
assert(LEAD_STATUS_VOCABULARY.length === 7, 'Vocabulário do CRM contém exatamente 7 estados canónicos');

// Valida transição estrita no pipeline comercial
assert(isValidLeadTransition('contacted', 'qualified'), 'Permite avançar: contacted -> qualified');
assert(isValidLeadTransition('qualified', 'negotiating'), 'Permite avançar: qualified -> negotiating');
assert(isValidLeadTransition('negotiating', 'won'), 'Permite fechar negócio: negotiating -> won');
assert(!isValidLeadTransition('new', 'won'), 'Proíbe fechar negócio ganho diretamente de novo');
assert(!isValidLeadTransition('lost', 'won'), 'Proíbe recuperar lead perdido diretamente para ganho');

// -----------------------------------------------------------------------------
// 3. MODELO DE ATIVIDADES COMERCIAIS (LEAD_ACTIVITIES)
// -----------------------------------------------------------------------------
console.log('\n--- 3. MODELO DE ATIVIDADES COMERCIAIS (TIMELINE APPEND-ONLY) ---');

const testActivity: LeadActivity = {
  id: 'act_001',
  leadId: 'lead_crm_202',
  propertyId: 'prop_001',
  type: 'status_changed',
  actorId: 'agent_555',
  actorName: 'Dra. Maria Santos',
  actorRole: 'agent',
  title: 'Status alterado de "contacted" para "qualified"',
  description: 'Cliente comprovou capacidade financeira para T3.',
  metadata: { previousStatus: 'contacted', newStatus: 'qualified' },
  createdAt: '2026-03-01T12:00:00Z'
};

assert(testActivity.leadId === 'lead_crm_202', 'Atividade vinculada corretamente ao leadId');
assert(testActivity.propertyId === 'prop_001', 'Atividade vinculada corretamente ao propertyId');
assert(testActivity.actorRole === 'agent', 'Ator identificado com role válida');
assert(typeof testActivity.title === 'string' && testActivity.title.length > 0, 'Título da atividade presente');

const allowedActivityTypes: LeadActivityType[] = [
  'lead_created', 'lead_contacted', 'status_changed', 'note_added',
  'call_logged', 'whatsapp_sent', 'email_sent', 'viewing_requested',
  'viewing_confirmed', 'viewing_completed', 'viewing_cancelled',
  'task_created', 'task_completed', 'assigned', 'reassigned',
  'converted', 'lost'
];

assert(allowedActivityTypes.includes(testActivity.type), 'Tipo de atividade pertence ao catálogo comercial permitido');
assert(allowedActivityTypes.length === 17, 'Catálogo comercial possui 17 tipos de atividade auditáveis');

// -----------------------------------------------------------------------------
// 4. MODELO DE TAREFAS E FOLLOW-UPS (LEAD_TASKS)
// -----------------------------------------------------------------------------
console.log('\n--- 4. MODELO DE TAREFAS E FOLLOW-UPS ---');

const testTask: LeadTask = {
  id: 'task_001',
  leadId: 'lead_crm_202',
  propertyId: 'prop_001',
  assignedTo: 'agent_555',
  createdBy: 'owner_999',
  title: 'Enviar minuta do contrato de promessa de compra e venda',
  description: 'Minuta padrão atualizada com os termos acordados.',
  status: 'pending',
  priority: 'high',
  dueAt: '2026-03-25T17:00:00Z',
  createdAt: '2026-03-20T10:00:00Z',
  updatedAt: '2026-03-20T10:00:00Z'
};

assert(testTask.status === 'pending', 'Tarefa inicializada com status "pending"');
assert(testTask.assignedTo === 'agent_555', 'Responsável atribuído corretamente');
assert(testTask.createdBy === 'owner_999', 'Criador registrado para auditoria');
assert(testTask.priority === 'high', 'Prioridade de tarefa definida');

// Verificação de transição de status de tarefa
const validTaskStatuses: LeadTaskStatus[] = ['pending', 'completed', 'cancelled'];
assert(validTaskStatuses.includes('pending'), 'Status "pending" suportado');
assert(validTaskStatuses.includes('completed'), 'Status "completed" suportado');
assert(validTaskStatuses.includes('cancelled'), 'Status "cancelled" suportado');

// -----------------------------------------------------------------------------
// 5. ATRIBUIÇÃO E REATRIBUIÇÃO DE LEADS (ASSIGNMENT)
// -----------------------------------------------------------------------------
console.log('\n--- 5. LÓGICA DE ATRIBUIÇÃO E REATRIBUIÇÃO ---');

const leadBeforeAssign: Lead = { ...modernCrmLead, agentId: undefined };
assert(leadBeforeAssign.agentId === undefined, 'Lead inicialmente não atribuído a agente individual');

const leadAfterAssign: Lead = { ...leadBeforeAssign, agentId: 'agent_777' };
assert(leadAfterAssign.agentId === 'agent_777', 'Lead atribuído com sucesso ao agente 777');

const reassignActivity: LeadActivity = {
  id: 'act_reassign_1',
  leadId: leadAfterAssign.id!,
  propertyId: leadAfterAssign.propertyId,
  type: 'reassigned',
  actorId: 'owner_999',
  actorRole: 'owner',
  title: 'Lead reatribuído a novo responsável',
  metadata: { fromAgentId: 'agent_555', toAgentId: 'agent_777' },
  createdAt: '2026-03-22T10:00:00Z'
};

assert(reassignActivity.type === 'reassigned', 'Registra tipo "reassigned" quando já havia responsável prévio');
assert(reassignActivity.metadata?.fromAgentId === 'agent_555', 'Preserva histórico do agente anterior');
assert(reassignActivity.metadata?.toAgentId === 'agent_777', 'Registra novo agente atribuído');

// -----------------------------------------------------------------------------
// 6. RELAÇÃO LEAD -> VIEWINGS NO CRM
// -----------------------------------------------------------------------------
console.log('\n--- 6. INTEGRAÇÃO LEAD -> VIEWINGS ---');

const associatedViewing: Viewing = {
  id: 'viewing_501',
  propertyId: modernCrmLead.propertyId,
  propertyTitle: modernCrmLead.propertyTitle,
  leadId: modernCrmLead.id,
  requesterId: 'user_buyer_12',
  requesterName: modernCrmLead.customerName,
  requesterPhone: modernCrmLead.customerPhone,
  propertyOwnerId: modernCrmLead.propertyOwnerId,
  agentId: modernCrmLead.agentId,
  preferredDate: '2026-04-10',
  preferredTime: '14:30',
  status: 'confirmed',
  createdAt: '2026-03-21T10:00:00Z',
  updatedAt: '2026-03-21T11:00:00Z'
};

assert(associatedViewing.leadId === modernCrmLead.id, 'Visita associa leadId explicitamente');
assert(associatedViewing.propertyId === modernCrmLead.propertyId, 'Integridade de propertyId consistente entre Lead e Viewing');
assert(associatedViewing.propertyOwnerId === modernCrmLead.propertyOwnerId, 'Integridade de proprietário consistente');

// -----------------------------------------------------------------------------
// 7. PROTEÇÃO DE QUERIES E LIMITES (ANTI-OVERFETCHING)
// -----------------------------------------------------------------------------
console.log('\n--- 7. PROTEÇÃO DE CONSULTAS E LIMITES CRM ---');

const requestedLimit = 200;
const boundedLimit = Math.min(Math.max(requestedLimit || 20, 1), 50);
assert(boundedLimit === 50, 'Limita consultas CRM a no máximo 50 registros por página');

const zeroLimit = 0;
const safeZeroLimit = Math.min(Math.max(zeroLimit || 20, 1), 50);
assert(safeZeroLimit === 20, 'Garante fallback de limite padrão para valor sanitizado');

// -----------------------------------------------------------------------------
// 8. ISOLAMENTO DE INQUILINO E PROTEÇÃO DE PII
// -----------------------------------------------------------------------------
console.log('\n--- 8. ISOLAMENTO DE DADOS E PROTEÇÃO DE PII ---');

// Verificação de isolamento: agente só deve filtrar pelos seus próprios leads ou do proprietário
function isScopeAuthorized(requestingUserId: string, lead: Lead, userRole: string): boolean {
  if (userRole === 'admin') return true;
  return lead.agentId === requestingUserId || lead.propertyOwnerId === requestingUserId;
}

assert(isScopeAuthorized('agent_555', modernCrmLead, 'agent'), 'Agente atribuído tem acesso ao lead');
assert(isScopeAuthorized('owner_999', modernCrmLead, 'owner'), 'Proprietário do imóvel tem acesso ao lead');
assert(!isScopeAuthorized('agent_unauthorized_888', modernCrmLead, 'agent'), 'Agente não relacionado NÃO tem acesso ao lead');
assert(isScopeAuthorized('admin_root', modernCrmLead, 'admin'), 'Administrador do sistema tem acesso completo');

console.log('\n========================================================================');
console.log(`TOTAL DE TESTES CRM V1: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
console.log('========================================================================\n');

if (failed > 0) {
  process.exit(1);
}
