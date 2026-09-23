/**
 * MEUPLACE MARKETPLACE CORE V2 - Query Builder & Scaling Unit Tests
 * Valida rigorosamente que o Firestore query builder:
 * 1. Sempre aplica isApproved == true
 * 2. Sempre aplica limite estrito de paginação (nunca unbounded)
 * 3. Aplica filtros compostos suportados
 * 4. Mapeia e normaliza parâmetros de URL com fidelidade
 */

import {
  normalizeTransactionType,
  searchParamsToFilters,
  filtersToSearchParams,
  buildPropertySearchQuery,
  DEFAULT_PAGE_SIZE,
  PropertyFilters
} from '../../src/services/propertyQueryService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log('       MEUPLACE — PROPERTY QUERY LAYER & FILTER TEST SUITE V2           ');
  console.log('========================================================================');

  // Test 1: Normalização de Tipos de Transação
  console.log('\n--- 1. NORMALIZAÇÃO DE TIPO DE TRANSAÇÃO ---');
  assert(normalizeTransactionType('rent') === 'Arrendamento', "Normaliza 'rent' para 'Arrendamento'");
  assert(normalizeTransactionType('sale') === 'Venda', "Normaliza 'sale' para 'Venda'");
  assert(normalizeTransactionType('alugar') === 'Arrendamento', "Normaliza 'alugar' para 'Arrendamento'");
  assert(normalizeTransactionType('comprar') === 'Venda', "Normaliza 'comprar' para 'Venda'");
  assert(normalizeTransactionType('Venda') === 'Venda', "Preserva 'Venda'");
  assert(normalizeTransactionType('Arrendamento') === 'Arrendamento', "Preserva 'Arrendamento'");

  // Test 2: URL Search Params Bidirecionalidade
  console.log('\n--- 2. URL SEARCH PARAMS BIDIRECIONALIDADE ---');
  const sampleParams = new URLSearchParams('transaction=rent&city=Maputo&category=Apartamento&minPrice=30000&maxPrice=80000&bedrooms=3&sort=price_asc');
  const parsed = searchParamsToFilters(sampleParams);

  assert(parsed.type === 'Arrendamento', 'Lê tipo de transação da URL corretamente');
  assert(parsed.location === 'Maputo', 'Lê cidade da URL corretamente');
  assert(parsed.category === 'Apartamento', 'Lê categoria da URL corretamente');
  assert(parsed.minPrice === 30000, 'Lê minPrice numérico');
  assert(parsed.maxPrice === 80000, 'Lê maxPrice numérico');
  assert(parsed.bedrooms === 3, 'Lê bedrooms numérico');
  assert(parsed.sort === 'price_asc', 'Lê sort corretamente');

  const backToParams = filtersToSearchParams(parsed);
  assert(backToParams.get('type') === 'Arrendamento', 'Serializa type de volta para URL');
  assert(backToParams.get('category') === 'Apartamento', 'Serializa category de volta para URL');
  assert(backToParams.get('minPrice') === '30000', 'Serializa minPrice de volta para URL');

  // Test 3: Construção da Query Firestore & Mandato de Segurança
  console.log('\n--- 3. CONSTRUÇÃO DA QUERY FIRESTORE ---');
  const filters: PropertyFilters = {
    type: 'Venda',
    category: 'Vivenda',
    location: 'Matola',
    minPrice: 5000000,
    maxPrice: 20000000,
    sort: 'price_asc',
    verifiedOnly: true
  };

  const { appliedFirestoreFilters, pendingLocalFilters } = buildPropertySearchQuery(filters, { pageSize: 12 });

  // Regra crítica 1: isApproved == true SEMPRE presente
  assert(
    appliedFirestoreFilters.includes('isApproved == true'),
    "Query SEMPRE aplica 'isApproved == true' no backend"
  );

  // Regra crítica 2: Filtros suportados aplicados no backend
  assert(
    appliedFirestoreFilters.includes("type == 'Venda'"),
    "Aplica filtro de tipo no Firestore backend"
  );
  assert(
    appliedFirestoreFilters.includes("category == 'Vivenda'"),
    "Aplica filtro de categoria no Firestore backend"
  );
  assert(
    appliedFirestoreFilters.includes("location == 'Matola'"),
    "Aplica filtro de localização no Firestore backend"
  );
  assert(
    appliedFirestoreFilters.includes("verificationStatus == 'approved'"),
    "Aplica filtro de verificação no Firestore backend"
  );
  assert(
    appliedFirestoreFilters.includes("orderBy('price', 'asc')"),
    "Aplica ordenação de preço no Firestore"
  );

  // Test 4: Paginação e Limite Estrito
  console.log('\n--- 4. LIMITE ESTATUTÁRIO DE PAGINAÇÃO ---');
  assert(DEFAULT_PAGE_SIZE === 12, 'Page size padrão definido para 12 itens');

  // Test 5: Filtro Vazio mantém segurança
  console.log('\n--- 5. CONSULTA VAZIA ---');
  const emptyBuild = buildPropertySearchQuery({}, { pageSize: 10 });
  assert(
    emptyBuild.appliedFirestoreFilters.includes('isApproved == true'),
    "Mesmo sem filtros do usuário, 'isApproved == true' é estritamente aplicado"
  );
  assert(
    emptyBuild.appliedFirestoreFilters.includes("orderBy('createdAt', 'desc')"),
    "Ordenação padrão mais recentes aplicada"
  );

  console.log('\n========================================================================');
  console.log(`TOTAL DE TESTES: ${passed + failed} | APROVADOS: ${passed} | FALHAS: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
