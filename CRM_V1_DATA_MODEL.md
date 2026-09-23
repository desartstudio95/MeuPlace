# MeuPlace — CRM V1: Data Model Specification

## 1. Visão Geral
Este documento define o modelo de dados formal do CRM V1 do MeuPlace, projetado para transformar o fluxo transacional de leads em um ecossistema comercial estruturado, mantendo **100% de compatibilidade retroativa** com os registros existentes.

---

## 2. Entidade Principal: Lead

A coleção `/leads` representa a oportunidade comercial gerada a partir do interesse de um cliente em um imóvel específico.

### 2.1 Esquema e Campos

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sim (Firestore ID) | Identificador único do lead. |
| `propertyId` | `string` | Sim | ID do imóvel associado. |
| `propertyTitle` | `string` | Sim | Título do anúncio no momento da criação. |
| `propertyOwnerId` | `string` | Sim | UID do proprietário/anunciante do imóvel. |
| `agentId` | `string` | Não | UID do agente imobiliário atualmente responsável. |
| `agencyId` | `string` | Não | ID da imobiliária vinculada ao agente/imóvel. |
| `customerId` | `string` | Não | UID do comprador (se autenticado no portal). |
| `customerName` | `string` | Sim | Nome completo do proponente (2 a 100 caracteres). |
| `customerPhone` | `string` | Sim | Telefone sanitizado do proponente (mínimo 7 dígitos). |
| `customerEmail` | `string` | Não | Email do proponente com validação sintática RFC. |
| `message` | `string` | Sim | Mensagem de contacto inicial (5 a 2000 caracteres). |
| `contactPreference`| `'whatsapp' \| 'phone' \| 'email'` | Não | Canal preferencial de contacto (padrão: `whatsapp`). |
| `source` | `LeadSource` | Sim | Origem (`contact_form`, `whatsapp_button`, etc.). |
| `status` | `LeadStatus` | Sim | Estado no pipeline (máquina de estados finitos). |
| `priority` | `'low' \| 'medium' \| 'high'` | Não | Grau de prioridade comercial (padrão: `medium`). |
| `score` | `number` | Não | Pontuação opcional de qualificação comercial. |
| `statusNote` | `string` | Não | Anotação sobre a mudança mais recente de status. |
| `createdAt` | `Timestamp / string` | Sim | Timestamp de criação no servidor. |
| `updatedAt` | `Timestamp / string` | Sim | Timestamp da última atualização no servidor. |
| `lastContactAt` | `Timestamp / string` | Não | Timestamp do último contacto realizado. |
| `qualifiedAt` | `Timestamp / string` | Não | Timestamp em que o lead atingiu o status `qualified`. |
| `convertedAt` | `Timestamp / string` | Não | Timestamp em que o negócio foi fechado (`won`). |
| `lostAt` | `Timestamp / string` | Não | Timestamp de descarte ou perda comercial (`lost`). |
| `archivedAt` | `Timestamp / string` | Não | Timestamp de arquivamento formal (`archived`). |
| `metadata` | `Record<string, any>` | Não | Metadados comerciais contextuais extensíveis. |

---

## 3. Entidade: LeadActivity (`/lead_activities`)

Representa o histórico comercial append-only (timeline) do lead. É **estritamente imutável** por clientes para garantir auditoria total das interações.

### 3.1 Esquema e Campos

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sim (Firestore ID) | Identificador único do registro de atividade. |
| `leadId` | `string` | Sim | ID do lead associado. |
| `propertyId` | `string` | Sim | ID do imóvel associado. |
| `type` | `LeadActivityType` | Sim | Tipo canónico de atividade comercial. |
| `actorId` | `string` | Sim | UID do usuário que executou a ação ou `'system'`. |
| `actorName` | `string` | Não | Nome de exibição do autor da ação. |
| `actorRole` | `'agent' \| 'owner' \| 'buyer' \| 'admin' \| 'system'` | Sim | Papel institucional do ator na interação. |
| `title` | `string` | Sim | Resumo descritivo da atividade (máx 200 chars). |
| `description` | `string` | Não | Detalhes adicionais, notas ou ata de conversa. |
| `metadata` | `Record<string, any>` | Não | Dados estruturados (ex: canais, status prévio, etc.). |
| `createdAt` | `Timestamp / string` | Sim | Carimbo de data/hora do servidor. |

### 3.2 Catálogo Canónico de Atividades (`LeadActivityType`)
1. `lead_created`: Criação inicial da oportunidade.
2. `lead_contacted`: Registo de chamada ou mensagem realizada.
3. `status_changed`: Transição de etapa no pipeline.
4. `note_added`: Anotação interna manual do corretor/gestor.
5. `call_logged`: Registo de chamada telefónica atendida ou sem resposta.
6. `whatsapp_sent`: Mensagem comercial enviada via WhatsApp.
7. `email_sent`: Email comercial formal enviado.
8. `viewing_requested`: Solicitação de visita vinculada ao lead.
9. `viewing_confirmed`: Visita confirmada com o cliente.
10. `viewing_completed`: Visita presencial realizada.
11. `viewing_cancelled`: Visita cancelada.
12. `task_created`: Criação de lembrete/tarefa de acompanhamento.
13. `task_completed`: Conclusão de tarefa de follow-up.
14. `assigned`: Atribuição inicial de agente responsável.
15. `reassigned`: Reatribuição de lead para novo agente.
16. `converted`: Negócio fechado com êxito (`won`).
17. `lost`: Lead perdido ou descartado comercialmente (`lost`).

---

## 4. Entidade: LeadTask (`/lead_tasks`)

Representa compromissos, tarefas de acompanhamento (follow-ups) e pendências comerciais vinculadas a um lead.

### 4.1 Esquema e Campos

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sim (Firestore ID) | Identificador da tarefa. |
| `leadId` | `string` | Sim | ID do lead associado. |
| `propertyId` | `string` | Sim | ID do imóvel associado. |
| `assignedTo` | `string` | Sim | UID do agente ou proprietário responsável pela execução. |
| `createdBy` | `string` | Sim | UID do usuário que criou a tarefa (imutável). |
| `title` | `string` | Sim | Título da tarefa (3 a 200 caracteres). |
| `description` | `string` | Não | Orientações detalhadas sobre o follow-up. |
| `status` | `'pending' \| 'completed' \| 'cancelled'` | Sim | Estado da tarefa (padrão: `pending`). |
| `priority` | `'low' \| 'medium' \| 'high'` | Sim | Nível de urgência da tarefa. |
| `dueAt` | `string / Timestamp` | Sim | Data e hora de vencimento estipulada. |
| `completedAt` | `Timestamp / string` | Não | Data/hora de conclusão efetiva. |
| `completedBy` | `string` | Não | UID do usuário que marcou a conclusão. |
| `createdAt` | `Timestamp / string` | Sim | Data de criação no servidor. |
| `updatedAt` | `Timestamp / string` | Sim | Data da última alteração no servidor. |

---

## 5. Entidade: Viewing (`/viewings`) — Relação com CRM

Mantém a estrutura robusta da Fase 4.6, com o campo de ligação `leadId?: string`:

| Campo | Papel no CRM |
| :--- | :--- |
| `leadId` | Chave estrangeira lógica para a oportunidade no CRM. |
| `propertyId` | Garante a integridade do imóvel associado. |
| `requesterId` | Identifica se o solicitante é utilizador registado ou convidado. |
| `status` | Controlado por máquina de estados (`pending`, `confirmed`, `rejected`, `cancelled`, `completed`, `no_show`). |

---

## 6. Retrocompatibilidade Total
1. **Nenhum campo existente foi alterado ou renomeado**: `customerName`, `customerPhone`, `propertyId`, `propertyOwnerId`, `agentId` permanecem idênticos.
2. **Todos os novos campos do modelo de Lead são opcionais**: Qualquer leitura de leads legados pré-CRM opera sem erros ou necessidade de migração offline em lote.
3. **Valores padrão em runtime**: Serviços aplicam `priority: 'medium'` em caso de ausência.
