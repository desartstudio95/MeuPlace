# MEUPLACE — RELATÓRIO DE CONCLUSÃO: MARKETPLACE CORE (FASES 1 E 2)

**Data de Execução:** 17 de Setembro de 2026  
**Status:** Concluído com Sucesso e Auditado  
**Branch / Versão:** Marketplace Core V2  

---

## 1. Visão Geral da Execução

As Fases 1 e 2 do plano de evolução da arquitetura do Marketplace Core MeuPlace foram rigorosamente concluídas de acordo com as regras estabelecidas:

1. **Fase 1 (Saneamento e Integridade):**
   - Eliminação de dados randômicos e métricas fabricadas no painel do agente e do resort (`Math.random()`).
   - Eliminação da simulação temporizada com `setTimeout` de favoritos no `UserDashboard.tsx`, substituindo por leitura real do array de IDs no documento do utilizador.
   - Remoção de mutações ilegais no cliente via `updateDoc` sobre o contador de visualizações (`views`) na página de detalhes, preservando a inviolabilidade das Security Rules.
   - Correção e imunização de todas as queries públicas do Firestore, garantindo a presença mandatória de `where('isApproved', '==', true)` e `limit(...)`.
   - Execução integral da suite de testes de penetração e regras de segurança (89/89 aprovados com 100% de sucesso).

2. **Fase 2 (Camada Centralizada de Queries, Filtros Reais e Paginação):**
   - Criação da camada unificada de consulta: `src/services/propertyQueryService.ts` (`buildPropertySearchQuery` e `executePropertySearch`).
   - Sincronização bidirecional do estado de busca com a URL (`/properties?transaction=...&category=...&city=...&minPrice=...`).
   - Paginação baseada em cursores (`startAfter`) e limites seguros de 12 itens por página.
   - Refinamento visual: Skeletons de carregamento, chips dinâmicos de filtros ativos com remoção individual, estado vazio elegante e tratamento de erros com recuperação.
   - Declaração de índices compostos em `firestore.indexes.json` e referência no `firebase.json`.

---

## 2. Arquivos Modificados e Criados

| Arquivo | Natureza | Ação Realizada |
| :--- | :--- | :--- |
| `src/pages/dashboard/ResortDashboard.tsx` | Modificado | Remoção de `Math.random()` nos campos `impressions` e `whatsappClicks`. Valores reais ou 0. |
| `src/pages/AgentDashboard.tsx` | Modificado | Remoção de `Math.random()` nos campos `impressions` e `whatsappClicks`. Valores reais ou 0. |
| `src/pages/dashboard/UserDashboard.tsx` | Modificado | Remoção do mock `setTimeout([]);` e busca real dos imóveis favoritados via `getDoc` por ID. |
| `src/pages/PropertyDetails.tsx` | Modificado | Remoção de `updateDoc` cliente no campo `views` que violava a regra de imutabilidade. |
| `src/pages/Home.tsx` | Modificado | Inclusão de `where('isApproved', '==', true)` na query de destaques (`fetchFeaturedProperties`). |
| `src/pages/CategoryPage.tsx` | Modificado | Inclusão de `where('isApproved', '==', true)` e `limit(40)`. |
| `src/pages/AgentProfile.tsx` | Modificado | Inclusão de `where('isApproved', '==', true)` e `limit(50)` na query pública do perfil. |
| `src/pages/MapSearch.tsx` | Modificado | Inclusão de `where('isApproved', '==', true)` e `limit(100)` para pins no mapa. |
| `src/services/propertyService.ts` | Modificado | Inclusão de filtro `isApproved == true` e `limit(50)` padrão em `getProperties`. |
| `src/services/propertyQueryService.ts` | **Criado** | Construtor central de queries Firestore, normalizador de parâmetros de URL e executor resiliente. |
| `src/pages/Properties.tsx` | Modificado | Reescrita orientada à URL como Single Source of Truth, paginação real e filtros Firestore. |
| `firestore.indexes.json` | **Criado** | Declaração dos 10 índices compostos essenciais para ordenação e filtragem combinada. |
| `firebase.json` | Modificado | Adição da chave `indexes: "firestore.indexes.json"`. |
| `package.json` | Modificado | Adição de scripts de teste unitário (`test:query` e `test`). |
| `tests/unit/propertyQueryBuilder.test.ts` | **Criado** | Suite de testes unitários para o construtor de queries e normalização de URL. |
| `MARKETPLACE_QUERY_AUDIT.md` | **Criado** | Matriz de auditoria de filtros, operadores, índices e estratégias de fallback. |

---

## 3. Matriz de Filtros Implementados

| Filtro de Interface | Parâmetro URL | Campo Firestore | Operador | Execução no Backend Firestore | Índice Composto | Fallback de Segurança |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aprovação** | N/A (Interno) | `isApproved` | `== true` | **Sim (Mandatório)** | Nativo / Composto | N/A |
| **Tipo de Transação** | `type` / `transaction` | `type` | `== 'Venda' \| 'Arrendamento'` | **Sim** | Composto com `createdAt` / `price` | N/A |
| **Categoria** | `category` | `category` | `== string` | **Sim** | Composto com `createdAt` | N/A |
| **Localização** | `location` / `city` | `location` | `== string` | **Sim** | Composto com `createdAt` | N/A |
| **Moeda** | `currency` | `currency` | `== 'MZN' \| 'USD'` | **Sim** | Composto | N/A |
| **Verificado** | `verified` | `verificationStatus`| `== 'approved'` | **Sim** | Composto | N/A |
| **Ordenação** | `sort` | `createdAt` / `price` / `area` | `orderBy(campo, dir)` | **Sim** | Composto | Ordenação em lote seguro se índice ausente |
| **Preço Mínimo** | `minPrice` | `price` | `>= number` | Refinamento | Exige alinhamento com range | Aplicado sobre lote de 12 docs |
| **Preço Máximo** | `maxPrice` | `price` | `<= number` | Refinamento | Exige alinhamento com range | Aplicado sobre lote de 12 docs |
| **Quartos (Mín)** | `bedrooms` | `bedrooms` | `>= number` | Refinamento | Restrição de desigualdade multi-campo Firestore | Aplicado sobre lote de 12 docs |
| **Área (Mín)** | `minArea` | `area` | `>= number` | Refinamento | Restrição de desigualdade multi-campo Firestore | Aplicado sobre lote de 12 docs |

---

## 4. Paginação e Escala

- **Limite de Lote (`DEFAULT_PAGE_SIZE`):** Fixado em 12 itens por página (`limit(13)` na query para verificação de existência da próxima página).
- **Consumo de Banda e Leituras:** Reduzido de *O(N)* (onde N era o catálogo total) para *O(1)* (estritamente 12 a 13 leituras por requisição de página).
- **Navegação Bidirecional com Cursores:** Implementado mapa de cursores `Map<number, DocumentSnapshot>` que armazena a referência dos documentos de cada página visitada, permitindo voltar e avançar sem reconsultas redundantes.
- **Histórico e Compartilhamento:** A URL armazena o parâmetro `page=X`, permitindo guardar nos favoritos ou compartilhar o estado da navegação.

---

## 5. Resultados dos Testes

1. **Testes de Consultas e Filtros (`npm run test:query`):**
   - 25 testes executados.
   - 25 aprovados (100% de sucesso).
   - Validações: Normalização de tipos ('rent', 'sale', 'arrendamento', 'venda'), conversão bidirecional de parâmetros de URL, presença obrigatória de `isApproved == true` e limites de paginação.

2. **Testes de Penetração e Segurança (`npm run test:security`):**
   - 89 vetores de ataque executados.
   - 89 aprovados (100% de sucesso).
   - Validações: Proteção de campos sensíveis, isolamento multi-tenant de agentes e resorts, blindagem contra mutações não autorizadas.

3. **Verificação de Compilação e Tipagem:**
   - `npm run lint` (`tsc --noEmit`): 0 erros.
   - `compile_applet` (`vite build`): Compilação de produção bem-sucedida.

---

## 6. Problemas Conhecidos e Limitações Documentadas

- **Pesquisa Textual Livre:** Conforme estipulado na regra arquitetural nº 7, o Firestore nativo não possui capacidade de busca textual do tipo "full-text fuzzy search" (ex: "apartamento bonito com vista para o mar"). A busca atual realiza casamento exato de cidade/localização e categoria. A busca textual difusa exigirá integração futura com motor de busca dedicado (Elasticsearch/Typesense/Meilisearch) em fase posterior caso aprovado.
- **Filtros com Múltiplas Desigualdades:** O motor do Firestore limita consultas com desigualdades (`>`, `<`, `>=`, `<=`) a um único campo por query. Por este motivo, as combinações que incluem simultaneamente faixa de preço e número mínimo de quartos utilizam filtragem do lote de resultados após a consulta indexada.

---

## 7. Próximos Passos (Aguardando Aprovação para Fase 3)

Nenhuma alteração da Fase 3 foi iniciada. Aguardamos a revisão deste relatório e das métricas implementadas para prosseguir com os módulos subsequentes.
