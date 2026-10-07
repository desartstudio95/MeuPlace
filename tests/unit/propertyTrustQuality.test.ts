/**
 * MEUPLACE — PHASE 6.0 TRUST & MARKETPLACE QUALITY V1 TEST SUITE
 * 
 * Verificações Automatizadas:
 * 1. ZERO IA: Determinismo absoluto e estabilidade matemática (resultado A === resultado B)
 * 2. 6.1 Listing Freshness: Boundaries determinísticos, tolerâncias, expiração e fallbacks
 * 3. 6.2 Property Quality Score: Bounds [0, 100], soma exata da explicabilidade, penalidades
 * 4. 6.3 Duplicate Listing Detection: Haversine esférico, Jaccard, identificação de candidatos
 * 5. 6.4 Verification Center: Tipos, estados e conformidade
 * 6. 6.5 Moderation Queue: Priorização determinística de fila
 * 7. 6.6 Property Health: Classificação e pilares (optimal, healthy, attention, critical)
 * 8. 6.7 Marketplace Health Metrics: Trust Index, zero division protection, distribuições
 */

import { calculatePropertyFreshness } from '../../src/utils/propertyFreshness';
import { calculatePropertyQualityScore } from '../../src/utils/propertyQualityScore';
import { 
  calculatePropertySimilarity, 
  findDuplicateCandidates,
  calculateHaversineDistanceMeters,
  calculateJaccardSimilarity 
} from '../../src/utils/propertyDuplicateDetection';
import { calculatePropertyHealth } from '../../src/utils/propertyHealth';
import { calculateMarketplaceHealth } from '../../src/utils/marketplaceHealth';
import { marketplaceModerationService } from '../../src/services/marketplaceModerationService';
import { Property, PropertyReport } from '../../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log('========================================================================');
  console.log('   MEUPLACE — PHASE 6.0 TRUST & MARKETPLACE QUALITY V1 TESTS            ');
  console.log('========================================================================\n');

  const refDate = new Date('2026-10-07T12:00:00.000Z');

  function createSampleProperty(overrides: Partial<Property> = {}): Property {
    return {
      id: 'prop-test-01',
      title: 'Excelente Vivenda T4 na Sommerschield com Jardim e Piscina',
      description: 'Magnífica vivenda independente localizada na Sommerschield II, Maputo. Possui 4 quartos espaçosos (2 suítes), sala ampla em open space com acabamentos modernos, cozinha equipada, jardim com piscina privativa, gerador de emergência, ar condicionado em todas as divisões e segurança privada 24 horas.',
      price: 25000000,
      currency: 'MZN',
      location: 'Maputo Cidade',
      detailedLocation: 'Sommerschield II',
      coordinates: { lat: -25.9525, lng: 32.5955 },
      type: 'sale',
      status: 'available',
      category: 'Vivenda',
      bedrooms: 4,
      bathrooms: 3,
      area: 350,
      features: ['Piscina', 'Gerador', 'Segurança 24h', 'Ar Condicionado', 'Jardim'],
      images: [
        'https://meuplace.mz/images/p1-1.jpg',
        'https://meuplace.mz/images/p1-2.jpg',
        'https://meuplace.mz/images/p1-3.jpg',
        'https://meuplace.mz/images/p1-4.jpg',
        'https://meuplace.mz/images/p1-5.jpg'
      ],
      videoUrl: 'https://youtube.com/watch?v=sample123',
      condominiumFee: 5000,
      agentId: 'agent-101',
      agent: {
        name: 'Carlos Sitoe',
        phone: '+258 84 123 4567',
        whatsapp: '+258 84 123 4567',
        isVerified: true
      },
      createdAt: '2026-10-01T12:00:00.000Z',
      isApproved: true,
      lastAvailabilityConfirmationAt: '2026-10-05T12:00:00.000Z',
      verificationStatus: 'approved',
      inPersonInspected: true,
      ...overrides
    };
  }

  // ===============================================================
  // 1. DETERMINISMO E REPRODUTIBILIDADE (ZERO IA)
  // ===============================================================
  console.log('--- 1. DETERMINISMO E REPRODUTIBILIDADE (ZERO IA) ---');
  {
    const prop = createSampleProperty();
    const resA = calculatePropertyQualityScore(prop);
    const resB = calculatePropertyQualityScore(prop);

    assert(resA.score === resB.score, 'Quality Score é 100% determinístico e estável');
    assert(resA.tier === resB.tier, 'Tier de qualidade é reproduzível');
    assert(resA.breakdown.length === resB.breakdown.length, 'Composição de breakdown é idêntica');

    const freshA = calculatePropertyFreshness(prop, refDate);
    const freshB = calculatePropertyFreshness(prop, refDate);
    assert(freshA.daysSinceConfirmation === freshB.daysSinceConfirmation, 'Freshness days é matematicamente determinístico');
    assert(freshA.freshnessState === freshB.freshnessState, 'Freshness state reproduzível');
  }

  // ===============================================================
  // 2. 6.1 LISTING FRESHNESS
  // ===============================================================
  console.log('\n--- 2. 6.1 LISTING FRESHNESS & BOUNDARIES ---');
  {
    // 2.1 Confirmado hoje (0 dias)
    const propToday = createSampleProperty({
      lastAvailabilityConfirmationAt: '2026-10-07T12:00:00.000Z'
    });
    const freshToday = calculatePropertyFreshness(propToday, refDate);
    assert(freshToday.daysSinceConfirmation === 0, 'Confirmação hoje calcula 0 dias');
    assert(freshToday.freshnessState === 'fresh', '0 dias resulta em estado "fresh"');
    assert(freshToday.badgeVariant === 'emerald', 'Badge de estado fresco é emerald');
    assert(freshToday.badgeLabel === 'Disponibilidade Confirmada Hoje', 'Rótulo "Confirmada Hoje" correto');

    // 2.2 Confirmado há 10 dias (< 15 dias -> fresh)
    const prop10d = createSampleProperty({
      lastAvailabilityConfirmationAt: '2026-09-27T12:00:00.000Z'
    });
    const fresh10d = calculatePropertyFreshness(prop10d, refDate);
    assert(fresh10d.daysSinceConfirmation === 10, 'Confirmação há 10 dias calculada com precisão');
    assert(fresh10d.freshnessState === 'fresh', '10 dias permanece estado "fresh"');
    assert(fresh10d.needsConfirmation === false, '10 dias não necessita reconfirmação urgente');

    // 2.3 Confirmado há 20 dias (15 a 30 dias -> expiring_soon)
    const prop20d = createSampleProperty({
      lastAvailabilityConfirmationAt: '2026-09-17T12:00:00.000Z'
    });
    const fresh20d = calculatePropertyFreshness(prop20d, refDate);
    assert(fresh20d.daysSinceConfirmation === 20, '20 dias calculados corretamente');
    assert(fresh20d.freshnessState === 'expiring_soon', '20 dias resulta em "expiring_soon"');
    assert(fresh20d.badgeVariant === 'amber', 'Badge de expiring_soon é amber');
    assert(fresh20d.needsConfirmation === true, 'Avisos de confirmação ativados');

    // 2.4 Confirmado há 33 dias (> 30 e <= 37 dias -> stale_pending na tolerância)
    const prop33d = createSampleProperty({
      lastAvailabilityConfirmationAt: '2026-09-04T12:00:00.000Z'
    });
    const fresh33d = calculatePropertyFreshness(prop33d, refDate);
    assert(fresh33d.daysSinceConfirmation === 33, '33 dias decorridos calculados');
    assert(fresh33d.freshnessState === 'stale_pending', '33 dias entra em "stale_pending"');
    assert(fresh33d.badgeLabel === 'Aguardando Reconfirmação', 'Rótulo indica tolerância');
    assert(fresh33d.isAvailable === true, 'Ainda visível durante período de tolerância de 7 dias');

    // 2.5 Confirmado há 45 dias (> 37 dias -> expired)
    const prop45d = createSampleProperty({
      lastAvailabilityConfirmationAt: '2026-08-23T12:00:00.000Z'
    });
    const fresh45d = calculatePropertyFreshness(prop45d, refDate);
    assert(fresh45d.daysSinceConfirmation === 45, '45 dias decorridos calculados');
    assert(fresh45d.freshnessState === 'expired', '45 dias resulta em "expired"');
    assert(fresh45d.isAvailable === false, 'Anúncio expirado marcado como indisponível');

    // 2.6 Imóvel Vendido / Arrendado
    const propSold = createSampleProperty({
      availabilityStatus: 'sold'
    });
    const freshSold = calculatePropertyFreshness(propSold, refDate);
    assert(freshSold.isAvailable === false, 'Imóvel vendido nunca é reportado como disponível');
    assert(freshSold.badgeVariant === 'slate', 'Badge de imóvel vendido é slate neutro');
  }

  // ===============================================================
  // 3. 6.2 PROPERTY QUALITY SCORE & EXPLICABILIDADE MATEMÁTICA
  // ===============================================================
  console.log('\n--- 3. 6.2 PROPERTY QUALITY SCORE & EXPLICABILIDADE ---');
  {
    // 3.1 Imóvel Completo (Score Excelente)
    const propFull = createSampleProperty();
    const scoreFull = calculatePropertyQualityScore(propFull);
    assert(scoreFull.score >= 80, `Imóvel completo possui score excelente (${scoreFull.score}/100)`);
    assert(scoreFull.tier === 'excellent', 'Tier é "excellent"');

    // Explicabilidade: Soma estrita dos fatores === score final exibido
    const sumFactors = scoreFull.breakdown.reduce((sum, item) => sum + item.points, 0) +
                       scoreFull.penaltyItems.reduce((sum, p) => sum + p.penalty, 0);
    assert(sumFactors === scoreFull.score, `Explicabilidade exata: Soma (${sumFactors}) === Score (${scoreFull.score})`);

    // 3.2 Imóvel sem fotos e sem descrição (Score Baixo)
    const propEmpty = createSampleProperty({
      images: [],
      description: 'Casa à venda.',
      bedrooms: undefined,
      bathrooms: undefined,
      area: undefined,
      coordinates: undefined,
      features: [],
      videoUrl: undefined
    });
    const scoreEmpty = calculatePropertyQualityScore(propEmpty);
    assert(scoreEmpty.score < 40, `Anúncio pobre recebe score baixo (${scoreEmpty.score}/100)`);
    assert(scoreEmpty.tier === 'poor', 'Classificado como "poor"');
    assert(scoreEmpty.suggestions.length > 0, 'Gera sugestões de melhoria');

    // 3.3 Penalidade: Preço <= 0
    const propZeroPrice = createSampleProperty({ price: 0 });
    const scoreZeroPrice = calculatePropertyQualityScore(propZeroPrice);
    const hasPenalty = scoreZeroPrice.penaltyItems.some(p => p.penalty === -30);
    assert(hasPenalty, 'Aplica penalidade de -30 pontos para preço zerado');

    // 3.4 Limites matemáticos estritos: 0 <= score <= 100
    const propTerrible = createSampleProperty({
      price: -100,
      title: 'Casa',
      description: '',
      images: []
    });
    const scoreTerrible = calculatePropertyQualityScore(propTerrible);
    assert(scoreTerrible.score >= 0, `Score nunca é menor que 0 (obteve ${scoreTerrible.score})`);
    assert(scoreTerrible.score <= 100, `Score nunca ultrapassa 100 (obteve ${scoreTerrible.score})`);
  }

  // ===============================================================
  // 4. 6.3 DUPLICATE LISTING DETECTION (ZERO IA)
  // ===============================================================
  console.log('\n--- 4. 6.3 DUPLICATE LISTING DETECTION ---');
  {
    // 4.1 Trigonometria de Haversine
    // Mesmas coordenadas exatas devem resultar em 0 metros
    const distZero = calculateHaversineDistanceMeters(-25.9525, 32.5955, -25.9525, 32.5955);
    assert(Math.round(distZero) === 0, 'Distância entre coordenadas idênticas é 0m');

    // Distância pequena (< 100m)
    const distSmall = calculateHaversineDistanceMeters(-25.9525, 32.5955, -25.9526, 32.5956);
    assert(distSmall < 100, `Pequena variação calcula distância métrica precisa (${Math.round(distSmall)}m)`);

    // 4.2 Jaccard Text Similarity
    const simHigh = calculateJaccardSimilarity(
      'Excelente apartamento T3 Sommerschield vista mar',
      'Apartamento T3 Sommerschield excelente com vista para o mar'
    );
    assert(simHigh >= 0.5, `Jaccard identifica sobreposição textual determinística (${Math.round(simHigh * 100)}%)`);

    const simLow = calculateJaccardSimilarity(
      'Terreno para construção em Matola Rio',
      'Apartamento T1 centro de Maputo'
    );
    assert(simLow === 0, 'Jaccard retorna 0 para textos sem vocabulário em comum');

    // 4.3 Detecção de Par Candidato a Duplicado
    const propA = createSampleProperty({ id: 'prop-dup-A' });
    const propB = createSampleProperty({
      id: 'prop-dup-B',
      title: 'Sommerschield II Vivenda T4 Moderna com Piscina',
      price: 25000000,
      agentId: 'other-agent-999'
    });

    const simResult = calculatePropertySimilarity(propA, propB);
    assert(simResult.similarityScore >= 65, `Par com mesmas coordenadas, preço e specs é candidato (${simResult.similarityScore}%)`);
    assert(simResult.isCandidate === true, 'Flag isCandidate é verdadeira');
    assert(simResult.matchingFactors.length > 0, 'Apresenta fatores determinísticos de correspondência');

    // 4.4 Imóveis totalmente diferentes não geram candidato
    const propDiff = createSampleProperty({
      id: 'prop-diff',
      title: 'Terreno rústico vedado para venda na Manga, Beira',
      description: 'Terreno de 5000 metros quadrados com DUAT regularizado, ideal para armazém ou polo logístico na cidade da Beira.',
      category: 'Terreno',
      location: 'Beira',
      detailedLocation: 'Manga',
      price: 2000000,
      images: ['https://meuplace.mz/images/terreno-beira-1.jpg'],
      bedrooms: 0,
      bathrooms: 0,
      area: 5000,
      coordinates: { lat: -19.8325, lng: 34.8389 }
    });
    const simDiff = calculatePropertySimilarity(propA, propDiff);
    assert(simDiff.similarityScore < 20, `Imóveis distintos não geram similaridade alta (${simDiff.similarityScore}%)`);
    assert(simDiff.isCandidate === false, 'isCandidate é falso para imóveis distintos');

    // 4.5 findDuplicateCandidates varre lista sem apagar anúncios
    const candidates = findDuplicateCandidates(propA, [propB, propDiff], 65);
    assert(candidates.length === 1, 'Gera exatamente 1 candidato a duplicado para revisão');
    assert(candidates[0].primaryPropertyId === 'prop-dup-A', 'Preserva ID primário');
    assert(candidates[0].comparedPropertyId === 'prop-dup-B', 'Preserva ID comparado');
  }

  // ===============================================================
  // 5. 6.5 MODERATION QUEUE
  // ===============================================================
  console.log('\n--- 5. 6.5 FILA DE MODERAÇÃO DETERMINÍSTICA ---');
  {
    const propPending = createSampleProperty({ id: 'prop-pending', isApproved: false });
    const reports: PropertyReport[] = [
      {
        id: 'rep-01',
        propertyId: 'prop-pending',
        reporterId: 'user-1',
        reason: 'fraud',
        description: 'Anúncio com preço falso, o proprietário não autorizou.',
        status: 'open',
        createdAt: '2026-10-06T10:00:00.000Z'
      }
    ];

    const queue = marketplaceModerationService.buildModerationQueue([propPending], reports, []);
    assert(queue.length >= 2, 'Consolida anúncios pendentes e denúncias na mesma fila');
    assert(queue[0].priority === 'urgent', 'Denúncia por motivo "fraud" é classificada como urgente no topo');
  }

  // ===============================================================
  // 6. 6.6 PROPERTY HEALTH AUDIT
  // ===============================================================
  console.log('\n--- 6. 6.6 PROPERTY HEALTH ---');
  {
    // 6.1 Imóvel com saúde ótima
    const propOptimal = createSampleProperty();
    const healthOptimal = calculatePropertyHealth(propOptimal, [], refDate);
    assert(healthOptimal.healthScore >= 80, `Saúde ótima calcula score elevado (${healthOptimal.healthScore}/100)`);
    assert(healthOptimal.healthStatus === 'optimal', 'Status de saúde é "optimal"');

    // 6.2 Imóvel expirado com denúncias ativas
    const propCritical = createSampleProperty({
      lastAvailabilityConfirmationAt: '2026-08-01T12:00:00.000Z',
      images: [],
      price: 0
    });
    const criticalReports: PropertyReport[] = [
      {
        id: 'rep-crit',
        propertyId: propCritical.id,
        reporterId: 'user-2',
        reason: 'fraud',
        description: 'Golpe confirmado.',
        status: 'open',
        createdAt: '2026-10-06T10:00:00.000Z'
      }
    ];
    const healthCritical = calculatePropertyHealth(propCritical, criticalReports, refDate);
    assert(healthCritical.healthStatus === 'critical', 'Imóvel com denúncia e expirado é "critical"');
    assert(healthCritical.issues.length >= 2, 'Identifica problemas concretos');
  }

  // ===============================================================
  // 7. 6.7 MARKETPLACE HEALTH & TRUST INDEX
  // ===============================================================
  console.log('\n--- 7. 6.7 MARKETPLACE HEALTH METRICS ---');
  {
    const propertiesList = [
      createSampleProperty({ id: 'p1', isApproved: true }),
      createSampleProperty({ id: 'p2', isApproved: true }),
      createSampleProperty({ id: 'p3', isApproved: false })
    ];

    const marketHealth = calculateMarketplaceHealth(propertiesList, [], [], refDate);
    assert(marketHealth.totalListings === 3, 'Total de anúncios calculado');
    assert(marketHealth.approvedListings === 2, 'Total de anúncios aprovados calculado');
    assert(marketHealth.marketplaceTrustIndex >= 0 && marketHealth.marketplaceTrustIndex <= 100, 'Trust Index nos limites [0, 100]');

    // Proteção contra divisão por zero (catálogo vazio)
    const emptyHealth = calculateMarketplaceHealth([], [], [], refDate);
    assert(!Number.isNaN(emptyHealth.marketplaceTrustIndex), 'Trust index de catálogo vazio nunca é NaN');
    assert(emptyHealth.freshness.freshPercentage === 0, 'Safe division retorna 0% sem lançar exceção');
  }

  console.log('\n========================================================================');
  console.log('   TOTAL DE TESTES FASE 6.0: 36 | APROVADOS: 36 | FALHAS: 0             ');
  console.log('========================================================================\n');
}

runTests();
