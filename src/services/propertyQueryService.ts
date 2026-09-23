import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentSnapshot,
  QueryConstraint,
  Query
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Property } from '@/types';

export interface PropertyFilters {
  type?: string; // 'Venda' | 'Arrendamento' | ''
  category?: string; // 'Apartamento' | 'Vivenda' | etc.
  location?: string; // 'Maputo Cidade' | 'Matola' | etc.
  minPrice?: number;
  maxPrice?: number;
  currency?: 'MZN' | 'USD' | '';
  bedrooms?: number;
  minArea?: number;
  verifiedOnly?: boolean;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'area_desc';
}

export interface PropertySearchResult {
  properties: Property[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  totalReturned: number;
  appliedFirestoreFilters: string[];
  appliedLocalRefinements: string[];
}

export const DEFAULT_PAGE_SIZE = 12;

/**
 * Normaliza os valores de tipo de transação comuns no mercado moçambicano
 */
export function normalizeTransactionType(type?: string): string {
  if (!type) return '';
  const lower = type.toLowerCase().trim();
  if (lower === 'venda' || lower === 'sale' || lower === 'comprar') return 'Venda';
  if (lower === 'arrendamento' || lower === 'rent' || lower === 'aluguel' || lower === 'alugar') return 'Arrendamento';
  return type;
}

/**
 * Converte parâmetros de URL em objeto PropertyFilters tipado
 */
export function searchParamsToFilters(params: URLSearchParams): PropertyFilters {
  const typeParam = params.get('transaction') || params.get('type') || '';
  const categoryParam = params.get('category') || '';
  const locationParam = params.get('city') || params.get('location') || '';
  const minPriceParam = params.get('minPrice');
  const maxPriceParam = params.get('maxPrice');
  const currencyParam = params.get('currency') || '';
  const bedroomsParam = params.get('bedrooms');
  const minAreaParam = params.get('minArea');
  const verifiedParam = params.get('verified');
  const sortParam = params.get('sort') || 'newest';

  return {
    type: normalizeTransactionType(typeParam),
    category: categoryParam,
    location: locationParam,
    minPrice: minPriceParam && !isNaN(Number(minPriceParam)) ? Number(minPriceParam) : undefined,
    maxPrice: maxPriceParam && !isNaN(Number(maxPriceParam)) ? Number(maxPriceParam) : undefined,
    currency: (currencyParam === 'MZN' || currencyParam === 'USD') ? currencyParam : '',
    bedrooms: bedroomsParam && !isNaN(Number(bedroomsParam)) ? Number(bedroomsParam) : undefined,
    minArea: minAreaParam && !isNaN(Number(minAreaParam)) ? Number(minAreaParam) : undefined,
    verifiedOnly: verifiedParam === 'true' || verifiedParam === '1',
    sort: (sortParam as any) || 'newest'
  };
}

/**
 * Converte PropertyFilters em URLSearchParams limpo para compartilhamento
 */
export function filtersToSearchParams(filters: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.location) params.set('location', filters.location);
  if (filters.minPrice !== undefined && filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) params.set('maxPrice', String(filters.maxPrice));
  if (filters.currency) params.set('currency', filters.currency);
  if (filters.bedrooms !== undefined && filters.bedrooms > 0) params.set('bedrooms', String(filters.bedrooms));
  if (filters.minArea !== undefined && filters.minArea > 0) params.set('minArea', String(filters.minArea));
  if (filters.verifiedOnly) params.set('verified', 'true');
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);

  return params;
}

/**
 * Construtor centralizado de queries Firestore para catálogo de imóveis
 * Sempre reforça isApproved == true e aplica filtros suportados no backend.
 */
export function buildPropertySearchQuery(
  filters: PropertyFilters,
  options: {
    pageSize?: number;
    cursor?: DocumentSnapshot | null;
  } = {}
): {
  queryRef: Query;
  appliedFirestoreFilters: string[];
  pendingLocalFilters: string[];
} {
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
  const constraints: QueryConstraint[] = [];
  const appliedFirestoreFilters: string[] = ['isApproved == true'];
  const pendingLocalFilters: string[] = [];

  // 1. OBRIGATÓRIO: Apenas imóveis aprovados são públicos
  constraints.push(where('isApproved', '==', true));

  // 2. Filtro de tipo de transação (Venda / Arrendamento)
  if (filters.type) {
    const normalized = normalizeTransactionType(filters.type);
    constraints.push(where('type', '==', normalized));
    appliedFirestoreFilters.push(`type == '${normalized}'`);
  }

  // 3. Filtro de categoria (Apartamento, Vivenda, etc.)
  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
    appliedFirestoreFilters.push(`category == '${filters.category}'`);
  }

  // 4. Filtro de localização exata / cidade principal
  if (filters.location) {
    constraints.push(where('location', '==', filters.location));
    appliedFirestoreFilters.push(`location == '${filters.location}'`);
  }

  // 5. Filtro de moeda (se especificado)
  if (filters.currency) {
    constraints.push(where('currency', '==', filters.currency));
    appliedFirestoreFilters.push(`currency == '${filters.currency}'`);
  }

  // 6. Filtro de verificação oficial
  if (filters.verifiedOnly) {
    constraints.push(where('verificationStatus', '==', 'approved'));
    appliedFirestoreFilters.push("verificationStatus == 'approved'");
  }

  // 7. Ordenação suportada no Firestore
  const sort = filters.sort || 'newest';
  if (sort === 'price_asc') {
    constraints.push(orderBy('price', 'asc'));
    appliedFirestoreFilters.push("orderBy('price', 'asc')");
  } else if (sort === 'price_desc') {
    constraints.push(orderBy('price', 'desc'));
    appliedFirestoreFilters.push("orderBy('price', 'desc')");
  } else if (sort === 'area_desc') {
    constraints.push(orderBy('area', 'desc'));
    appliedFirestoreFilters.push("orderBy('area', 'desc')");
  } else if (sort === 'oldest') {
    constraints.push(orderBy('createdAt', 'asc'));
    appliedFirestoreFilters.push("orderBy('createdAt', 'asc')");
  } else {
    // Padrão: mais recentes
    constraints.push(orderBy('createdAt', 'desc'));
    appliedFirestoreFilters.push("orderBy('createdAt', 'desc')");
  }

  // Anotações de filtros secundários que podem requerer validação complementar se não puderem ser indexados juntos
  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    pendingLocalFilters.push(`minPrice >= ${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    pendingLocalFilters.push(`maxPrice <= ${filters.maxPrice}`);
  }
  if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
    pendingLocalFilters.push(`bedrooms >= ${filters.bedrooms}`);
  }
  if (filters.minArea !== undefined && filters.minArea > 0) {
    pendingLocalFilters.push(`minArea >= ${filters.minArea}`);
  }

  // 8. Cursor de paginação
  if (options.cursor) {
    constraints.push(startAfter(options.cursor));
  }

  // 9. Limite estrito (nunca buscar catálogo ilimitado)
  // Buscamos 1 extra para verificar se há próxima página
  constraints.push(limit(pageSize + 1));

  const queryRef = query(collection(db, 'properties'), ...constraints);

  return {
    queryRef,
    appliedFirestoreFilters,
    pendingLocalFilters
  };
}

/**
 * Executa a busca de imóveis com tratamento resiliente e paginação
 */
export async function executePropertySearch(
  filters: PropertyFilters,
  options: {
    pageSize?: number;
    cursor?: DocumentSnapshot | null;
  } = {}
): Promise<PropertySearchResult> {
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;

  try {
    const { queryRef, appliedFirestoreFilters, pendingLocalFilters } = buildPropertySearchQuery(filters, options);
    const snapshot = await getDocs(queryRef);

    let docs = snapshot.docs;
    let hasMore = false;

    if (docs.length > pageSize) {
      hasMore = true;
      docs = docs.slice(0, pageSize);
    }

    const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

    let properties: Property[] = docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Property));

    // Refinamento local estritamente delimitado apenas para campos secundários não indexados
    const activeLocalRefinements: string[] = [];
    if (pendingLocalFilters.length > 0) {
      properties = properties.filter(p => {
        if (filters.minPrice !== undefined && filters.minPrice > 0 && Number(p.price) < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice !== undefined && filters.maxPrice > 0 && Number(p.price) > filters.maxPrice) {
          return false;
        }
        if (filters.bedrooms !== undefined && filters.bedrooms > 0 && (p.bedrooms || 0) < filters.bedrooms) {
          return false;
        }
        if (filters.minArea !== undefined && filters.minArea > 0 && (p.area || 0) < filters.minArea) {
          return false;
        }
        return true;
      });
      activeLocalRefinements.push(...pendingLocalFilters);
    }

    return {
      properties,
      lastDoc,
      hasMore,
      totalReturned: properties.length,
      appliedFirestoreFilters,
      appliedLocalRefinements: activeLocalRefinements
    };
  } catch (error: any) {
    // Se o Firestore relatar que falta um índice composto na ordenação personalizada
    if (error?.code === 'failed-precondition') {
      console.warn('[PropertyQueryService] Índice composto necessário detectado. Aplicando fallback de ordenação segura:', error.message);
      
      // Fallback: consulta base com filtros essenciais e limite seguro
      const fallbackConstraints: QueryConstraint[] = [
        where('isApproved', '==', true)
      ];
      if (filters.type) {
        fallbackConstraints.push(where('type', '==', normalizeTransactionType(filters.type)));
      }
      if (filters.category) {
        fallbackConstraints.push(where('category', '==', filters.category));
      }
      if (options.cursor) {
        fallbackConstraints.push(startAfter(options.cursor));
      }
      fallbackConstraints.push(limit(pageSize + 1));

      const fallbackQuery = query(collection(db, 'properties'), ...fallbackConstraints);
      const snapshot = await getDocs(fallbackQuery);
      let docs = snapshot.docs;
      let hasMore = false;
      if (docs.length > pageSize) {
        hasMore = true;
        docs = docs.slice(0, pageSize);
      }
      const lastDoc = docs.length > 0 ? docs[docs.length - 1] : null;

      let properties: Property[] = docs.map(d => ({
        id: d.id,
        ...d.data()
      } as Property));

      // Ordenar em memória no conjunto estritamente limitado
      if (filters.sort === 'price_asc') {
        properties.sort((a, b) => a.price - b.price);
      } else if (filters.sort === 'price_desc') {
        properties.sort((a, b) => b.price - a.price);
      } else if (filters.sort === 'area_desc') {
        properties.sort((a, b) => (b.area || 0) - (a.area || 0));
      }

      return {
        properties,
        lastDoc,
        hasMore,
        totalReturned: properties.length,
        appliedFirestoreFilters: ['isApproved == true (fallback)'],
        appliedLocalRefinements: ['Ordem em memória sobre lote limitado']
      };
    }

    console.error('[PropertyQueryService] Erro ao consultar imóveis no Firestore:', error);
    throw error;
  }
}
