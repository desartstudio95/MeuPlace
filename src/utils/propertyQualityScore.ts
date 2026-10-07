import { Property } from '@/types';
import { 
  PropertyQualityScoreResult, 
  QualityScoreFactorItem, 
  QualityTier 
} from '@/types/trustQuality';

/**
 * Motor determinístico de avaliação da qualidade do anúncio (Property Quality Score V1).
 * Zero IA — 100% explicável matematicamente.
 * 
 * Regra: Score = soma de todos os fatores auditáveis.
 * Garantia: 0 <= score <= 100.
 */
export function calculatePropertyQualityScore(property: Property): PropertyQualityScoreResult {
  const breakdown: QualityScoreFactorItem[] = [];
  const penaltyItems: { name: string; penalty: number; description: string }[] = [];
  const suggestions: string[] = [];

  // ===============================================================
  // 1. Fotos e Galeria (Máximo: 25 pontos)
  // ===============================================================
  const images = Array.isArray(property.images) ? property.images.filter(img => typeof img === 'string' && img.trim().length > 0) : [];
  const imageCount = images.length;
  let photoPoints = 0;
  if (imageCount >= 5) {
    photoPoints = 25;
  } else if (imageCount >= 3) {
    photoPoints = 15;
    suggestions.push('Adicione pelo menos 5 fotos de alta resolução para atingir pontuação máxima.');
  } else if (imageCount >= 1) {
    photoPoints = 5;
    suggestions.push('Adicione mais fotos de diferentes divisões do imóvel (mínimo 5 fotos recomendadas).');
  } else {
    photoPoints = 0;
    suggestions.push('Adicione fotos ao anúncio. Anúncios sem fotos perdem mais de 80% do interesse dos compradores.');
  }

  breakdown.push({
    id: 'media_photos',
    name: 'Fotografias do Imóvel',
    category: 'media',
    points: photoPoints,
    maxPoints: 25,
    achieved: photoPoints === 25,
    description: imageCount >= 5 
      ? `Excelente galeria com ${imageCount} fotos (+25 pts)` 
      : imageCount > 0 
        ? `${imageCount} fotos inseridas (+${photoPoints} pts)` 
        : 'Nenhuma foto inserida (0 pts)'
  });

  // ===============================================================
  // 2. Descrição Detalhada (Máximo: 20 pontos)
  // ===============================================================
  const descriptionText = (property.description || '').trim();
  const descLength = descriptionText.length;
  let descPoints = 0;
  if (descLength >= 300) {
    descPoints = 20;
  } else if (descLength >= 150) {
    descPoints = 12;
    suggestions.push('Expanda a descrição detalhando acabamentos, vizinhança e facilidades de acesso (mínimo 300 caracteres).');
  } else if (descLength >= 50) {
    descPoints = 6;
    suggestions.push('A descrição é muito curta. Explique com mais detalhes os diferenciais do imóvel.');
  } else {
    descPoints = 0;
    suggestions.push('Adicione uma descrição rica e completa do imóvel.');
  }

  breakdown.push({
    id: 'desc_length',
    name: 'Descrição Detalhada',
    category: 'description',
    points: descPoints,
    maxPoints: 20,
    achieved: descPoints === 20,
    description: descLength >= 300 
      ? `Descrição rica e completa com ${descLength} caracteres (+20 pts)` 
      : descLength >= 50 
        ? `Descrição com ${descLength} caracteres (+${descPoints} pts)` 
        : 'Descrição insuficiente (0 pts)'
  });

  // ===============================================================
  // 3. Especificações Principais (Máximo: 20 pontos)
  // ===============================================================
  // 3.1 Preço e Moeda (5 pts)
  const hasValidPrice = typeof property.price === 'number' && Number.isFinite(property.price) && property.price > 0;
  const pricePoints = hasValidPrice ? 5 : 0;
  if (!hasValidPrice) {
    suggestions.push('Insira um preço válido e maior que zero.');
  }
  breakdown.push({
    id: 'specs_price',
    name: 'Preço Válido e Moeda',
    category: 'specs',
    points: pricePoints,
    maxPoints: 5,
    achieved: hasValidPrice,
    description: hasValidPrice ? `Preço claramente indicado em ${property.currency || 'MZN'} (+5 pts)` : 'Preço não informado ou inválido (0 pts)'
  });

  // 3.2 Categoria (5 pts)
  const hasCategory = Boolean(property.category && property.category.trim().length > 0);
  const categoryPoints = hasCategory ? 5 : 0;
  if (!hasCategory) {
    suggestions.push('Defina a categoria do imóvel (ex: Apartamento, Vivenda, Terreno).');
  }
  breakdown.push({
    id: 'specs_category',
    name: 'Categoria do Imóvel',
    category: 'specs',
    points: categoryPoints,
    maxPoints: 5,
    achieved: hasCategory,
    description: hasCategory ? `Tipo de propriedade especificado: ${property.category} (+5 pts)` : 'Categoria não definida (0 pts)'
  });

  // 3.3 Tipologia / Quartos e Casas de Banho (5 pts)
  const isLand = property.category?.toLowerCase() === 'terreno';
  const hasBedroomsBathrooms = isLand || (
    (typeof property.bedrooms === 'number' && property.bedrooms >= 0) &&
    (typeof property.bathrooms === 'number' && property.bathrooms >= 0)
  );
  const roomsPoints = hasBedroomsBathrooms ? 5 : 0;
  if (!hasBedroomsBathrooms) {
    suggestions.push('Especifique o número de quartos (T1, T2, T3...) e casas de banho.');
  }
  breakdown.push({
    id: 'specs_rooms',
    name: 'Quartos e Casas de Banho',
    category: 'specs',
    points: roomsPoints,
    maxPoints: 5,
    achieved: hasBedroomsBathrooms,
    description: hasBedroomsBathrooms 
      ? (isLand ? 'Não aplicável para terreno (+5 pts)' : `Tipologia preenchida: ${property.bedrooms} quartos, ${property.bathrooms} WC (+5 pts)`) 
      : 'Número de divisões em falta (0 pts)'
  });

  // 3.4 Área Útil m² (5 pts)
  const hasArea = typeof property.area === 'number' && Number.isFinite(property.area) && property.area > 0;
  const areaPoints = hasArea ? 5 : 0;
  if (!hasArea) {
    suggestions.push('Informe a área útil do imóvel em metros quadrados (m²).');
  }
  breakdown.push({
    id: 'specs_area',
    name: 'Área Útil (m²)',
    category: 'specs',
    points: areaPoints,
    maxPoints: 5,
    achieved: hasArea,
    description: hasArea ? `Área especificada: ${property.area} m² (+5 pts)` : 'Área não informada (0 pts)'
  });

  // ===============================================================
  // 4. Localização Precisa (Máximo: 15 pontos)
  // ===============================================================
  // 4.1 Cidade / Província de Moçambique (5 pts)
  const locationText = typeof property.location === 'string' ? property.location.trim() : '';
  const hasLocation = locationText.length > 0;
  const locPoints = hasLocation ? 5 : 0;
  if (!hasLocation) {
    suggestions.push('Indique a província ou cidade do imóvel.');
  }
  breakdown.push({
    id: 'loc_city',
    name: 'Cidade / Província',
    category: 'location',
    points: locPoints,
    maxPoints: 5,
    achieved: hasLocation,
    description: hasLocation ? `Localidade identificada: ${locationText} (+5 pts)` : 'Localidade não especificada (0 pts)'
  });

  // 4.2 Bairro / Detalhes de Endereço (5 pts)
  const detailedLocationText = (property.detailedLocation || '').trim();
  const hasBairro = detailedLocationText.length > 0 || (locationText.includes(',') || locationText.includes('-'));
  const bairroPoints = hasBairro ? 5 : 0;
  if (!hasBairro) {
    suggestions.push('Adicione o bairro ou zona específica (ex: Polana Cimento, Sommerschield, Costa do Sol, Matola Rio).');
  }
  breakdown.push({
    id: 'loc_neighborhood',
    name: 'Bairro ou Zona Específica',
    category: 'location',
    points: bairroPoints,
    maxPoints: 5,
    achieved: hasBairro,
    description: hasBairro ? 'Bairro/zona identificada com precisão (+5 pts)' : 'Bairro não especificado (0 pts)'
  });

  // 4.3 Coordenadas Geográficas Válidas (5 pts)
  const hasCoordinates = Boolean(
    property.coordinates &&
    typeof property.coordinates.lat === 'number' &&
    typeof property.coordinates.lng === 'number' &&
    Number.isFinite(property.coordinates.lat) &&
    Number.isFinite(property.coordinates.lng) &&
    // Moçambique latitude aproximada: -27 a -10, longitude: 30 a 41
    property.coordinates.lat >= -28 && property.coordinates.lat <= -10 &&
    property.coordinates.lng >= 29 && property.coordinates.lng <= 42
  );
  const coordPoints = hasCoordinates ? 5 : 0;
  if (!hasCoordinates) {
    suggestions.push('Marque a localização exata no mapa interativo.');
  }
  breakdown.push({
    id: 'loc_coords',
    name: 'Coordenadas no Mapa',
    category: 'location',
    points: coordPoints,
    maxPoints: 5,
    achieved: hasCoordinates,
    description: hasCoordinates ? 'Localização geográfica confirmada no mapa (+5 pts)' : 'Sem coordenadas de GPS (0 pts)'
  });

  // ===============================================================
  // 5. Comodidades & Características (Máximo: 10 pontos)
  // ===============================================================
  const features = Array.isArray(property.features) ? property.features.filter(f => typeof f === 'string' && f.trim().length > 0) : [];
  let featPoints = 0;
  if (features.length >= 4) {
    featPoints = 10;
  } else if (features.length >= 1) {
    featPoints = 5;
    suggestions.push('Selecione pelo menos 4 comodidades (ex: Estacionamento, Gerador, Ar Condicionado, Segurança 24h, Piscina).');
  } else {
    featPoints = 0;
    suggestions.push('Selecione as comodidades e atributos que o imóvel possui.');
  }

  breakdown.push({
    id: 'features_list',
    name: 'Comodidades e Atributos',
    category: 'features',
    points: featPoints,
    maxPoints: 10,
    achieved: featPoints === 10,
    description: features.length >= 4 
      ? `${features.length} comodidades selecionadas (+10 pts)` 
      : features.length > 0 
        ? `${features.length} comodidades (+${featPoints} pts)` 
        : 'Nenhuma comodidade selecionada (0 pts)'
  });

  // ===============================================================
  // 6. Multimédia e Transparência Financeira (Máximo: 10 pontos)
  // ===============================================================
  // 6.1 Vídeo ou Tour Virtual (5 pts)
  const hasVirtual = Boolean((property.videoUrl && property.videoUrl.trim().length > 0) || (property.virtualTourUrl && property.virtualTourUrl.trim().length > 0));
  const virtualPoints = hasVirtual ? 5 : 0;
  if (!hasVirtual) {
    suggestions.push('Adicione um link de vídeo do YouTube ou Tour Virtual 360° para atrair compradores remotos.');
  }
  breakdown.push({
    id: 'multimedia_video',
    name: 'Vídeo ou Tour Virtual',
    category: 'finance',
    points: virtualPoints,
    maxPoints: 5,
    achieved: hasVirtual,
    description: hasVirtual ? 'Vídeo ou tour interativo disponível (+5 pts)' : 'Sem recurso de vídeo/tour (0 pts)'
  });

  // 6.2 Custos Adicionais / Condomínio / ROI (5 pts)
  const hasFinanceDetails = Boolean(
    (typeof property.condominiumFee === 'number' && property.condominiumFee >= 0) ||
    (typeof property.propertyTax === 'number' && property.propertyTax >= 0) ||
    (typeof property.roiPercentage === 'number' && property.roiPercentage > 0)
  );
  const finPoints = hasFinanceDetails ? 5 : 0;
  if (!hasFinanceDetails) {
    suggestions.push('Informe os custos fixos (taxa de condomínio e/ou taxa de manutenção predial).');
  }
  breakdown.push({
    id: 'finance_costs',
    name: 'Transparência de Custos Fixos',
    category: 'finance',
    points: finPoints,
    maxPoints: 5,
    achieved: hasFinanceDetails,
    description: hasFinanceDetails ? 'Custos adicionais discriminados (+5 pts)' : 'Sem informação de condomínio/taxas (0 pts)'
  });

  // ===============================================================
  // Penalidades Determinísticas
  // ===============================================================
  // Penalidade se preço zerado ou negativo
  if (typeof property.price === 'number' && property.price <= 0) {
    penaltyItems.push({
      name: 'Preço Zero ou Negativo',
      penalty: -30,
      description: 'Preço inválido penaliza severamente a visibilidade do anúncio (-30 pts).'
    });
  }

  // Penalidade se título muito curto (< 10 caracteres)
  const titleText = (property.title || '').trim();
  if (titleText.length < 10) {
    penaltyItems.push({
      name: 'Título Incompleto',
      penalty: -10,
      description: 'Título curto demais prejudica a busca de compradores (-10 pts).'
    });
    suggestions.push('Crie um título descritivo e claro (ex: "Apartamento T3 Moderno na Polana com Vista ao Mar").');
  }

  // Soma base dos fatores
  const basePoints = breakdown.reduce((acc, item) => acc + item.points, 0);
  const totalPenalties = penaltyItems.reduce((acc, p) => acc + p.penalty, 0);

  // Score bruto
  let rawScore = basePoints + totalPenalties;

  // Garantia matemática: 0 <= score <= 100
  let finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Ajuste de explicabilidade: se houver corte por teto ou piso, inserimos item transparente de normalização
  const currentSum = breakdown.reduce((sum, item) => sum + item.points, 0) + totalPenalties;
  if (currentSum !== finalScore) {
    const delta = finalScore - currentSum;
    if (delta > 0) {
      breakdown.push({
        id: 'score_floor_adjustment',
        name: 'Ajuste de Piso Mínimo',
        category: 'specs',
        points: delta,
        maxPoints: 0,
        achieved: true,
        description: `Normalização matemática para piso mínimo de 0 pontos (+${delta} pts)`
      });
    } else if (delta < 0) {
      breakdown.push({
        id: 'score_cap_adjustment',
        name: 'Ajuste de Teto Máximo',
        category: 'specs',
        points: delta,
        maxPoints: 0,
        achieved: true,
        description: `Normalização matemática para teto máximo de 100 pontos (${delta} pts)`
      });
    }
  }

  // Tier e Rótulo
  let tier: QualityTier = 'poor';
  let label = 'Precisa Melhorar';

  if (finalScore >= 80) {
    tier = 'excellent';
    label = 'Excelente';
  } else if (finalScore >= 60) {
    tier = 'good';
    label = 'Bom';
  } else if (finalScore >= 40) {
    tier = 'fair';
    label = 'Razoável';
  } else {
    tier = 'poor';
    label = 'Precisa Melhorar';
  }

  // Completeness %
  const totalMaxPoints = breakdown.filter(b => b.maxPoints > 0).reduce((acc, i) => acc + i.maxPoints, 0);
  const completenessPercentage = totalMaxPoints > 0 ? Math.round((basePoints / totalMaxPoints) * 100) : finalScore;

  return {
    score: finalScore,
    tier,
    label,
    breakdown,
    penaltyItems,
    suggestions,
    completenessPercentage
  };
}
