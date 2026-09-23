# MEUPLACE — RELATÓRIO TÉCNICO DE INTEGRIDADE DE DADOS & SEGURANÇA
## FASE 4.6: LEAD & ENGAGEMENT DATA INTEGRITY HARDENING V1

**Data:** 22 de Setembro de 2026  
**Sistema:** MeuPlace Moçambique (Marketplace Imobiliário)  
**Status da Auditoria:** 100% Aprovado (Gate: **GO FOR CRM V1**)  
**Cobertura de Testes:** 256/256 testes automatizados PASS  
**TypeScript:** 0 erros  
**Linter:** 0 erros  
**Production Build:** PASS  
**Regras Firestore Deployed:** Sim (`firestore.rules` atualizado e implantado via deployment engine)

---

## 1. RESUMO EXECUTIVO

Durante a Fase 4.6, foi executado o saneamento estrutural e o endurecimento de integridade de dados do ecossistema de leads, agendamentos de visita, telemetria e notificações antes do início do CRM V1.

Principais resultados:
- **Origem Autoritária de Anunciantes:** A relação Imóvel $\to$ Anunciante (`propertyOwnerId` / `agentId`) é agora derivada exclusivamente do documento do imóvel aprovado no Firestore. O cliente não pode forjar nem alterar destinatários de leads ou visitas.
- **Relação Viewing $\to$ Lead:** Visitas agora suportam associação opcional, porém verificada, com um lead existente (`leadId`). O serviço e as regras de segurança rejeitam vínculos entre leads e imóveis distintos.
- **Modelo Canónico e Máquina de Estados:** Unificação estrita de vocabulário (`new`, `contacted`, `qualified`, `negotiating`, `won`, `lost`, `archived`) e bloqueio em duas camadas (serviço TypeScript + Firestore Security Rules) contra transições ilegais ou saltos desordenados.
- **Segregação Estrita de Telemetria vs. Negócio:** `lead_events` agora distingue formalmente telemetria de navegação (visualizações, cliques) de eventos confiáveis de negócio (`lead_created`, `viewing_requested`, `lead_status_changed`, `viewing_status_changed`), exigindo IDs válidos de entidades.
- **Notificações Canónicas e Paginação por Cursor:** Introdução de tipos canónicos (`lead_received`, `viewing_requested`, etc.) e paginação com `startAfter`, limitando o volume inicial a 25 registros e eliminando consumo desnecessário de leituras.
- **Índices Compostos e Otimização:** Adicionados índices compostos para status e ordenação temporal de leads e viewings em `firestore.indexes.json`.

---

## 2. AUDITORIA INICIAL & DIVERGÊNCIAS DETECTADAS (FASE 0)

| Área / Coleção | Divergência Prévia Encontrada | Resolução Aplicada na Fase 4.6 |
|---|---|---|
| **leads.status** | Tipos dispersos continham estados ambíguos como `'viewing'` dentro do lead status. | LeadStatus consolidado em 7 estados unívocos. Visitas têm ciclo próprio em `ViewingStatus`. |
| **viewings $\to$ leads** | Não havia campo `leadId` em `Viewing`, impossibilitando correlação no futuro CRM. | Adicionado `leadId?: string` opcional na interface e validação de consistência com `propertyId`. |
| **lead_events** | Telemetria e eventos de negócio usavam a mesma estrutura sem validação de dependências. | Criados `TELEMETRY_EVENT_TYPES` e `BUSINESS_EVENT_TYPES` com validação de payload obrigatório (`leadId`, `viewingId`). |
| **user_notifications** | Escuta em tempo real baixava todas as notificações do usuário sem paginação (`limit`). | Implementada paginação com cursor (`limit(25)` + `startAfter(lastVisibleDoc)`). |
| **Regras de Segurança** | Anunciantes podiam forjar transições arbitrárias de status no Firestore sem validação de máquina de estados. | Implementadas funções `isValidLeadTransition` e `isValidViewingTransition` no `firestore.rules`. |

---

## 3. INTEGRIDADE IMÓVEL $\to$ PROPRIETÁRIO / AGENTE (FASE 1)

O `leadService.ts` e o `viewingService.ts` implementam derivação autoritária:
```ts
// Derivação estrita do anunciante a partir do imóvel
const propertyOwnerId = property.agentId || property.ownerId || property.userId;
const agentId = property.agentId || propertyOwnerId;
const agencyId = property.agent?.agency || undefined;
```
Nas regras do Firestore (`firestore.rules`):
- O cliente só pode criar leads e viewings para imóveis onde `propertyOwnerId` é preenchido.
- Em atualizações, as chaves `['propertyId', 'propertyOwnerId', 'agentId', 'agencyId', 'customerId', 'createdAt']` são **estritamente imutáveis** via `!request.resource.data.diff(resource.data).affectedKeys().hasAny(...)`.

---

## 4. RELAÇÃO VIEWING $\to$ LEAD (FASE 2)

No agendamento de visitas (`viewingService.ts`):
- O campo `leadId` é suportado opcionalmente na entrada `CreateViewingInput`.
- Quando fornecido, o serviço consulta o lead no Firestore e valida que `lead.propertyId === viewing.propertyId`.
- Caso contrário, a requisição é rejeitada com erro: `"Associação de lead inválida: o lead informado pertence a outro imóvel."`.
- No `firestore.rules`, o campo `leadId` é protegido contra adulteração posterior.

---

## 5. CONSOLIDAÇÃO DO MODELO DE LEAD (FASE 3)

Estrutura canónica do documento `leads/{leadId}`:
```typescript
export interface Lead {
  id?: string;
  propertyId: string;
  propertyTitle: string;
  propertyOwnerId: string;
  agentId?: string;
  agencyId?: string;
  customerId?: string; // Opcional, se o cliente estiver logado
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  message: string;
  contactPreference?: 'whatsapp' | 'phone' | 'email';
  source: LeadSource;
  status: LeadStatus;
  statusNote?: string;
  createdAt: any;
  updatedAt: any;
  lastContactAt?: any;
  archivedAt?: any;
}
```

---

## 6. MÁQUINA DE ESTADOS DO LEAD (FASE 4)

### Vocabulário Oficial
`new` | `contacted` | `qualified` | `negotiating` | `won` | `lost` | `archived`

### Tabela de Transições Permitidas
| Estado Atual | Próximos Estados Válidos | Justificativa |
|---|---|---|
| **new** | `contacted`, `archived` | O anunciante deve primeiro contactar o cliente ou arquivar descarte |
| **contacted** | `qualified`, `lost`, `archived` | Após contacto, qualifica interesse ou marca perda/arquiva |
| **qualified** | `negotiating`, `lost`, `archived` | Cliente com perfil aprovado entra em negociação financeira |
| **negotiating** | `won`, `lost`, `archived` | Conclusão de contrato/arrendamento ou descontinuação |
| **won** | `archived` | Estado de sucesso terminal; permite apenas arquivamento histórico |
| **lost** | `contacted`, `archived` | Permite reativação caso o cliente retome contacto |
| **archived** | `new`, `contacted`, `qualified` | Permite descompactar e reabrir conforme o histórico |

### Aplicação em Duas Camadas
1. **TypeScript (`src/types/index.ts` e `src/services/leadService.ts`):**  
   Função `isValidLeadTransition` valida a transição antes de emitir a chamada de rede.
2. **Firestore Security Rules (`firestore.rules`):**  
   Função `isValidLeadTransition(resource.data.status, request.resource.data.status)` impede qualquer gravação direta fora da máquina de estados.

---

## 7. MÁQUINA DE ESTADOS DE VISITAS (VIEWINGS)

### Vocabulário Oficial
`pending` | `confirmed` | `rejected` | `cancelled` | `completed` | `no_show`

### Tabela de Transições Permitidas
| Estado Atual | Próximos Estados Válidos | Regras de Ator |
|---|---|---|
| **pending** | `confirmed`, `rejected`, `cancelled` | Anunciante confirma/rejeita; solicitante pode cancelar |
| **confirmed** | `completed`, `cancelled`, `no_show` | Anunciante marca realizada ou falta; solicitante cancela |
| **rejected** | `pending` | Permite reagendamento de nova data |
| **cancelled** | `pending` | Permite reabertura se solicitante desejar |
| **completed** | *(Nenhum - terminal)* | Visita finalizada não pode ser desfeita |
| **no_show** | `pending`, `cancelled` | Permite reagendar nova tentativa |

---

## 8. HARDENING DE `lead_events` (FASE 5)

Eventos são agora categorizados em dois conjuntos mutuamente exclusivos:

1. **Telemetria de Navegação (Client-Side):**
   - `property_view` (com proteção de cooldown de 15 minutos em memória / sessão)
   - `whatsapp_click`
   - `phone_click`
   - `contact_form_started`

2. **Eventos de Negócio Confiáveis:**
   - `lead_created` (Requer `leadId` string não-vazio)
   - `viewing_requested` (Requer `viewingId` string não-vazio)
   - `lead_status_changed` (Requer `leadId` string não-vazio)
   - `viewing_status_changed` (Requer `viewingId` string não-vazio)

Nas regras do Firestore, submissões com `eventType == 'lead_created'` sem `leadId` ou `eventType == 'viewing_requested'` sem `viewingId` são bloqueadas na origem.

---

## 9. ARQUITETURA DE `user_notifications` (FASE 6 & 7)

### Tipos Canónicos
- `lead_received`: Notificação de alta prioridade quando novo lead é registrado.
- `viewing_requested`: Notificação quando visita é solicitada.
- `viewing_status_changed`: Notificação quando visita é confirmada, rejeitada ou cancelada.
- `lead_status_changed`: Notificação de transição de status no CRM.
- `property_approved` / `property_rejected`: Moderação de imóveis.
- `saved_search_alert`, `price_drop`, `system`, `message`, `info`, `success`, `warning`, `error`.

### Metadados Enriquecidos
Cada documento em `user_notifications` armazena:
- `category`: `'lead' | 'viewing' | 'property' | 'system' | 'chat'`
- `entityType`: `'lead' | 'viewing' | 'property' | 'system'`
- `entityId`: ID do registro associado
- `propertyId`, `leadId`, `viewingId` (quando aplicável)
- `link`: URL direta para ação no dashboard do anunciante ou comprador
- `priority`: `'low' | 'normal' | 'high'`

---

## 10. PAGINAÇÃO E PERFORMANCE DE LEITURA (FASE 8)

No `NotificationContext.tsx`:
- A escuta em tempo real (`onSnapshot`) restringe a primeira página a `limit(25)`.
- Adicionada a função assíncrona `loadMore()` usando paginação por cursor:
  ```ts
  query(
    collection(db, 'user_notifications'),
    where('userId', '==', currentUser.uid),
    orderBy('createdAt', 'desc'),
    startAfter(lastVisibleDocRef.current),
    limit(25)
  )
  ```
- O estado de paginação (`hasMore`, `isLoadingMore`) evita floods de requisição e saturação de memória no navegador.

---

## 11. ÍNDICES DE BANCO DE DADOS (FASE 9)

Índices compostos registrados em `firestore.indexes.json`:
1. `leads`: `agentId` (ASC) + `status` (ASC) + `createdAt` (DESC)
2. `leads`: `propertyOwnerId` (ASC) + `status` (ASC) + `createdAt` (DESC)
3. `leads`: `propertyId` (ASC) + `status` (ASC) + `createdAt` (DESC)
4. `leads`: `propertyId` (ASC) + `customerPhone` (ASC)
5. `viewings`: `leadId` (ASC) + `createdAt` (DESC)
6. `viewings`: `agentId` (ASC) + `status` (ASC) + `preferredDate` (ASC)
7. `viewings`: `propertyOwnerId` (ASC) + `status` (ASC) + `preferredDate` (ASC)
8. `viewings`: `agentId` (ASC) + `preferredDate` (ASC)
9. `viewings`: `propertyOwnerId` (ASC) + `preferredDate` (ASC)
10. `viewings`: `requesterId` (ASC) + `createdAt` (DESC)
11. `user_notifications`: `userId` (ASC) + `createdAt` (DESC)

---

## 12. MATRIZ DE TESTES AUTOMATIZADOS (FASE 12)

Execução consolidada dos testes:
```bash
npm test
```
Resultados por suíte:
- `propertyQueryBuilder.test.ts`: **25 / 25 PASS**
- `propertyCard.test.ts`: **15 / 15 PASS**
- `leadService.test.ts`: **25 / 25 PASS**
- `leadIntegrity.test.ts`: **51 / 51 PASS**
- `run-penetration-test.ts`: **140 / 140 PASS**
- **TOTAL GERAL:** **256 / 256 PASS (100% Taxa de Sucesso)**

---

## 13. VALIDAÇÃO DE BUILD & TYPESCRIPT

- `npm run lint` (`tsc --noEmit`): **0 erros**
- `npm run build` (`vite build`): **0 erros**
- `deploy_firebase`: **Regras atualizadas e ativas**

---

## 14. GATE FINAL: GO / NO-GO PARA O CRM V1 (FASE 14)

### Veredicto: **GO** (Pronto para início do CRM V1)

**Justificativa Técnica:**
Todas as condições de integridade estrutural, rastreabilidade de eventos, máquina de estados finitos, segregação de privilégios de gravação e paginação foram satisfeitas com 100% de sucesso nos testes automatizados e compilação sem falhas. O ambiente está seguro para o desenvolvimento da interface e regras de gestão de leads do CRM V1.
