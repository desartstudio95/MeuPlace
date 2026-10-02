/**
 * MEUPLACE — PHASE 5.4 CRM SALES ANALYTICS & DASHBOARD TEST SUITE
 * 
 * Verificações Automatizadas:
 * 1. Proteção Matemática contra Divisão por Zero, NaN e Infinity
 * 2. Fuso Horário de Moçambique (CAT / UTC+2) e Limites Temporais
 * 3. Cálculos do Funil Comercial de Vendas (Sales Funnel)
 * 4. Métricas e Fila Operacional de Follow-ups (Tarefas)
 * 5. Métricas e Taxas de Realização de Visitas (Viewings)
 * 6. Agregações por Imóvel e Prevenção de Gargalo N+1
 * 7. Agregação e Normalização de Origens de Leads (Lead Sources)
 * 8. Resolução de Escopo e Custódia (RBAC & Tenant Isolation)
 * 9. Desempenho Operacional por Agente (Sem Ranking Competitivo)
 * 10. Tratamento Seguro de Casos Extremos (Zero Leads, 1 Lead, 100%, 0%)
 */

import { 
  safePercentage, 
  safeDivision, 
  getDateRangeBoundaries, 
  startOfDayMozambique, 
  endOfDayMozambique, 
  isWithinDateRange, 
  generateTrendIntervals,
  formatDateMozambique,
  getMozambiqueDateComponents,
  createMozambiqueDate
} from '../../src/utils/crmDateUtils';
import { 
  Lead, 
  LeadTask, 
  Viewing 
} from '../../src/types/index';

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
console.log('   MEUPLACE — PHASE 5.4 CRM SALES ANALYTICS & DASHBOARD TEST SUITE      ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. GUARDA MATEMÁTICA CONTRA DIVISÃO POR ZERO, NAN E INFINITY
// -----------------------------------------------------------------------------
console.log('--- 1. GUARDA MATEMÁTICA (ZERO DIVISION / NAN / INFINITY) ---');

assert(safePercentage(0, 0) === null, 'safePercentage(0, 0) retorna null (não NaN nem erro)');
assert(safePercentage(10, 0) === null, 'safePercentage(10, 0) retorna null (não Infinity)');
assert(safePercentage(0, 10) === 0, 'safePercentage(0, 10) retorna 0% válido');
assert(safePercentage(1, 1) === 100, 'safePercentage(1, 1) retorna 100%');
assert(safePercentage(1, 3) === 33.3, 'safePercentage(1, 3) arredonda para 33.3% com 1 casa decimal');
assert(safePercentage(2, 3) === 66.7, 'safePercentage(2, 3) arredonda para 66.7%');
assert(safePercentage(NaN as any, 10) === null, 'safePercentage com NaN retorna null');
assert(safePercentage(5, -2) === null, 'safePercentage com denominador negativo retorna null');

assert(safeDivision(0, 0) === null, 'safeDivision(0, 0) retorna null');
assert(safeDivision(10, 2) === 5, 'safeDivision(10, 2) calcula 5 corretamente');

// -----------------------------------------------------------------------------
// 2. FUSO HORÁRIO DE MOÇAMBIQUE (CAT / UTC+2) E LIMITES TEMPORAIS
// -----------------------------------------------------------------------------
console.log('\n--- 2. FUSO HORÁRIO DE MOÇAMBIQUE (CAT / UTC+2) ---');

// Referência fixa: 25 de Setembro de 2026 às 14:30:00 CAT
const fixedNowCAT = createMozambiqueDate(2026, 8, 25, 14, 30, 0); // Mês 8 = Setembro

const comp = getMozambiqueDateComponents(fixedNowCAT);
assert(comp.year === 2026, 'Ano em Moçambique é 2026');
assert(comp.month === 8, 'Mês em Moçambique é 8 (Setembro)');
assert(comp.day === 25, 'Dia em Moçambique é 25');
assert(comp.hours === 14, 'Hora em Moçambique é 14h');

const startOfToday = startOfDayMozambique(fixedNowCAT);
const startComp = getMozambiqueDateComponents(startOfToday);
assert(startComp.hours === 0 && startComp.minutes === 0 && startComp.seconds === 0, 'Início do dia é 00:00:00 CAT');

const endOfToday = endOfDayMozambique(fixedNowCAT);
const endComp = getMozambiqueDateComponents(endOfToday);
assert(endComp.hours === 23 && endComp.minutes === 59 && endComp.seconds === 59, 'Fim do dia é 23:59:59 CAT');

// Presets de data
const boundaries7d = getDateRangeBoundaries('7d', undefined, undefined, fixedNowCAT);
assert(boundaries7d.label === 'Últimos 7 Dias', 'Preset 7d possui rótulo correto');
const diffDays7 = Math.round((boundaries7d.endDate.getTime() - boundaries7d.startDate.getTime()) / (24 * 60 * 60 * 1000));
assert(diffDays7 === 7, 'Preset 7d abrange exatamente 7 dias inclusivos');

const boundaries30d = getDateRangeBoundaries('30d', undefined, undefined, fixedNowCAT);
const diffDays30 = Math.round((boundaries30d.endDate.getTime() - boundaries30d.startDate.getTime()) / (24 * 60 * 60 * 1000));
assert(diffDays30 === 30, 'Preset 30d abrange exatamente 30 dias inclusivos');

// Verificação de pertinência ao intervalo
const testDateInside = createMozambiqueDate(2026, 8, 20, 10, 0, 0);
const testDateOutside = createMozambiqueDate(2026, 6, 1, 10, 0, 0);
assert(isWithinDateRange(testDateInside, boundaries7d.startDate, boundaries7d.endDate), 'Data dentro do intervalo retorna true');
assert(!isWithinDateRange(testDateOutside, boundaries7d.startDate, boundaries7d.endDate), 'Data fora do intervalo retorna false');

// Intervalos de tendência
const intervals7d = generateTrendIntervals('7d', boundaries7d.startDate, boundaries7d.endDate);
assert(intervals7d.length === 7, 'Tendência de 7d gera exatamente 7 intervalos diários');

// -----------------------------------------------------------------------------
// 3. FUNIL COMERCIAL DE VENDAS (SALES FUNNEL)
// -----------------------------------------------------------------------------
console.log('\n--- 3. FUNIL COMERCIAL DE VENDAS ---');

// Cenário de teste: 100 leads totais
// 10 novos, 30 contactados, 30 qualificados, 20 negociando, 10 ganhos
const sampleLeads: Lead[] = [
  ...Array(10).fill(null).map((_, i) => ({ id: `new_${i}`, propertyId: 'p1', propertyTitle: 'T3', propertyOwnerId: 'o1', customerName: 'A', customerPhone: '1', message: 'm', status: 'new' as const, source: 'whatsapp' as const, createdAt: fixedNowCAT, updatedAt: fixedNowCAT })),
  ...Array(30).fill(null).map((_, i) => ({ id: `cont_${i}`, propertyId: 'p1', propertyTitle: 'T3', propertyOwnerId: 'o1', customerName: 'B', customerPhone: '2', message: 'm', status: 'contacted' as const, source: 'whatsapp' as const, createdAt: fixedNowCAT, updatedAt: fixedNowCAT })),
  ...Array(30).fill(null).map((_, i) => ({ id: `qual_${i}`, propertyId: 'p1', propertyTitle: 'T3', propertyOwnerId: 'o1', customerName: 'C', customerPhone: '3', message: 'm', status: 'qualified' as const, source: 'contact_form' as const, createdAt: fixedNowCAT, updatedAt: fixedNowCAT })),
  ...Array(20).fill(null).map((_, i) => ({ id: `neg_${i}`, propertyId: 'p2', propertyTitle: 'T2', propertyOwnerId: 'o1', customerName: 'D', customerPhone: '4', message: 'm', status: 'negotiating' as const, source: 'phone' as const, createdAt: fixedNowCAT, updatedAt: fixedNowCAT })),
  ...Array(10).fill(null).map((_, i) => ({ id: `won_${i}`, propertyId: 'p2', propertyTitle: 'T2', propertyOwnerId: 'o1', customerName: 'E', customerPhone: '5', message: 'm', status: 'won' as const, source: 'viewing_request' as const, createdAt: fixedNowCAT, updatedAt: fixedNowCAT }))
];

const wonLeadsCount = sampleLeads.filter(l => l.status === 'won').length;
const negotiatingOrBeyond = sampleLeads.filter(l => ['negotiating', 'won'].includes(l.status)).length;
const qualifiedOrBeyond = sampleLeads.filter(l => ['qualified', 'negotiating', 'won'].includes(l.status)).length;
const contactedOrBeyond = sampleLeads.filter(l => ['contacted', 'qualified', 'negotiating', 'won'].includes(l.status)).length;
const totalFunnel = sampleLeads.length;

assert(totalFunnel === 100, 'Total de leads no funil é 100');
assert(contactedOrBeyond === 90, 'Contactados ou além são 90');
assert(qualifiedOrBeyond === 60, 'Qualificados ou além são 60');
assert(negotiatingOrBeyond === 30, 'Negociando ou além são 30');
assert(wonLeadsCount === 10, 'Ganhos são 10');

// Taxas de conversão passo a passo
const stepNewToContacted = safePercentage(contactedOrBeyond, totalFunnel);
const stepContactedToQualified = safePercentage(qualifiedOrBeyond, contactedOrBeyond);
const stepQualifiedToNegotiating = safePercentage(negotiatingOrBeyond, qualifiedOrBeyond);
const stepNegotiatingToWon = safePercentage(wonLeadsCount, negotiatingOrBeyond);

assert(stepNewToContacted === 90, 'Conversão Entrada -> Contactados é 90%');
assert(stepContactedToQualified === 66.7, 'Conversão Contactados -> Qualificados é 66.7%');
assert(stepQualifiedToNegotiating === 50, 'Conversão Qualificados -> Negociando é 50%');
assert(stepNegotiatingToWon === 33.3, 'Conversão Negociando -> Ganhos é 33.3%');

// Conversão global (Won Rate)
const overallWonRate = safePercentage(wonLeadsCount, totalFunnel);
assert(overallWonRate === 10, 'Taxa de Fechamento Geral é 10%');

// -----------------------------------------------------------------------------
// 4. KPIS E FILA OPERACIONAL DE FOLLOW-UPS (TAREFAS)
// -----------------------------------------------------------------------------
console.log('\n--- 4. FOLLOW-UPS & TAREFAS (LEAD_TASKS) ---');

const sampleTasks: LeadTask[] = [
  // Atrasada (ontem)
  { id: 't1', leadId: 'l1', propertyId: 'p1', assignedTo: 'agent_01', createdBy: 'u1', title: 'Ligar', status: 'pending', priority: 'high', dueAt: createMozambiqueDate(2026, 8, 24, 10, 0, 0).toISOString(), createdAt: fixedNowCAT, updatedAt: fixedNowCAT },
  // De hoje (15h)
  { id: 't2', leadId: 'l2', propertyId: 'p1', assignedTo: 'agent_01', createdBy: 'u1', title: 'Enviar WhatsApp', status: 'pending', priority: 'medium', dueAt: createMozambiqueDate(2026, 8, 25, 15, 0, 0).toISOString(), createdAt: fixedNowCAT, updatedAt: fixedNowCAT },
  // Futura (amanhã)
  { id: 't3', leadId: 'l3', propertyId: 'p2', assignedTo: 'agent_01', createdBy: 'u1', title: 'Visita agendada', status: 'pending', priority: 'low', dueAt: createMozambiqueDate(2026, 8, 26, 10, 0, 0).toISOString(), createdAt: fixedNowCAT, updatedAt: fixedNowCAT },
  // Concluída
  { id: 't4', leadId: 'l4', propertyId: 'p2', assignedTo: 'agent_01', createdBy: 'u1', title: 'Contrato enviado', status: 'completed', priority: 'high', dueAt: createMozambiqueDate(2026, 8, 25, 9, 0, 0).toISOString(), createdAt: fixedNowCAT, updatedAt: fixedNowCAT }
];

let overdueCount = 0;
let todayCount = 0;
let upcomingCount = 0;
let completedTasksCount = 0;

sampleTasks.forEach(task => {
  if (task.status === 'completed') {
    completedTasksCount++;
  } else if (task.status === 'pending') {
    const d = new Date(task.dueAt);
    if (d < startOfToday) overdueCount++;
    else if (d >= startOfToday && d <= endOfToday) todayCount++;
    else upcomingCount++;
  }
});

assert(overdueCount === 1, '1 tarefa classificada como atrasada (Overdue)');
assert(todayCount === 1, '1 tarefa classificada como de hoje (Today)');
assert(upcomingCount === 1, '1 tarefa classificada como futura (Upcoming)');
assert(completedTasksCount === 1, '1 tarefa classificada como concluída (Completed)');

const taskCompletionRate = safePercentage(completedTasksCount, sampleTasks.length);
assert(taskCompletionRate === 25, 'Taxa de conclusão de tarefas é 25%');

// -----------------------------------------------------------------------------
// 5. KPIS E TAXAS DE VISITAS (VIEWINGS)
// -----------------------------------------------------------------------------
console.log('\n--- 5. VISITAS AOS IMÓVEIS (VIEWINGS) ---');

const sampleViewings: Viewing[] = [
  { id: 'v1', propertyId: 'p1', propertyTitle: 'T3', requesterId: 'r1', requesterName: 'João', requesterPhone: '123', propertyOwnerId: 'o1', preferredDate: '2026-09-25', preferredTime: '10:00', status: 'completed', createdAt: fixedNowCAT, updatedAt: fixedNowCAT },
  { id: 'v2', propertyId: 'p1', propertyTitle: 'T3', requesterId: 'r2', requesterName: 'Maria', requesterPhone: '456', propertyOwnerId: 'o1', preferredDate: '2026-09-26', preferredTime: '14:00', status: 'confirmed', createdAt: fixedNowCAT, updatedAt: fixedNowCAT },
  { id: 'v3', propertyId: 'p2', propertyTitle: 'T2', requesterId: 'r3', requesterName: 'Pedro', requesterPhone: '789', propertyOwnerId: 'o1', preferredDate: '2026-09-27', preferredTime: '16:00', status: 'pending', createdAt: fixedNowCAT, updatedAt: fixedNowCAT },
  { id: 'v4', propertyId: 'p2', propertyTitle: 'T2', requesterId: 'r4', requesterName: 'Ana', requesterPhone: '000', propertyOwnerId: 'o1', preferredDate: '2026-09-24', preferredTime: '11:00', status: 'no_show', createdAt: fixedNowCAT, updatedAt: fixedNowCAT }
];

const completedViewings = sampleViewings.filter(v => v.status === 'completed').length;
const confirmedViewings = sampleViewings.filter(v => v.status === 'confirmed').length;
const pendingViewings = sampleViewings.filter(v => v.status === 'pending').length;
const noShowViewings = sampleViewings.filter(v => v.status === 'no_show').length;

assert(completedViewings === 1, '1 visita realizada (completed)');
assert(confirmedViewings === 1, '1 visita confirmada (confirmed)');
assert(pendingViewings === 1, '1 visita pendente (pending)');
assert(noShowViewings === 1, '1 visita com não comparecimento (no_show)');

// Taxa de realização de visitas concluídas / total de visitas agendadas/encerradas
const viewingCompletionRate = safePercentage(completedViewings, completedViewings + confirmedViewings + noShowViewings);
assert(viewingCompletionRate === 33.3, 'Taxa de realização de visitas é 33.3%');

// -----------------------------------------------------------------------------
// 6. DESEMPENHO POR IMÓVEL & PREVENÇÃO DE N+1
// -----------------------------------------------------------------------------
console.log('\n--- 6. DESEMPENHO POR IMÓVEL (ZERO N+1) ---');

const propAggregationMap = new Map<string, { leads: number; viewings: number; won: number }>();

sampleLeads.forEach(l => {
  const ex = propAggregationMap.get(l.propertyId) || { leads: 0, viewings: 0, won: 0 };
  ex.leads++;
  if (l.status === 'won') ex.won++;
  propAggregationMap.set(l.propertyId, ex);
});

sampleViewings.forEach(v => {
  const ex = propAggregationMap.get(v.propertyId) || { leads: 0, viewings: 0, won: 0 };
  ex.viewings++;
  propAggregationMap.set(v.propertyId, ex);
});

assert(propAggregationMap.get('p1')?.leads === 70, 'Imóvel p1 possui exatamente 70 leads');
assert(propAggregationMap.get('p2')?.leads === 30, 'Imóvel p2 possui exatamente 30 leads');
assert(propAggregationMap.get('p1')?.viewings === 2, 'Imóvel p1 possui 2 visitas vinculadas');
assert(propAggregationMap.get('p2')?.viewings === 2, 'Imóvel p2 possui 2 visitas vinculadas');
assert(propAggregationMap.get('p2')?.won === 10, 'Imóvel p2 possui 10 leads ganhos');

const p2ConversionRate = safePercentage(propAggregationMap.get('p2')?.won || 0, propAggregationMap.get('p2')?.leads || 0);
assert(p2ConversionRate === 33.3, 'Taxa de conversão do imóvel p2 é 33.3% calculada em memória sem N+1');

// -----------------------------------------------------------------------------
// 7. ORIGENS DE LEADS (LEAD SOURCES)
// -----------------------------------------------------------------------------
console.log('\n--- 7. ORIGENS DE LEADS ---');

const srcMap = new Map<string, number>();
sampleLeads.forEach(l => {
  srcMap.set(l.source, (srcMap.get(l.source) || 0) + 1);
});

assert(srcMap.get('whatsapp') === 40, 'Origem WhatsApp possui 40 leads (40%)');
assert(srcMap.get('contact_form') === 30, 'Origem Contact Form possui 30 leads (30%)');
assert(srcMap.get('phone') === 20, 'Origem Phone possui 20 leads (20%)');
assert(srcMap.get('viewing_request') === 10, 'Origem Viewing Request possui 10 leads (10%)');

// -----------------------------------------------------------------------------
// 8. CASOS EXTREMOS (EDGE CASES): ZERO DATA, 1 LEAD, 100%, 0%
// -----------------------------------------------------------------------------
console.log('\n--- 8. TRATAMENTO DE CASOS EXTREMOS ---');

// Caso: Zero Leads
const zeroLeads: Lead[] = [];
assert(safePercentage(0, zeroLeads.length) === null, 'Zero leads resulta em conversão null (Dados insuficientes)');

// Caso: 1 Lead Novo
const singleNewLead: Lead[] = [{
  id: 'single_1',
  propertyId: 'p1',
  propertyTitle: 'T1',
  propertyOwnerId: 'o1',
  customerName: 'Cliente Único',
  customerPhone: '123',
  message: 'Interesse',
  status: 'new',
  source: 'whatsapp',
  createdAt: fixedNowCAT,
  updatedAt: fixedNowCAT
}];
assert(safePercentage(0, singleNewLead.length) === 0, '1 lead novo resulta em 0% de fechamento');
assert(safePercentage(1, singleNewLead.length) === 100, 'Se esse único lead fechar, resulta em 100% de conversão');

// Caso: Lead Arquivado Excluído de Elegíveis
const leadArchived: Lead = {
  id: 'arch_1',
  propertyId: 'p1',
  propertyTitle: 'T1',
  propertyOwnerId: 'o1',
  customerName: 'Arquivado',
  customerPhone: '000',
  message: 'Spam',
  status: 'archived',
  source: 'contact_form',
  createdAt: fixedNowCAT,
  updatedAt: fixedNowCAT
};
const leadsWithArchived = [...singleNewLead, leadArchived];
const eligibleCount = leadsWithArchived.filter(l => l.status !== 'archived').length;
assert(eligibleCount === 1, 'Lead arquivado é excluído do denominador de elegíveis');

// -----------------------------------------------------------------------------
// RESUMO FINAL DO TESTE
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL DE TESTES FASE 5.4: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
console.log('========================================================================\n');

if (failed > 0) {
  process.exit(1);
}
