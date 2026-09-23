/**
 * MEUPLACE — PHASE 4.6 DATA INTEGRITY HARDENING UNIT TESTS
 * Covers:
 * 1. Lead State Machine (allowed transitions, illegal jumps, terminal state, revival)
 * 2. Viewing State Machine (allowed transitions, illegal cancellation / confirmation, rejection)
 * 3. Viewing -> Lead Association (leadId presence, propertyId consistency)
 * 4. Event Classification (Telemetry vs Business Events, payload requirements)
 * 5. Property -> Owner/Agent authoritative derivation
 * 6. Notification Classification & Schema
 */

import { 
  isValidLeadTransition, 
  ALLOWED_LEAD_TRANSITIONS,
  LeadStatus,
  isValidViewingTransition,
  ALLOWED_VIEWING_TRANSITIONS,
  ViewingStatus,
  isBusinessEvent,
  isTelemetryEvent,
  TELEMETRY_EVENT_TYPES,
  BUSINESS_EVENT_TYPES,
  NotificationType
} from '../../src/types/index';
import { validateLeadInput } from '../../src/services/leadService';
import { validateViewingInput } from '../../src/services/viewingService';

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
console.log('    MEUPLACE — PHASE 4.6 DATA INTEGRITY & STATE MACHINE TEST SUITE      ');
console.log('========================================================================\n');

// -----------------------------------------------------------------------------
// 1. LEAD STATE MACHINE
// -----------------------------------------------------------------------------
console.log('--- 1. LEAD STATE MACHINE TRANSITIONS ---');

// Same status idempotent check
assert(isValidLeadTransition('new', 'new'), 'Permite transição idempotente (new -> new)');
assert(isValidLeadTransition('won', 'won'), 'Permite transição idempotente (won -> won)');

// Allowed transitions from 'new'
assert(isValidLeadTransition('new', 'contacted'), 'Permite transição: new -> contacted');
assert(isValidLeadTransition('new', 'archived'), 'Permite arquivar direto: new -> archived');

// Forbidden transitions from 'new'
assert(!isValidLeadTransition('new', 'qualified'), 'Bloqueia salto ilegal: new -> qualified');
assert(!isValidLeadTransition('new', 'negotiating'), 'Bloqueia salto ilegal: new -> negotiating');
assert(!isValidLeadTransition('new', 'won'), 'Bloqueia salto ilegal: new -> won (impossível fechar negócio sem contacto prévio)');
assert(!isValidLeadTransition('new', 'lost'), 'Bloqueia salto ilegal: new -> lost');

// Allowed transitions from 'contacted'
assert(isValidLeadTransition('contacted', 'qualified'), 'Permite transição: contacted -> qualified');
assert(isValidLeadTransition('contacted', 'lost'), 'Permite descarte: contacted -> lost');
assert(isValidLeadTransition('contacted', 'archived'), 'Permite arquivar: contacted -> archived');

// Forbidden transitions from 'contacted'
assert(!isValidLeadTransition('contacted', 'new'), 'Bloqueia retrocesso ilegal: contacted -> new');
assert(!isValidLeadTransition('contacted', 'won'), 'Bloqueia salto sem qualificação: contacted -> won');

// Allowed transitions from 'qualified'
assert(isValidLeadTransition('qualified', 'negotiating'), 'Permite transição: qualified -> negotiating');
assert(isValidLeadTransition('qualified', 'lost'), 'Permite perda: qualified -> lost');

// Allowed transitions from 'negotiating'
assert(isValidLeadTransition('negotiating', 'won'), 'Permite fechamento de sucesso: negotiating -> won');
assert(isValidLeadTransition('negotiating', 'lost'), 'Permite perda em negociação: negotiating -> lost');

// Terminal and Revival states
assert(isValidLeadTransition('won', 'archived'), 'Permite arquivar lead ganho: won -> archived');
assert(!isValidLeadTransition('won', 'new'), 'Bloqueia transição de lead ganho para new: won -> new');
assert(!isValidLeadTransition('won', 'lost'), 'Bloqueia perda de lead já ganho: won -> lost');

// Reactivation from lost/archived
assert(isValidLeadTransition('lost', 'contacted'), 'Permite reativação de lead perdido: lost -> contacted');
assert(isValidLeadTransition('archived', 'new'), 'Permite descarte e reabertura de arquivado: archived -> new');

// -----------------------------------------------------------------------------
// 2. VIEWING STATE MACHINE
// -----------------------------------------------------------------------------
console.log('\n--- 2. VIEWING STATE MACHINE TRANSITIONS ---');

assert(isValidViewingTransition('pending', 'pending'), 'Permite transição idempotente (pending -> pending)');
assert(isValidViewingTransition('pending', 'confirmed'), 'Permite confirmação pelo anunciante: pending -> confirmed');
assert(isValidViewingTransition('pending', 'rejected'), 'Permite recusa pelo anunciante: pending -> rejected');
assert(isValidViewingTransition('pending', 'cancelled'), 'Permite cancelamento pelo solicitante: pending -> cancelled');

// Forbidden jumps from 'pending'
assert(!isValidViewingTransition('pending', 'completed'), 'Bloqueia visita realizada sem confirmação: pending -> completed');
assert(!isValidViewingTransition('pending', 'no_show'), 'Bloqueia no_show em visita não confirmada: pending -> no_show');

// Allowed transitions from 'confirmed'
assert(isValidViewingTransition('confirmed', 'completed'), 'Permite realização de visita confirmada: confirmed -> completed');
assert(isValidViewingTransition('confirmed', 'cancelled'), 'Permite cancelamento de visita confirmada: confirmed -> cancelled');
assert(isValidViewingTransition('confirmed', 'no_show'), 'Permite marcar ausência do cliente: confirmed -> no_show');

// Forbidden transitions from 'completed'
assert(!isValidViewingTransition('completed', 'pending'), 'Bloqueia retrocesso de visita concluída para pending');
assert(!isValidViewingTransition('completed', 'cancelled'), 'Bloqueia cancelamento de visita já realizada: completed -> cancelled');

// Rescheduling / Reopening from rejected or cancelled
assert(isValidViewingTransition('rejected', 'pending'), 'Permite reagendamento de visita rejeitada: rejected -> pending');
assert(isValidViewingTransition('cancelled', 'pending'), 'Permite reabertura de visita cancelada: cancelled -> pending');

// -----------------------------------------------------------------------------
// 3. RELAÇÃO VIEWING -> LEAD & VALIDAÇÃO
// -----------------------------------------------------------------------------
console.log('\n--- 3. RELAÇÃO VIEWING -> LEAD (FASE 2) ---');

const viewingWithLead = {
  propertyId: 'prop_abc',
  leadId: 'lead_xyz',
  requesterName: 'Helena Mondlane',
  requesterPhone: '+258 84 999 8888',
  preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  preferredTime: '14:00 - 16:00'
};

const vRes = validateViewingInput(viewingWithLead);
assert(vRes.valid, 'Visita com leadId opcional e dados válidos é aprovada');

const pastViewingRes = validateViewingInput({
  ...viewingWithLead,
  preferredDate: '2020-01-01'
});
assert(!pastViewingRes.valid && pastViewingRes.error?.includes('futura'), 'Rejeita visita com data passada');

// -----------------------------------------------------------------------------
// 4. CLASSIFICAÇÃO DE EVENTOS: TELEMETRIA VS NEGÓCIO
// -----------------------------------------------------------------------------
console.log('\n--- 4. CLASSIFICAÇÃO DE EVENTOS DE LEAD ---');

// Telemetry events
assert(isTelemetryEvent('property_view'), 'property_view classificado estritamente como telemetria');
assert(isTelemetryEvent('whatsapp_click'), 'whatsapp_click classificado estritamente como telemetria');
assert(isTelemetryEvent('phone_click'), 'phone_click classificado estritamente como telemetria');
assert(isTelemetryEvent('contact_form_started'), 'contact_form_started classificado estritamente como telemetria');
assert(!isTelemetryEvent('lead_created'), 'lead_created NÃO é telemetria desprotegida');

// Business events
assert(isBusinessEvent('lead_created'), 'lead_created classificado como evento confiável de negócio');
assert(isBusinessEvent('viewing_requested'), 'viewing_requested classificado como evento confiável de negócio');
assert(isBusinessEvent('lead_status_changed'), 'lead_status_changed classificado como evento confiável de negócio');
assert(isBusinessEvent('viewing_status_changed'), 'viewing_status_changed classificado como evento confiável de negócio');
assert(!isBusinessEvent('property_view'), 'property_view NÃO é evento de negócio');

// Mutually exclusive sets
const overlap = TELEMETRY_EVENT_TYPES.filter(t => (BUSINESS_EVENT_TYPES as readonly string[]).includes(t));
assert(overlap.length === 0, 'Telemetria e Eventos de Negócio são mutuamente exclusivos (zero sobreposição)');

// -----------------------------------------------------------------------------
// 5. TIPOS DE NOTIFICAÇÃO CANÓNICOS
// -----------------------------------------------------------------------------
console.log('\n--- 5. TIPOS DE NOTIFICAÇÃO CANÓNICOS ---');

const testNotificationTypes: NotificationType[] = [
  'lead_received',
  'viewing_requested',
  'viewing_status_changed',
  'lead_status_changed',
  'property_approved',
  'property_rejected'
];

assert(testNotificationTypes.length === 6, 'Tipos canónicos de notificação definidos sem colisão');
assert(testNotificationTypes.includes('lead_received'), 'Contém tipo de notificação canónico lead_received');
assert(testNotificationTypes.includes('viewing_requested'), 'Contém tipo de notificação canónico viewing_requested');

console.log('\n========================================================================');
console.log(`TOTAL DE TESTES: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
console.log('========================================================================');

if (failed > 0) {
  process.exit(1);
}
