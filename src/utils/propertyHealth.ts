import { Property, PropertyReport } from '@/types';
import { 
  PropertyHealthInfo, 
  PropertyHealthIssue, 
  PropertyHealthStatus 
} from '@/types/trustQuality';
import { calculatePropertyFreshness } from './propertyFreshness';
import { calculatePropertyQualityScore } from './propertyQualityScore';

/**
 * Motor determinístico de cálculo de Saúde Geral do Imóvel (Property Health V1).
 * Avalia de forma transparente a frescura, completude, conformidade e verificações.
 * Zero IA — 100% auditável.
 */
export function calculatePropertyHealth(
  property: Property,
  reports: PropertyReport[] = [],
  nowReference?: Date | string | number
): PropertyHealthInfo {
  const issues: PropertyHealthIssue[] = [];
  const recommendations: string[] = [];

  const freshness = calculatePropertyFreshness(property, nowReference);
  const quality = calculatePropertyQualityScore(property);

  // Filtra denúncias abertas ativas para este imóvel
  const activeReports = reports.filter(r => r.propertyId === property.id && (r.status === 'open' || r.status === 'reviewing'));

  // Base do cálculo de saúde (0 a 100)
  // Pesos canónicos:
  // - Qualidade do anúncio: 40%
  // - Frescura e disponibilidade: 35%
  // - Verificação oficial: 15%
  // - Compliance e denúncias: 10%
  let healthScore = 0;

  // 1. Parcela de Qualidade (até 40 pts)
  const qualityComponent = (quality.score / 100) * 40;
  healthScore += qualityComponent;

  if (quality.score < 50) {
    issues.push({
      code: 'low_quality_score',
      severity: 'medium',
      message: `Qualidade do anúncio abaixo do padrão (${quality.score}/100).`,
      actionRequired: 'Preencha fotos, descrição completa e especificações do imóvel.'
    });
  }

  // 2. Parcela de Frescura (até 35 pts)
  let freshnessComponent = 0;
  if (freshness.freshnessState === 'fresh') {
    freshnessComponent = 35;
  } else if (freshness.freshnessState === 'expiring_soon') {
    freshnessComponent = 25;
    recommendations.push('Reconfirme a disponibilidade para manter o anúncio no topo das buscas.');
  } else if (freshness.freshnessState === 'stale_pending') {
    freshnessComponent = 10;
    issues.push({
      code: 'pending_availability_confirmation',
      severity: 'high',
      message: 'Disponibilidade requer reconfirmação imediata do anunciante.',
      actionRequired: 'Confirme se o imóvel continua disponível para venda/arrendamento.'
    });
  } else {
    // expired
    freshnessComponent = 0;
    issues.push({
      code: 'availability_expired',
      severity: 'high',
      message: 'Anúncio expirado por ausência de confirmação de disponibilidade.',
      actionRequired: 'Reative o anúncio ou marque como vendido/arrendado.'
    });
  }
  healthScore += freshnessComponent;

  // 3. Parcela de Verificação (até 15 pts)
  const isVerified = property.verificationStatus === 'approved' || property.isApproved;
  const isInspected = property.inPersonInspected === true;
  let verificationComponent = 0;
  if (isInspected) {
    verificationComponent = 15;
  } else if (isVerified) {
    verificationComponent = 10;
    recommendations.push('Agende uma vistoria presencial MeuPlace para obter o selo máximo de confiança.');
  } else {
    verificationComponent = 0;
    recommendations.push('Envie a documentação do imóvel ou certidão predial para verificação formal.');
  }
  healthScore += verificationComponent;

  // 4. Parcela de Compliance e Denúncias (até 10 pts)
  let complianceComponent = 10;
  if (activeReports.length > 0) {
    complianceComponent = 0;
    issues.push({
      code: 'active_reports',
      severity: 'high',
      message: `Existem ${activeReports.length} denúncia(s) aberta(s) de utilizadores pendentes de análise.`,
      actionRequired: 'Verifique o histórico de moderação e resolva as contestações reportadas.'
    });
  }
  healthScore += complianceComponent;

  // Penalidade se o imóvel tiver preço inconsistente ou duplicados associados
  if (property.duplicateCandidateIds && property.duplicateCandidateIds.length > 0) {
    healthScore -= 15;
    issues.push({
      code: 'duplicate_flag',
      severity: 'medium',
      message: 'Possível anúncio duplicado identificado no marketplace.',
      actionRequired: 'Consulte a moderação para validar a titularidade exclusiva do anúncio.'
    });
  }

  // Normalização estrita: 0 a 100
  const normalizedHealthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  // Classificação Canónica
  let healthStatus: PropertyHealthStatus = 'healthy';
  let badgeLabel = 'Saudável';
  let badgeVariant: 'emerald' | 'blue' | 'amber' | 'rose' = 'emerald';

  if (normalizedHealthScore >= 85 && activeReports.length === 0 && freshness.isAvailable) {
    healthStatus = 'optimal';
    badgeLabel = 'Saúde Ótima';
    badgeVariant = 'emerald';
  } else if (normalizedHealthScore >= 65 && freshness.isAvailable) {
    healthStatus = 'healthy';
    badgeLabel = 'Saudável';
    badgeVariant = 'blue';
  } else if (normalizedHealthScore >= 40) {
    healthStatus = 'attention';
    badgeLabel = 'Requer Atenção';
    badgeVariant = 'amber';
  } else {
    healthStatus = 'critical';
    badgeLabel = 'Crítico';
    badgeVariant = 'rose';
  }

  // Adiciona sugestões gerais se houver
  quality.suggestions.forEach(s => {
    if (!recommendations.includes(s) && recommendations.length < 5) {
      recommendations.push(s);
    }
  });

  return {
    healthScore: normalizedHealthScore,
    healthStatus,
    badgeLabel,
    badgeVariant,
    issues,
    recommendations,
    lastAssessedAt: new Date(nowReference ? new Date(nowReference).getTime() : Date.now()).toISOString()
  };
}
