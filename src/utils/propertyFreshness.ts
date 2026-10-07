import { Property } from '@/types';
import { 
  AvailabilityStatus, 
  FreshnessState, 
  PropertyFreshnessInfo,
  AvailabilityConfirmationMethod 
} from '@/types/trustQuality';

// ===============================================================
// Thresholds Canónicos e Determinísticos da Fase 6.0
// ===============================================================

export const DEFAULT_CONFIRMATION_CYCLE_DAYS = 30; // Ciclo padrão de reconfirmação
export const EXPIRING_SOON_THRESHOLD_DAYS = 15;    // A partir de 15 dias entra em alerta prévio
export const GRACE_PERIOD_DAYS = 7;                 // Tolerância de 7 dias após o ciclo (total 37 dias)

/**
 * Converte com segurança múltiplos formatos de data do Firestore/JavaScript para Unix Milliseconds.
 * Suporta Firestore Timestamp ({ seconds, nanoseconds } ou { toDate() }), ISO string, Date e number.
 */
export function parseDateToMillis(dateVal: any, fallbackMillis: number = Date.now()): number {
  if (!dateVal) return fallbackMillis;

  if (typeof dateVal === 'number' && Number.isFinite(dateVal)) {
    return dateVal;
  }

  if (typeof dateVal === 'string') {
    const parsed = Date.parse(dateVal);
    return Number.isNaN(parsed) ? fallbackMillis : parsed;
  }

  if (dateVal instanceof Date) {
    const time = dateVal.getTime();
    return Number.isNaN(time) ? fallbackMillis : time;
  }

  // Firestore Timestamp instance
  if (typeof dateVal?.toDate === 'function') {
    try {
      const d = dateVal.toDate();
      const time = d.getTime();
      return Number.isNaN(time) ? fallbackMillis : time;
    } catch {
      return fallbackMillis;
    }
  }

  // Objeto serializado { seconds, nanoseconds }
  if (typeof dateVal?.seconds === 'number' && Number.isFinite(dateVal.seconds)) {
    return dateVal.seconds * 1000 + (dateVal.nanoseconds ? Math.floor(dateVal.nanoseconds / 1000000) : 0);
  }

  return fallbackMillis;
}

/**
 * Motor determinístico de cálculo de frescura e disponibilidade de anúncios.
 * Zero IA — 100% reprodutível matematicamente.
 */
export function calculatePropertyFreshness(
  property: Property,
  nowReference?: Date | string | number
): PropertyFreshnessInfo {
  const nowMillis = nowReference ? parseDateToMillis(nowReference, Date.now()) : Date.now();
  
  // Status nativo ou inferido
  const rawStatus = (property.availabilityStatus || property.status || 'available').toString().toLowerCase();
  
  // Mapeamento de compatibilidade com valores anteriores ('Disponível', 'Vendido', 'Arrendado', etc.)
  let canonicalStatus: AvailabilityStatus = 'available';
  if (rawStatus === 'sold' || rawStatus === 'vendido') {
    canonicalStatus = 'sold';
  } else if (rawStatus === 'rented' || rawStatus === 'arrendado') {
    canonicalStatus = 'rented';
  } else if (rawStatus === 'reserved' || rawStatus === 'reservado') {
    canonicalStatus = 'reserved';
  } else if (rawStatus === 'unavailable' || rawStatus === 'inativo') {
    canonicalStatus = 'unavailable';
  } else if (rawStatus === 'pending_confirmation') {
    canonicalStatus = 'pending_confirmation';
  } else if (rawStatus === 'expired') {
    canonicalStatus = 'expired';
  } else {
    canonicalStatus = 'available';
  }

  // Referência da última confirmação (ou criação como fallback)
  const fallbackCreationMillis = parseDateToMillis(property.createdAt, nowMillis);
  const lastConfirmedMillis = property.lastAvailabilityConfirmationAt 
    ? parseDateToMillis(property.lastAvailabilityConfirmationAt, fallbackCreationMillis)
    : fallbackCreationMillis;

  // Cálculo de dias decorridos (não-negativo)
  const diffMillis = Math.max(0, nowMillis - lastConfirmedMillis);
  const daysSinceConfirmation = Math.floor(diffMillis / (1000 * 60 * 60 * 24));

  // Prazo máximo de validade
  const cycleDays = DEFAULT_CONFIRMATION_CYCLE_DAYS;
  const expirationMillis = lastConfirmedMillis + (cycleDays * 24 * 60 * 60 * 1000);
  const diffExpirationMillis = expirationMillis - nowMillis;
  const daysUntilExpiration = Math.ceil(diffExpirationMillis / (1000 * 60 * 60 * 24));

  const lastConfirmedIso = new Date(lastConfirmedMillis).toISOString();
  const nextCheckIso = new Date(lastConfirmedMillis + (15 * 24 * 60 * 60 * 1000)).toISOString();
  const expirationIso = new Date(expirationMillis).toISOString();

  // Tratamento de estados terminais / não-disponíveis
  if (canonicalStatus === 'sold' || canonicalStatus === 'rented' || canonicalStatus === 'unavailable') {
    return {
      availabilityStatus: canonicalStatus,
      freshnessState: 'expired',
      daysSinceConfirmation,
      daysUntilExpiration: 0,
      lastConfirmedAt: lastConfirmedIso,
      nextCheckAt: null,
      expirationAt: expirationIso,
      confirmedBy: property.availabilityConfirmedBy || null,
      confirmationMethod: property.availabilityConfirmationMethod || null,
      needsConfirmation: false,
      isAvailable: false,
      badgeLabel: canonicalStatus === 'sold' ? 'Imóvel Vendido' : canonicalStatus === 'rented' ? 'Imóvel Arrendado' : 'Indisponível',
      badgeVariant: 'slate',
      reason: `Imóvel assinalado como ${canonicalStatus}.`
    };
  }

  // Determinação determinística de frescura
  let freshnessState: FreshnessState = 'fresh';
  let badgeVariant: 'emerald' | 'amber' | 'rose' | 'slate' = 'emerald';
  let badgeLabel = 'Disponibilidade Confirmada';
  let reason = '';
  let effectiveStatus: AvailabilityStatus = canonicalStatus;
  let needsConfirmation = false;
  let isAvailable = true;

  if (daysSinceConfirmation <= EXPIRING_SOON_THRESHOLD_DAYS) {
    freshnessState = 'fresh';
    badgeVariant = 'emerald';
    needsConfirmation = false;
    isAvailable = true;
    effectiveStatus = 'available';

    if (daysSinceConfirmation === 0) {
      badgeLabel = 'Disponibilidade Confirmada Hoje';
      reason = 'Disponibilidade reconfirmada hoje pelo anunciante.';
    } else if (daysSinceConfirmation === 1) {
      badgeLabel = 'Confirmado Ontem';
      reason = 'Disponibilidade reconfirmada ontem pelo anunciante.';
    } else {
      badgeLabel = `Confirmado há ${daysSinceConfirmation} dias`;
      reason = `Disponibilidade confirmada há ${daysSinceConfirmation} dias. Anúncio ativo e atualizado.`;
    }
  } else if (daysSinceConfirmation <= cycleDays) {
    freshnessState = 'expiring_soon';
    badgeVariant = 'amber';
    needsConfirmation = true;
    isAvailable = true;
    effectiveStatus = 'available';
    badgeLabel = `Confirmado há ${daysSinceConfirmation} dias`;
    reason = `Disponibilidade requer reconfirmação em ${Math.max(1, daysUntilExpiration)} dias.`;
  } else if (daysSinceConfirmation <= (cycleDays + GRACE_PERIOD_DAYS)) {
    freshnessState = 'stale_pending';
    badgeVariant = 'rose';
    needsConfirmation = true;
    isAvailable = true; // Ainda acessível na tolerância de 7 dias
    effectiveStatus = 'pending_confirmation';
    badgeLabel = 'Aguardando Reconfirmação';
    reason = `Anúncio ultrapassou os ${cycleDays} dias sem reconfirmação. Em período de tolerância de ${GRACE_PERIOD_DAYS} dias.`;
  } else {
    freshnessState = 'expired';
    badgeVariant = 'rose';
    needsConfirmation = true;
    isAvailable = false;
    effectiveStatus = 'expired';
    badgeLabel = 'Disponibilidade Expirada';
    reason = `Sem confirmação há ${daysSinceConfirmation} dias. Anúncio suspenso por inatividade.`;
  }

  return {
    availabilityStatus: effectiveStatus,
    freshnessState,
    daysSinceConfirmation,
    daysUntilExpiration,
    lastConfirmedAt: lastConfirmedIso,
    nextCheckAt: nextCheckIso,
    expirationAt: expirationIso,
    confirmedBy: property.availabilityConfirmedBy || null,
    confirmationMethod: property.availabilityConfirmationMethod || null,
    needsConfirmation,
    isAvailable,
    badgeLabel,
    badgeVariant,
    reason
  };
}
