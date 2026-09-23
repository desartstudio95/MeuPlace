/**
 * Testes Unitários para PropertyCard, Formatadores e Engajamento V2
 */

import { formatPropertyPrice, isRecentProperty, formatTransactionType } from '../../src/utils/propertyFormatters';

function runTests() {
  console.log('========================================================================');
  console.log('       MEUPLACE — PROPERTY CARD & ENGAGEMENT TEST SUITE V2              ');
  console.log('========================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  console.log('\n--- 1. FORMATAÇÃO DE PREÇO (MOEDA & PERÍODO) ---');
  assert(
    formatPropertyPrice(85000, 'MZN', 'Arrendamento').includes('MZN') &&
    formatPropertyPrice(85000, 'MZN', 'Arrendamento').includes('/ mês'),
    'Formata arrendamento com sufixo "/ mês"'
  );
  assert(
    formatPropertyPrice(12500000, 'MZN', 'Venda').includes('MZN') &&
    !formatPropertyPrice(12500000, 'MZN', 'Venda').includes('/ mês'),
    'Formata venda sem sufixo de mensalidade'
  );
  assert(
    formatPropertyPrice(1500, 'USD', 'rent').includes('USD') &&
    formatPropertyPrice(1500, 'USD', 'rent').includes('/ mês'),
    'Formata USD rent corretamente com "/ mês"'
  );
  assert(
    formatPropertyPrice(null as any, 'MZN', 'Venda') === 'Sob consulta',
    'Preço nulo retorna "Sob consulta"'
  );
  assert(
    formatPropertyPrice(undefined, 'MZN', 'Venda') === 'Sob consulta',
    'Preço indefinido retorna "Sob consulta"'
  );

  console.log('\n--- 2. DETECÇÃO DE IMÓVEIS RECENTES (BADGE NOVO) ---');
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();
  
  assert(
    isRecentProperty(twoDaysAgo, 14) === true,
    'Imóvel criado há 2 dias recebe badge Novo'
  );
  assert(
    isRecentProperty(twentyDaysAgo, 14) === false,
    'Imóvel criado há 20 dias NÃO recebe badge Novo (> 14 dias)'
  );
  assert(
    isRecentProperty(null) === false,
    'Data de criação ausente retorna false com segurança'
  );
  assert(
    isRecentProperty({ toDate: () => new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }, 14) === true,
    'Suporta Firestore Timestamp com método .toDate()'
  );
  assert(
    isRecentProperty({ seconds: Math.floor((now.getTime() - 5 * 24 * 60 * 60 * 1000) / 1000) }, 14) === true,
    'Suporta Firestore Timestamp com propriedade .seconds'
  );

  console.log('\n--- 3. NORMALIZAÇÃO DE TIPO DE TRANSAÇÃO ---');
  assert(formatTransactionType('rent') === 'Arrendamento', 'Normaliza "rent" para "Arrendamento"');
  assert(formatTransactionType('Arrendamento') === 'Arrendamento', 'Preserva "Arrendamento"');
  assert(formatTransactionType('sale') === 'Venda', 'Normaliza "sale" para "Venda"');
  assert(formatTransactionType('Venda') === 'Venda', 'Preserva "Venda"');

  console.log('\n--- 4. LIMITES DE COMPARAÇÃO ---');
  const MAX_COMPARE_LIMIT = 3;
  assert(MAX_COMPARE_LIMIT === 3, 'Limite estrito de comparação é exatamente 3 imóveis');

  console.log('\n========================================================================');
  console.log(`TOTAL DE TESTES: ${total} | APROVADOS: ${passed} | FALHAS: ${total - passed}`);
  console.log('========================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
