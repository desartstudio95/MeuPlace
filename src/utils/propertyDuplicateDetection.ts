import { Property } from '@/types';
import { 
  DuplicateCandidate, 
  DuplicateMatchFactor, 
  DuplicateSimilarityResult 
} from '@/types/trustQuality';

/**
 * Cálculo determinístico da distância Haversine em metros entre duas coordenadas geográficas.
 * Zero IA — matemática pura de trigonometria esférica.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Tokenização e cálculo de similaridade determinística de Jaccard sobre conjuntos de palavras.
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  const normalize = (str: string) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2); // ignora stopwords curtas (de, em, no, na)

  const tokensA = new Set(normalize(textA));
  const tokensB = new Set(normalize(textB));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  tokensA.forEach(token => {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  });

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * Normaliza textos de localização para comparação robusta.
 */
function normalizeLocationString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Compara dois imóveis e calcula o índice de similaridade determinístico (0 a 100).
 * Identifica se formam um par candidato a duplicado.
 */
export function calculatePropertySimilarity(
  propA: Property,
  propB: Property
): DuplicateSimilarityResult {
  // Mesmo imóvel não é comparado consigo mesmo
  if (propA.id && propB.id && propA.id === propB.id) {
    return { similarityScore: 0, matchingFactors: [], isCandidate: false };
  }

  const matchingFactors: { factor: DuplicateMatchFactor; weight: number; description: string }[] = [];
  let score = 0;

  // 1. Proximidade Geográfica / Coordenadas (até 35 pts)
  const coordsA = propA.coordinates;
  const coordsB = propB.coordinates;
  const hasCoordsA = coordsA && Number.isFinite(coordsA.lat) && Number.isFinite(coordsA.lng);
  const hasCoordsB = coordsB && Number.isFinite(coordsB.lat) && Number.isFinite(coordsB.lng);

  if (hasCoordsA && hasCoordsB) {
    const distanceMeters = calculateHaversineDistanceMeters(
      coordsA.lat,
      coordsA.lng,
      coordsB.lat,
      coordsB.lng
    );

    if (distanceMeters <= 40) {
      score += 35;
      matchingFactors.push({
        factor: 'exact_coordinates',
        weight: 35,
        description: `Coordenadas praticamente idênticas (distância de ${Math.round(distanceMeters)}m)`
      });
    } else if (distanceMeters <= 150) {
      score += 20;
      matchingFactors.push({
        factor: 'nearby_coordinates',
        weight: 20,
        description: `Coordenadas no mesmo quarteirão (distância de ${Math.round(distanceMeters)}m)`
      });
    }
  } else {
    // Fallback: mesmo bairro e mesma cidade
    const locA = normalizeLocationString(propA.location);
    const locB = normalizeLocationString(propB.location);
    const detA = normalizeLocationString(propA.detailedLocation || '');
    const detB = normalizeLocationString(propB.detailedLocation || '');

    if (locA && locB && (locA === locB || locA.includes(locB) || locB.includes(locA))) {
      if (detA && detB && detA === detB) {
        score += 20;
        matchingFactors.push({
          factor: 'same_neighborhood',
          weight: 20,
          description: `Mesma localização e bairro especificado (${propA.location})`
        });
      } else {
        score += 10;
        matchingFactors.push({
          factor: 'same_neighborhood',
          weight: 10,
          description: `Mesma cidade/província declarada (${propA.location})`
        });
      }
    }
  }

  // 2. Categoria e Tipologia (até 25 pts)
  const catA = (propA.category || '').toLowerCase().trim();
  const catB = (propB.category || '').toLowerCase().trim();
  if (catA && catB && catA === catB) {
    score += 10;
    matchingFactors.push({
      factor: 'same_category',
      weight: 10,
      description: `Mesma categoria de imóvel (${propA.category})`
    });
  }

  const bedsMatch = typeof propA.bedrooms === 'number' && typeof propB.bedrooms === 'number' && propA.bedrooms === propB.bedrooms;
  const bathsMatch = typeof propA.bathrooms === 'number' && typeof propB.bathrooms === 'number' && propA.bathrooms === propB.bathrooms;
  if (bedsMatch && bathsMatch && propA.bedrooms !== undefined && propA.bedrooms > 0) {
    score += 15;
    matchingFactors.push({
      factor: 'matching_specs',
      weight: 15,
      description: `Mesma tipologia (${propA.bedrooms} quartos e ${propA.bathrooms} casas de banho)`
    });
  }

  // Área compatível (diferença <= 5%)
  if (
    typeof propA.area === 'number' &&
    typeof propB.area === 'number' &&
    propA.area > 0 &&
    propB.area > 0
  ) {
    const areaDiffRatio = Math.abs(propA.area - propB.area) / Math.max(propA.area, propB.area);
    if (areaDiffRatio <= 0.05) {
      score += 10;
      matchingFactors.push({
        factor: 'matching_specs',
        weight: 10,
        description: `Área útil equivalente (${propA.area} m² vs ${propB.area} m²)`
      });
    }
  }

  // 3. Preço e Moeda (até 15 pts)
  if (
    typeof propA.price === 'number' &&
    typeof propB.price === 'number' &&
    propA.price > 0 &&
    propB.price > 0 &&
    (propA.currency || 'MZN') === (propB.currency || 'MZN')
  ) {
    const priceDiffRatio = Math.abs(propA.price - propB.price) / Math.max(propA.price, propB.price);
    if (priceDiffRatio <= 0.02) {
      score += 15;
      matchingFactors.push({
        factor: 'matching_price',
        weight: 15,
        description: `Preço praticamente idêntico (${propA.price.toLocaleString()} ${propA.currency || 'MZN'})`
      });
    } else if (priceDiffRatio <= 0.08) {
      score += 8;
      matchingFactors.push({
        factor: 'matching_price',
        weight: 8,
        description: `Preço muito próximo (diferença de ${(priceDiffRatio * 100).toFixed(1)}%)`
      });
    }
  }

  // 4. Similaridade Textual (Título + Descrição) (até 15 pts)
  const fullTextA = `${propA.title} ${propA.description || ''}`;
  const fullTextB = `${propB.title} ${propB.description || ''}`;
  const textSim = calculateJaccardSimilarity(fullTextA, fullTextB);
  if (textSim >= 0.5) {
    score += 15;
    matchingFactors.push({
      factor: 'text_similarity',
      weight: 15,
      description: `Alta sobreposição de vocabulário e título (${Math.round(textSim * 100)}% de similaridade)`
    });
  } else if (textSim >= 0.3) {
    score += 8;
    matchingFactors.push({
      factor: 'text_similarity',
      weight: 8,
      description: `Sobreposição moderada no conteúdo do anúncio (${Math.round(textSim * 100)}% de similaridade)`
    });
  }

  // 5. Imagens com URLs idênticos (até 20 pts)
  const imgsA = Array.isArray(propA.images) ? propA.images : [];
  const imgsB = Array.isArray(propB.images) ? propB.images : [];
  if (imgsA.length > 0 && imgsB.length > 0) {
    const setImgsB = new Set(imgsB);
    const sharedImages = imgsA.filter(url => setImgsB.has(url));
    if (sharedImages.length >= 2) {
      score += 20;
      matchingFactors.push({
        factor: 'image_similarity',
        weight: 20,
        description: `${sharedImages.length} imagens idênticas detetadas entre os anúncios`
      });
    } else if (sharedImages.length === 1) {
      score += 10;
      matchingFactors.push({
        factor: 'image_similarity',
        weight: 10,
        description: 'Pelo menos 1 fotografia com URL idêntico entre os anúncios'
      });
    }
  }

  // Limite estrito 0 a 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Candidato se atingir threshold canónico de 65%
  const isCandidate = normalizedScore >= 65;

  return {
    similarityScore: normalizedScore,
    matchingFactors,
    isCandidate
  };
}

/**
 * Varredura determinística de uma lista de imóveis para encontrar candidatos a duplicados de um imóvel-alvo.
 * Zero IA — gera exclusivamente candidatos estruturados para moderação humana.
 */
export function findDuplicateCandidates(
  targetProperty: Property,
  existingProperties: Property[],
  threshold: number = 65
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (const existing of existingProperties) {
    if (!existing.id || existing.id === targetProperty.id) continue;

    const result = calculatePropertySimilarity(targetProperty, existing);
    if (result.similarityScore >= threshold) {
      candidates.push({
        id: `dup_${targetProperty.id}_${existing.id}`,
        primaryPropertyId: targetProperty.id,
        primaryPropertyTitle: targetProperty.title,
        primaryPropertyAgentId: targetProperty.agentId,
        primaryPropertyPrice: targetProperty.price,
        primaryPropertyLocation: targetProperty.location,
        comparedPropertyId: existing.id,
        comparedPropertyTitle: existing.title,
        comparedPropertyAgentId: existing.agentId,
        comparedPropertyPrice: existing.price,
        comparedPropertyLocation: existing.location,
        similarityScore: result.similarityScore,
        matchingFactors: result.matchingFactors.map(f => f.description),
        status: 'pending_review',
        detectedAt: new Date().toISOString()
      });
    }
  }

  // Ordena por maior similaridade primeiro
  return candidates.sort((a, b) => b.similarityScore - a.similarityScore);
}
