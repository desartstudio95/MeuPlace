# MEUPLACE — MARKETPLACE QUERY & INDEX AUDIT (V2)

Este documento audita todas as queries do marketplace, descrevendo os campos do Firestore envolvidos, operadores, estratégias de indexação e proteção contra sobrecarga de leituras no cliente.

---

## 1. Mapeamento de Filtros e Execução de Queries

| Filtro | Campo Firestore | Operador | Aplicado no Firestore? | Índice Composto Necessário? | Fallback Local? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Aprovação Pública** | `isApproved` | `== true` | **Sim (100%)** | Automático / Composto | Nenhum (Regra estatutária) |
| **Tipo de Transação** | `type` | `== 'Venda' \| 'Arrendamento'` | **Sim (100%)** | Composto c/ `createdAt` ou `price` | Nenhum |
| **Categoria** | `category` | `== string` | **Sim (100%)** | Composto c/ `createdAt` | Nenhum |
| **Localização / Cidade** | `location` | `== string` | **Sim (100%)** | Composto c/ `createdAt` | Nenhum |
| **Moeda** | `currency` | `== 'MZN' \| 'USD'` | **Sim (100%)** | Composto | Nenhum |
| **Verificado Oficial** | `verificationStatus` | `== 'approved'` | **Sim (100%)** | Composto | Nenhum |
| **Mais Recentes** | `createdAt` | `orderBy('createdAt', 'desc')` | **Sim (100%)** | Composto com filtros de igualdade | Nenhum |
| **Mais Antigos** | `createdAt` | `orderBy('createdAt', 'asc')` | **Sim (100%)** | Composto com filtros de igualdade | Nenhum |
| **Preço Crescente** | `price` | `orderBy('price', 'asc')` | **Sim (100%)** | Composto (`isApproved` + `price`) | Memória se índice não provisionado |
| **Preço Decrescente** | `price` | `orderBy('price', 'desc')` | **Sim (100%)** | Composto (`isApproved` + `price`) | Memória se índice não provisionado |
| **Maior Área** | `area` | `orderBy('area', 'desc')` | **Sim (100%)** | Composto (`isApproved` + `area`) | Memória se índice não provisionado |
| **Preço Mínimo** | `price` | `>= number` | **Refinamento** | Exige desigualdade idêntica ao orderBy | Filtro no lote paginado (12 itens) |
| **Preço Máximo** | `price` | `<= number` | **Refinamento** | Exige desigualdade idêntica ao orderBy | Filtro no lote paginado (12 itens) |
| **Quartos Mínimos** | `bedrooms` | `>= number` | **Refinamento** | Firestore proíbe desigualdade em campos múltiplos | Filtro no lote paginado (12 itens) |
| **Área Mínima** | `area` | `>= number` | **Refinamento** | Firestore proíbe desigualdade em campos múltiplos | Filtro no lote paginado (12 itens) |

---

## 2. Índices Compostos Configurados (`firestore.indexes.json`)

Para suportar as queries combinadas no backend sem custos de ordenação client-side, foram declarados os seguintes índices em `firestore.indexes.json` e integrados ao `firebase.json`:

1. `isApproved` (ASC) + `isPromoted` (DESC) + `createdAt` (DESC)
2. `isApproved` (ASC) + `createdAt` (DESC)
3. `isApproved` (ASC) + `type` (ASC) + `createdAt` (DESC)
4. `isApproved` (ASC) + `category` (ASC) + `createdAt` (DESC)
5. `isApproved` (ASC) + `location` (ASC) + `createdAt` (DESC)
6. `isApproved` (ASC) + `price` (ASC)
7. `isApproved` (ASC) + `price` (DESC)
8. `isApproved` (ASC) + `type` (ASC) + `price` (ASC)
9. `isApproved` (ASC) + `type` (ASC) + `price` (DESC)
10. `isApproved` (ASC) + `area` (DESC)

---

## 3. Garantias de Escala e Limite de Leituras

- **Fim das Consultas Sem Limite:** Todas as consultas públicas utilizam `limit(13)` (12 para a página atual + 1 para detecção do cursor da próxima página).
- **Sem varredura completa da coleção:** A instrução `getDocs(collection(db, 'properties'))` foi completamente erradicada de todas as telas públicas (`Properties.tsx`, `Home.tsx`, `CategoryPage.tsx`, `AgentProfile.tsx`, `MapSearch.tsx`).
- **Cursor de Paginação:** Navegação de páginas baseada em `startAfter(DocumentSnapshot)`, minimizando leituras repetidas e mantendo o consumo de memória O(1) por página.
