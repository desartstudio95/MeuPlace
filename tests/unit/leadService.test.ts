/**
 * MEUPLACE — PROPERTY DETAILS & LEAD CAPTURE V2 UNIT TESTS
 * Validates Lead creation, deduplication, viewing scheduling, property reporting,
 * and lead event telemetry.
 */

import { validateLeadInput, CreateLeadInput } from '../../src/services/leadService';
import { validateViewingInput, CreateViewingInput } from '../../src/services/viewingService';
import { validateReportInput, CreateReportInput } from '../../src/services/reportService';
import { shouldTrackViewEvent } from '../../src/services/leadEventService';

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
console.log('       MEUPLACE — LEAD CAPTURE & PROPERTY DETAILS TEST SUITE V2         ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. VALIDAÇÃO DE INPUT DE LEAD (ANTI-SPAM & INTEGRIDADE)
// -----------------------------------------------------------------------------
console.log('--- 1. VALIDAÇÃO DE INPUT DE LEAD (ANTI-SPAM & INTEGRIDADE) ---');

const validLead: CreateLeadInput = {
  propertyId: 'prop123',
  customerName: 'Alberto Sitoe',
  customerPhone: '+258 84 123 4567',
  customerEmail: 'alberto@example.com',
  message: 'Olá, tenho interesse neste imóvel e gostaria de agendar uma visita.',
  source: 'contact_form'
};

const validRes = validateLeadInput(validLead);
assert(validRes.valid, 'Lead válido passa na validação sem erros');

const emptyNameRes = validateLeadInput({ ...validLead, customerName: '   ' });
assert(!emptyNameRes.valid && emptyNameRes.error?.includes('nome'), 'Rejeita nome vazio');

const shortNameRes = validateLeadInput({ ...validLead, customerName: 'A' });
assert(!shortNameRes.valid, 'Rejeita nome com menos de 2 caracteres');

const invalidPhoneRes = validateLeadInput({ ...validLead, customerPhone: '123' });
assert(!invalidPhoneRes.valid && invalidPhoneRes.error?.includes('telefone'), 'Rejeita telefone inválido (< 8 dígitos)');

const invalidEmailRes = validateLeadInput({ ...validLead, customerEmail: 'invalido-sem-arroba' });
assert(!invalidEmailRes.valid && invalidEmailRes.error?.includes('email'), 'Rejeita email com formato inválido');

const emptyMsgRes = validateLeadInput({ ...validLead, message: '   ' });
assert(!emptyMsgRes.valid && emptyMsgRes.error?.includes('mensagem'), 'Rejeita mensagem vazia');

const longMsgRes = validateLeadInput({ ...validLead, message: 'x'.repeat(2001) });
assert(!longMsgRes.valid && longMsgRes.error?.includes('2000'), 'Rejeita mensagem excedendo 2000 caracteres');

const missingPropRes = validateLeadInput({ ...validLead, propertyId: '' });
assert(!missingPropRes.valid && missingPropRes.error?.includes('imóvel'), 'Rejeita submissão sem ID de imóvel');

const botLeadRes = validateLeadInput({ ...validLead, honeypot: 'spam_bot_data' });
assert(!botLeadRes.valid && botLeadRes.error?.includes('anti-bot'), 'Honeypot preenchido bloqueia lead de bot automatizado');

// -----------------------------------------------------------------------------
// 2. DEDUPLICAÇÃO E HIGIENE DE CONTACTOS
// -----------------------------------------------------------------------------
console.log('\n--- 2. DEDUPLICAÇÃO E HIGIENE DE CONTACTOS ---');

// Normalização de telefone para comparação de deduplicação
const phoneA = '+258 84 123 4567'.replace(/\D/g, '');
const phoneB = '84 123-4567'.replace(/\D/g, '');
assert(phoneA.endsWith(phoneB) || phoneB.endsWith(phoneA), 'Normalização de telefone detecta números idênticos em formatos diferentes');

// Lógica de janela de 24 horas para deduplicação
const now = Date.now();
const twentyHoursAgo = new Date(now - 20 * 60 * 60 * 1000);
const thirtyHoursAgo = new Date(now - 30 * 60 * 60 * 1000);

const isWithin24h = (d: Date) => (now - d.getTime()) < 24 * 60 * 60 * 1000;
assert(isWithin24h(twentyHoursAgo), 'Lead enviado há 20h é considerado duplicado recente (< 24h)');
assert(!isWithin24h(thirtyHoursAgo), 'Lead enviado há 30h permite novo contacto (> 24h)');

// -----------------------------------------------------------------------------
// 3. AGENDAMENTO DE VISITAS (VIEWINGS)
// -----------------------------------------------------------------------------
console.log('\n--- 3. AGENDAMENTO DE VISITAS (VIEWINGS) ---');

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

const validViewing: CreateViewingInput = {
  propertyId: 'prop123',
  requesterName: 'Marta Guambe',
  requesterPhone: '+258 82 987 6543',
  requesterEmail: 'marta@example.com',
  preferredDate: tomorrowStr,
  preferredTime: '10:00 - 12:00',
  notes: 'Gostaria de ver o quintal e garagem.'
};

const validViewingRes = validateViewingInput(validViewing);
assert(validViewingRes.valid, 'Agendamento com data futura passa na validação');

const pastDateRes = validateViewingInput({ ...validViewing, preferredDate: yesterdayStr });
assert(!pastDateRes.valid && pastDateRes.error?.includes('futura'), 'Rejeita agendamento com data no passado');

const emptyTimeRes = validateViewingInput({ ...validViewing, preferredTime: '' });
assert(!emptyTimeRes.valid && emptyTimeRes.error?.includes('horário'), 'Rejeita agendamento sem horário selecionado');

const invalidViewingPhone = validateViewingInput({ ...validViewing, requesterPhone: '00' });
assert(!invalidViewingPhone.valid, 'Rejeita agendamento com telefone de contacto inválido');

const botViewingRes = validateViewingInput({ ...validViewing, honeypot: 'bot_schedule' });
assert(!botViewingRes.valid && botViewingRes.error?.includes('anti-bot'), 'Honeypot preenchido bloqueia agendamento de bot');

// -----------------------------------------------------------------------------
// 4. DENÚNCIA DE IMÓVEIS (PROPERTY REPORTS)
// -----------------------------------------------------------------------------
console.log('\n--- 4. DENÚNCIA DE IMÓVEIS (PROPERTY REPORTS) ---');

const validReport: CreateReportInput = {
  propertyId: 'prop123',
  reason: 'fraud',
  description: 'Este imóvel usa fotos de outro anúncio já vendido em Maputo.',
  reporterEmail: 'alerta@example.com'
};

const validReportRes = validateReportInput(validReport);
assert(validReportRes.valid, 'Denúncia com motivo válido e descrição adequada é aprovada');

const botReportRes = validateReportInput({ ...validReport, honeypot: 'bot_report' });
assert(!botReportRes.valid && botReportRes.error?.includes('anti-bot'), 'Honeypot preenchido bloqueia denúncia de bot');

const invalidReasonRes = validateReportInput({ ...validReport, reason: 'motivo_invalido' as any });
assert(!invalidReasonRes.valid && invalidReasonRes.error?.includes('motivo'), 'Rejeita denúncia com motivo não categorizado');

const shortReportDescRes = validateReportInput({ ...validReport, description: 'Ruim' });
assert(!shortReportDescRes.valid && shortReportDescRes.error?.includes('10'), 'Rejeita denúncia com descrição insuficiente (< 10 caracteres)');

const longReportDescRes = validateReportInput({ ...validReport, description: 'x'.repeat(2001) });
assert(!longReportDescRes.valid && longReportDescRes.error?.includes('2000'), 'Rejeita denúncia excedendo 2000 caracteres');

// -----------------------------------------------------------------------------
// 5. TELEMETRIA E EVENTOS DE LEAD (FUNIL DE CONVERSÃO)
// -----------------------------------------------------------------------------
console.log('\n--- 5. TELEMETRIA E EVENTOS DE LEAD (FUNIL DE CONVERSÃO) ---');

// Cooldown de visualização para evitar flood por recarregamento da página (30 minutos)
const storageKey = 'mp_view_cooldown_prop123';
const recentTimestamp = String(Date.now() - 5 * 60 * 1000); // 5 min atrás
const expiredTimestamp = String(Date.now() - 35 * 60 * 1000); // 35 min atrás

assert(!shouldTrackViewEvent(recentTimestamp), 'Não contabiliza visualização repetida dentro da janela de cooldown (5 min)');
assert(shouldTrackViewEvent(expiredTimestamp), 'Contabiliza nova visualização após expiração do cooldown (> 30 min)');
assert(shouldTrackViewEvent(null), 'Contabiliza primeira visualização sem registro prévio');

console.log('\n========================================================================');
console.log(`TOTAL DE TESTES: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
console.log('========================================================================');

if (failed > 0) {
  process.exit(1);
}
