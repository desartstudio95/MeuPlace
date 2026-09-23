# MeuPlace — CRM V1: Query Architecture & Index Optimization

## 1. Princípios de Consulta do CRM

Para sustentar alta escala, eliminar latência desnecessária e proteger o banco de dados contra custos abusivos e varreduras completas (*full table scans*), o CRM V1 adota:
1. **Paginação Estrita por Cursor**: Todas as consultas utilizam `startAfter(lastDocSnapshot)` e `limit(pageSize + 1)`.
2. **Teto Rígido de Busca**: Nenhuma consulta pode retornar mais de 50 registros por página em produção (com corte e sanitização automática).
3. **Prevenção do Problema N+1**: O carregamento da tela de detalhes de um lead (`getLeadDetail`) executa consultas concorrentes paginadas apenas para as 3 coleções filhas daquele `leadId` específico, sem varredura em cascata.
4. **Índices Compostos Cirúrgicos**: Apenas índices estritamente requeridos pelas consultas ativas são criados no `firestore.indexes.json`.

---

## 2. Camada Centralizada de Queries (`crmQueryService.ts`)

A camada `crmQueryService` centraliza e padroniza as consultas do CRM:

### 2.1 Principais Métodos
* `getLeadById(leadId: string)`: Leitura direta por ID (`getDoc`).
* `getLeadDetail(leadId: string)`: Carrega o lead e dispara concorrentemente (`Promise.all`):
  * `leadActivityService.getLeadActivities(leadId, { limitCount: 20 })`
  * `leadTaskService.getLeadTasks(leadId, { limitCount: 20 })`
  * `viewingService.getLeadViewings(leadId, 20)`
* `getLeadsFiltered(filter: CrmLeadFilter, pagination: CrmPaginationOptions)`: Consulta indexada com suporte a filtros combinados de escopo, status, prioridade e fonte.
* `getLeadsForAgent(agentId: string, options)`: Inbox de leads do corretor.
* `getLeadsForOwner(propertyOwnerId: string, options)`: Painel de leads do proprietário.

---

## 3. Mapeamento de Índices Compostos (`firestore.indexes.json`)

Todos os índices compostos implementados têm correspondência 1:1 com as consultas reais do código:

| Coleção | Campos e Ordenação | Consulta Correspondente no Código |
| :--- | :--- | :--- |
| `lead_activities` | `leadId` ASC, `createdAt` DESC | `getLeadActivities(leadId)` |
| `lead_tasks` | `leadId` ASC, `dueAt` ASC | `getLeadTasks(leadId)` (todas tarefas do lead por vencimento) |
| `lead_tasks` | `leadId` ASC, `status` ASC, `dueAt` ASC | `getLeadTasks(leadId, { status: 'pending' })` |
| `lead_tasks` | `assignedTo` ASC, `dueAt` ASC | `getTasksForUser(assignedTo)` (agenda do corretor) |
| `lead_tasks` | `assignedTo` ASC, `status` ASC, `dueAt` ASC | `getTasksForUser(assignedTo, { status: 'pending' })` |
| `leads` | `agentId` ASC, `priority` ASC, `createdAt` DESC | `getLeadsFiltered({ agentId, priority })` |
| `leads` | `propertyOwnerId` ASC, `priority` ASC, `createdAt` DESC | `getLeadsFiltered({ propertyOwnerId, priority })` |
| `viewings` | `leadId` ASC, `createdAt` DESC | `getLeadViewings(leadId)` |
| `viewings` | `leadId` ASC, `preferredDate` ASC | `getUpcomingLeadViewings(leadId)` |

---

## 4. Comparativo de Consumo de Leitura

| Cenário | Arquitetura Tradicional Sem Otimização | Arquitetura CRM V1 MeuPlace |
| :--- | :--- | :--- |
| **Abertura do Lead Detail** | Carrega todo o banco de leads + varre todas as atividades | 1 lead + 20 atividades + 20 tasks + 20 visitas (Máx 61 leituras) |
| **Inbox do Corretor** | `getDocs(collection('leads'))` (Lê milhares de docs) | 20 docs paginados com cursor `startAfter` |
| **Filtro de Prioridade** | Filtragem no cliente após carregar tudo | Filtro nativo indexado no Firestore |
