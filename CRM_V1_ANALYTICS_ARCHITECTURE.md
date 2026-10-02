# MEUPLACE — CRM V1: SALES ANALYTICS & DASHBOARD ARCHITECTURE (FASE 5.4)

## 1. Visão Geral e Princípios Fundamentais

A **Fase 5.4** introduz o Dashboard Comercial e Camada de Sales Analytics V1 do MeuPlace, acessível na rota `/crm/dashboard`.

O objetivo primário é transformar os dados transacionais já gravados no Firestore nas Fases 5.1 (Data Model & Security), 5.2 (Inbox & Pipeline UI) e 5.3 (Operations, Follow-up & Lead Workflow) em métricas comerciais executáveis, precisas e confiáveis.

### Princípio Fundamental: ZERO FAKE DATA
- É terminantemente proibido qualquer valor fictício, randômico (`Math.random()`), mock ou estimativa arbitrária.
- Valores nulos ou sem amostra suficiente exibem explicitamente o estado `"Dados insuficientes"` ou `"--"`.
- O valor numérico `0` (ex: 0 leads fechados) é explicitamente distinguido de `"Sem dados no período"` ou `"Dados indisponíveis"`.
- As percentagens nunca resultam em `NaN` ou `Infinity`; toda operação matemática possui guarda estrita para divisores menores ou iguais a zero.

---

## 2. Estratégia de Datas e Fuso Horário (Moçambique — CAT / UTC+2)

### Fuso Horário Oficial: CAT (Central Africa Time / Africa/Maputo)
Moçambique opera no fuso horário **UTC+2 (CAT)** e não adota horário de verão.

### Estratégia de Armazenamento e Consulta:
1. **Persistência**: As entidades utilizam `serverTimestamp()` do Firestore ou strings ISO-8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
2. **Filtros Temporais**:
   - `7d`: Últimos 7 dias completos até o momento atual.
   - `30d`: Últimos 30 dias completos.
   - `90d`: Últimos 90 dias completos.
   - `custom`: Intervalo delimitado por `startDate` e `endDate`.
   - `all`: Histórico completo disponível.
3. **Limites Inclusivos (Boundaries)**:
   - `startOfPeriod`: `00:00:00.000` no horário de Moçambique (UTC+2) convertido para UTC (`22:00:00.000` do dia anterior em UTC).
   - `endOfPeriod`: `23:59:59.999` no horário de Moçambique (UTC+2) convertido para UTC (`21:59:59.999` do dia em UTC).
4. **Agrupamento Temporal no Gráfico de Tendência (Lead Trend)**:
   - Para períodos de 7 e 30 dias: granularidade **diária** (`YYYY-MM-DD`).
   - Para períodos de 90 dias: granularidade **semanal** (`Semana W, YYYY`).
   - Cada ponto do gráfico reflete leads e visitas reais criadas dentro daquele intervalo exato. Dias sem registos exibem `0` leads (não omissão nem interpolação falsa).

---

## 3. Fontes de Dados e Isolamento Multi-Tenant

O Analytics consome exclusivamente as coleções canónicas existentes:
- `leads`: Dados demográficos, status, prioridade, origem e ciclo de vida do lead.
- `lead_tasks`: Tarefas e follow-ups agendados, concluídos e atrasados.
- `viewings`: Visitas agendadas, confirmadas, realizadas, canceladas e no-show.
- `lead_activities`: Timeline append-only de atividades comerciais (contactos, notas, alterações de status).
- `properties`: Dados descritivos dos imóveis para correlação de desempenho.
- `users`: Identificação de agentes responsáveis e anunciantes.

*Nota:* `lead_events` é utilizado estritamente para telemetria de navegação comportamental e NÃO é utilizado como substituto de eventos comerciais confiáveis.

### Resoluções de Escopo (RBAC & Custódia):
- **Agente Comercial (`role: 'agent'`)**:
  - Escopo `'assigned'`: Leads em que `agentId == currentUser.uid`.
  - Escopo `'owner'`: Leads em imóveis em que `propertyOwnerId == currentUser.uid`.
- **Proprietário / Anunciante (`role: 'owner' | 'user'`)**:
  - Apenas leads de imóveis próprios (`propertyOwnerId == currentUser.uid`).
- **Administrador do Sistema (`role: 'admin'`)**:
  - Suporta escopo `'assigned'`, `'owner'` e `'all'` (visão holística de toda a imobiliária/plataforma).
- **Proteção Anti-Spoofing**: O frontend nunca dita os identificadores de autorização; o serviço deriva a custódia diretamente do token de autenticação e perfil validado.

---

## 4. Fórmulas e Definições Canónicas de Métricas

### 4.1. KPIs de Leads
| Métrica | Definição | Fórmula | Condição de Insuficiência |
|---|---|---|---|
| **Total Leads** | Quantidade total de leads no escopo e período | `COUNT(leads)` | `>= 0` |
| **Novos (New)** | Leads aguardando primeiro atendimento | `COUNT(leads WHERE status = 'new')` | `>= 0` |
| **Contactados** | Leads em que o primeiro contacto foi feito | `COUNT(leads WHERE status = 'contacted')` | `>= 0` |
| **Qualificados** | Leads com perfil e interesse confirmados | `COUNT(leads WHERE status = 'qualified')` | `>= 0` |
| **Em Negociação** | Propostas e negociações ativas | `COUNT(leads WHERE status = 'negotiating')` | `>= 0` |
| **Ganhos (Won)** | Negócios fechados com sucesso | `COUNT(leads WHERE status = 'won')` | `>= 0` |
| **Perdidos (Lost)** | Negócios encerrados sem conversão | `COUNT(leads WHERE status = 'lost')` | `>= 0` |
| **Arquivados** | Leads descartados ou históricos | `COUNT(leads WHERE status = 'archived')` | `>= 0` |

### 4.2. Taxas de Conversão
| Métrica | Numerador | Denominador | Fórmula | Guarda Divisão Zero |
|---|---|---|---|---|
| **Taxa de Fechamento (Won Rate)** | `won` | `total - archived` (Leads elegíveis) | `(won / eligible) * 100` | Se `eligible <= 0` retorna `null` |
| **Taxa de Atendimento Inicial** | `total - new` | `total` | `((total - new) / total) * 100` | Se `total <= 0` retorna `null` |
| **Taxa de Qualificação** | `qualified + negotiating + won` | `total - archived` | `(qualified_or_beyond / eligible) * 100` | Se `eligible <= 0` retorna `null` |

### 4.3. Funil de Vendas Comercial (Commercial Sales Funnel)
O funil comercial respeita a máquina de estados canónica:
```
[ New ] ──────> [ Contacted ] ──────> [ Qualified ] ──────> [ Negotiating ] ──────> [ Won ]
   │                 │                    │                     │
   └──> [Archived]   └──> [Lost / Arch.]  └──> [Lost / Arch.]   └──> [Lost / Arch.]
```
- **New -> Contacted**: `safePercentage(contacted + qualified + negotiating + won, total)`
- **Contacted -> Qualified**: `safePercentage(qualified + negotiating + won, contacted + qualified + negotiating + won)`
- **Qualified -> Negotiating**: `safePercentage(negotiating + won, qualified + negotiating + won)`
- **Negotiating -> Won**: `safePercentage(won, negotiating + won)`
- Leads nos estados `lost` e `archived` são segregados em cartões de desfecho lateral.

### 4.4. KPIs de Follow-ups (Tarefas)
- **Atrasadas (Overdue)**: `status == 'pending' && dueAt < todayStart`
- **Hoje (Today)**: `status == 'pending' && dueAt >= todayStart && dueAt <= todayEnd`
- **Futuras (Upcoming)**: `status == 'pending' && dueAt > todayEnd`
- **Concluídas (Completed)**: `status == 'completed'`
- **Taxa de Conclusão**: `safePercentage(completed, completed + pending + cancelled)`

### 4.5. KPIs de Visitas (Viewings)
- **Pendentes**: `status == 'pending'`
- **Confirmadas**: `status == 'confirmed'`
- **Realizadas (Completed)**: `status == 'completed'`
- **Canceladas**: `status == 'cancelled'`
- **Não Compareceu (No-show)**: `status == 'no_show'`
- **Taxa de Realização (Completion Rate)**: `safePercentage(completed, completed + confirmed + no_show + cancelled)`

---

## 5. Prevenção de Gargalos de Performance e Eliminação de N+1

Para garantir tempos de resposta sub-segundo e economia extrema de leitura no Firestore:
1. **Zero N+1 Queries**:
   - As métricas de desempenho por imóvel (`Property Performance`) e por agente (`Agent Performance`) são agregadas **em memória** a partir dos conjuntos de dados de `leads` e `viewings` já carregados no escopo do utilizador.
   - Não é disparada uma query de banco individual por imóvel ou por corretor.
2. **Reutilização de Cache e Índices Compostos**:
   - As consultas utilizam os índices compostos de `agentId + createdAt` e `propertyOwnerId + createdAt` já declarados em `firestore.indexes.json`.
3. **Carregamento Otimizado**:
   - `Promise.all` concorrido para o carregamento do pacote de leads, visitas e tarefas.
   - Atividades recentes limitadas a 10 registos com leitura indexada por `createdAt DESC`.
