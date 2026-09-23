/**
 * MEUPLACE TELEMETRY & EVENT SERVICE V2
 * Centraliza eventos de engajamento do marketplace sem mutações não-autorizadas
 * e sem manipulação de contadores arbitrários no cliente.
 */

export type PropertyEventType =
  | 'property_card_view'
  | 'favorite_add'
  | 'favorite_remove'
  | 'compare_add'
  | 'compare_remove'
  | 'property_open'
  | 'whatsapp_contact_click';

export interface PropertyEventPayload {
  eventType: PropertyEventType;
  propertyId: string;
  userId?: string | null;
  timestamp?: string;
  source: string;
  metadata?: Record<string, any>;
}

export function trackPropertyEvent(payload: PropertyEventPayload): void {
  const enrichedEvent = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.pathname : ''
  };

  // Emissão de evento customizado no DOM para desacoplamento e observabilidade
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('meuplace:property_event', {
          detail: enrichedEvent
        })
      );
    } catch {
      // Falha silenciosa para não degradar a experiência do utilizador
    }
  }

  // Logs informativos controlados em ambiente de desenvolvimento
  if ((import.meta as any).env?.DEV) {
    console.debug('[PropertyEvent]', enrichedEvent.eventType, enrichedEvent);
  }
}
