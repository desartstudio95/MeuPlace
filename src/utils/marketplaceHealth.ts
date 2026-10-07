import { Property, PropertyReport } from '@/types';
import { 
  DuplicateCandidate, 
  MarketplaceHealthMetrics 
} from '@/types/trustQuality';
import { calculatePropertyFreshness } from './propertyFreshness';
import { calculatePropertyQualityScore } from './propertyQualityScore';

/**
 * Divisão segura contra divisão por zero e valores NaN/Infinity.
 */
function safePercentage(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0 || !Number.isFinite(numerator)) return 0;
  return Math.round((numerator / denominator) * 1000) / 10; // 1 casa decimal
}

/**
 * Agrega metricamente a saúde e qualidade geral do inventário do marketplace.
 * Zero IA — 100% determinístico e auditável.
 */
export function calculateMarketplaceHealth(
  properties: Property[],
  reports: PropertyReport[] = [],
  duplicateCandidates: DuplicateCandidate[] = [],
  nowReference?: Date | string | number
): MarketplaceHealthMetrics {
  const totalListings = properties.length;
  const approvedProperties = properties.filter(p => p.isApproved === true);
  const approvedListings = approvedProperties.length;
  const pendingModerationCount = properties.filter(p => p.isApproved !== true && p.status !== 'Inativo').length;
  const rejectedCount = properties.filter(p => p.status === 'Inativo' || p.moderationStatus === 'rejected').length;

  // 1. Frescura
  let freshCount = 0;
  let expiringSoonCount = 0;
  let pendingConfirmationCount = 0;
  let expiredCount = 0;

  // 2. Qualidade
  let totalQualityScore = 0;
  let excellentCount = 0;
  let goodCount = 0;
  let fairCount = 0;
  let poorCount = 0;

  // 3. Verificações
  let verifiedPropertiesCount = 0;

  approvedProperties.forEach(prop => {
    // Freshness
    const freshness = calculatePropertyFreshness(prop, nowReference);
    if (freshness.freshnessState === 'fresh') freshCount++;
    else if (freshness.freshnessState === 'expiring_soon') expiringSoonCount++;
    else if (freshness.freshnessState === 'stale_pending') pendingConfirmationCount++;
    else if (freshness.freshnessState === 'expired') expiredCount++;

    // Quality
    const quality = calculatePropertyQualityScore(prop);
    totalQualityScore += quality.score;
    if (quality.tier === 'excellent') excellentCount++;
    else if (quality.tier === 'good') goodCount++;
    else if (quality.tier === 'fair') fairCount++;
    else poorCount++;

    // Verification
    if (prop.verificationStatus === 'approved' || prop.inPersonInspected === true) {
      verifiedPropertiesCount++;
    }
  });

  const averageQualityScore = approvedListings > 0 
    ? Math.round(totalQualityScore / approvedListings) 
    : 0;

  const freshPercentage = safePercentage(freshCount, approvedListings);
  const verificationRate = safePercentage(verifiedPropertiesCount, approvedListings);

  // 4. Duplicados
  const openCandidatesCount = duplicateCandidates.filter(c => c.status === 'pending_review').length;
  const confirmedDuplicatesCount = duplicateCandidates.filter(c => c.status === 'confirmed_duplicate').length;

  // 5. Fila de Moderação e Denúncias
  const openReports = reports.filter(r => r.status === 'open' || r.status === 'reviewing');
  const urgentReports = openReports.filter(r => r.reason === 'fraud' || r.reason === 'inexistent');
  const totalOpenItems = pendingModerationCount + openReports.length + openCandidatesCount;
  const urgentItemsCount = urgentReports.length;

  // 6. Marketplace Trust Index (0 a 100)
  // Fórmula determinística:
  // - 35% Frescura do inventário
  // - 35% Qualidade média dos anúncios
  // - 20% Taxa de verificação
  // - 10% Integridade (penalizada por denúncias urgentes e duplicados não tratados)
  const freshnessPart = (freshPercentage / 100) * 35;
  const qualityPart = (averageQualityScore / 100) * 35;
  const verificationPart = (verificationRate / 100) * 20;

  let integrityPart = 10;
  if (urgentItemsCount > 0) integrityPart -= Math.min(5, urgentItemsCount * 2);
  if (openCandidatesCount > 5) integrityPart -= 3;
  integrityPart = Math.max(0, integrityPart);

  const rawTrustIndex = approvedListings > 0
    ? Math.round(freshnessPart + qualityPart + verificationPart + integrityPart)
    : 100; // Se inventário vazio em teste, neutro
  const marketplaceTrustIndex = Math.max(0, Math.min(100, rawTrustIndex));

  let trustTier: 'excellent' | 'strong' | 'moderate' | 'needs_attention' = 'moderate';
  if (marketplaceTrustIndex >= 80) trustTier = 'excellent';
  else if (marketplaceTrustIndex >= 65) trustTier = 'strong';
  else if (marketplaceTrustIndex >= 45) trustTier = 'moderate';
  else trustTier = 'needs_attention';

  return {
    totalListings,
    approvedListings,
    pendingModerationCount,
    rejectedCount,
    freshness: {
      freshCount,
      freshPercentage,
      expiringSoonCount,
      pendingConfirmationCount,
      expiredCount
    },
    quality: {
      averageQualityScore,
      excellentCount,
      goodCount,
      fairCount,
      poorCount
    },
    verifications: {
      verifiedPropertiesCount,
      verificationRate
    },
    duplicates: {
      openCandidatesCount,
      confirmedDuplicatesCount
    },
    moderationQueue: {
      totalOpenItems,
      urgentItemsCount
    },
    marketplaceTrustIndex,
    trustTier,
    calculatedAt: new Date(nowReference ? new Date(nowReference).getTime() : Date.now()).toISOString()
  };
}
