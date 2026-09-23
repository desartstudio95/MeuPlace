import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { 
  LeadEvent, 
  LeadEventType, 
  isBusinessEvent, 
  isTelemetryEvent, 
  TELEMETRY_EVENT_TYPES, 
  BUSINESS_EVENT_TYPES 
} from '@/types';

export { isBusinessEvent, isTelemetryEvent, TELEMETRY_EVENT_TYPES, BUSINESS_EVENT_TYPES };

// Gerenciador de Sessão Anônima para Rastreamento Seguro de Funil
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  const STORAGE_KEY = 'meuplace_lead_session_id';
  try {
    let sid = sessionStorage.getItem(STORAGE_KEY);
    if (!sid) {
      sid = 'ses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem(STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return 'fallback_session_' + Date.now();
  }
}

// Cooldown em memória para proteção contra refresh abusivo de visualizações
const viewCooldowns = new Map<string, number>();
export const VIEW_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos por imóvel na mesma sessão

export function shouldTrackViewEvent(lastViewTime: number | string | null | undefined, now: number = Date.now()): boolean {
  if (!lastViewTime) return true;
  const lastTime = typeof lastViewTime === 'string' ? parseInt(lastViewTime, 10) : lastViewTime;
  if (isNaN(lastTime)) return true;
  return (now - lastTime) >= VIEW_COOLDOWN_MS;
}

export interface TrackLeadEventOptions {
  leadId?: string;
  viewingId?: string;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Registra eventos reais de interação no funil de conversão imobiliária.
 * Separa estritamente Telemetria de Cliente vs Eventos de Negócio Confiáveis.
 * Nunca altera contadores arbitrários diretamente no cliente e não fabrica métricas.
 */
export async function trackLeadEvent(
  propertyId: string,
  eventType: LeadEventType,
  options?: TrackLeadEventOptions
): Promise<void> {
  if (!propertyId || typeof propertyId !== 'string') return;

  // 1. Validação de tipo de evento suportado
  const allValidTypes = [...TELEMETRY_EVENT_TYPES, ...BUSINESS_EVENT_TYPES];
  if (!allValidTypes.includes(eventType)) {
    if ((import.meta as any).env?.DEV) {
      console.warn(`[LeadEvent] Tipo de evento não reconhecido: ${eventType}`);
    }
    return;
  }

  // 2. Validação estrita para eventos de negócio (requer IDs de entidades válidos)
  if (eventType === 'lead_created' && (!options?.leadId || typeof options.leadId !== 'string')) {
    if ((import.meta as any).env?.DEV) {
      console.warn('[LeadEvent] Evento lead_created descartado: leadId ausente.');
    }
    return;
  }

  if (eventType === 'viewing_requested' && (!options?.viewingId || typeof options.viewingId !== 'string')) {
    if ((import.meta as any).env?.DEV) {
      console.warn('[LeadEvent] Evento viewing_requested descartado: viewingId ausente.');
    }
    return;
  }

  // 3. Proteção contra refresh abusivo de visualização
  if (eventType === 'property_view') {
    const lastViewTime = viewCooldowns.get(propertyId);
    const now = Date.now();
    if (lastViewTime && now - lastViewTime < VIEW_COOLDOWN_MS) {
      // Cooldown ativo: não poluir o banco nem inflar métricas
      return;
    }
    viewCooldowns.set(propertyId, now);
  }

  const sessionId = getOrCreateSessionId();
  const userId = auth.currentUser?.uid;

  const eventPayload: Omit<LeadEvent, 'id'> = {
    propertyId,
    eventType,
    sessionId,
    source: options?.source || (isBusinessEvent(eventType) ? 'crm_service' : 'web_property_details'),
    createdAt: serverTimestamp(),
    ...(userId ? { userId } : {}),
    ...(options?.leadId ? { leadId: options.leadId } : {}),
    ...(options?.viewingId ? { viewingId: options.viewingId } : {}),
    ...(options?.metadata ? { metadata: options.metadata } : {})
  };

  try {
    await addDoc(collection(db, 'lead_events'), eventPayload);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('meuplace:lead_event', {
          detail: { eventType, propertyId, ...options }
        })
      );
    }
  } catch (error) {
    // Falha silenciosa para não quebrar a experiência do utilizador
    if ((import.meta as any).env?.DEV) {
      console.warn('[LeadEvent] Falha silenciosa ao registrar evento:', error);
    }
  }
}
