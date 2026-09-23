# MEUPLACE — MODELO DE DADOS DE LEADS, VISITAS & CONVERSÃO V2
**Documento de Arquitetura de Dados — Fase 4**  
**Data:** 19 de Setembro de 2026  
**Status:** Implementado e Verificado em Produção  

---

## 1. Visão Geral da Arquitetura

O ecossistema de conversão do **MeuPlace** estrutura a transição de um visitante anônimo para um cliente qualificado por meio de quatro coleções independentes no Firestore:

1. **`leads`**: Registros comerciais formais de interesse gerados por formulários de contacto direto ou WhatsApp.
2. **`viewings`**: Solicitações estruturadas de agendamento de visitas presenciais ou remotas a imóveis.
3. **`property_reports`**: Canal de denúncias e segurança comunitária para auditoria de anúncios falsos, fraudes ou inconsistências.
4. **`lead_events`**: Fluxo imutável de telemetria de eventos de conversão e engajamento para alimentar o funil do corretor sem permitir manipulação direta de contadores no documento público do imóvel.

---

## 2. Especificação Detalhada das Entidades

### 2.1. Coleção `leads/{leadId}`

Armazena mensagens de contacto e manifestações de interesse com histórico e estado de tratamento comercial.

| Campo | Tipo | Nulo/Opcional | Descrição | Regra de Imutabilidade |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Não | Identificador único do documento (UUID ou Firestore ID) | Imutável |
| `propertyId` | `string` | Não | ID do imóvel de interesse | **Imutável** (Protegido por Security Rules) |
| `propertyTitle` | `string` | Não | Título do anúncio no momento do envio | Imutável |
| `propertyOwnerId` | `string` | Não | UID do proprietário/anunciante do imóvel | **Imutável** (Protegido contra spoofing) |
| `agentId` | `string` | Sim | UID do corretor responsável atribuído | **Imutável** (Pós-atribuição) |
| `agencyId` | `string` | Sim | UID ou código da imobiliária vinculada | **Imutável** (Protegido) |
| `customerId` | `string` | Sim | UID do remetente (quando autenticado) | **Imutável** (Anti-personation) |
| `customerName` | `string` | Não | Nome completo do interessado (2 a 100 caracteres) | Editável pelo interessado/corretor |
| `customerEmail` | `string` | Sim | Endereço de email verificado ou informado | Editável |
| `customerPhone` | `string` | Não | Contacto telefónico (Moçambique ou internacional) | Editável |
| `contactPreference` | `string` | Sim | Preferência de contacto: `'whatsapp' \| 'phone' \| 'email'` | Editável |
| `message` | `string` | Não | Conteúdo da mensagem (5 a 2000 caracteres) | Editável (Deduplicação) |
| `status` | `LeadStatus` | Não | Estado no funil: `'new' \| 'contacted' \| 'qualified' \| 'viewing_scheduled' \| 'negotiating' \| 'won' \| 'lost' \| 'spam'` | **Inicial estrito: `'new'`**; atualizações restritas ao anunciante/admin |
| `source` | `LeadSource` | Não | Origem do lead: `'web_portal' \| 'mobile_app' \| 'whatsapp_click' \| 'direct_phone' \| 'virtual_tour'` | Imutável |
| `notes` | `string` | Sim | Anotações internas privadas do corretor | Visível e editável apenas pelo anunciante/admin |
| `isArchived` | `boolean` | Não | Flag de arquivamento no CRM | Editável apenas pelo anunciante/admin |
| `createdAt` | `Timestamp` | Não | Momento da primeira submissão | **Imutável** (serverTimestamp) |
| `updatedAt` | `Timestamp` | Não | Momento da última alteração de estado | serverTimestamp |
| `lastContactAt` | `Timestamp` | Sim | Momento do reenvio de mensagem dentro de 24h | serverTimestamp |

---

### 2.2. Coleção `viewings/{viewingId}`

Gerencia o ciclo de vida completo de agendamento de visitas presenciais.

| Campo | Tipo | Nulo/Opcional | Descrição | Regras de Acesso |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Não | Identificador único da visita | Imutável |
| `propertyId` | `string` | Não | Identificador do imóvel alvo | **Imutável** |
| `propertyTitle` | `string` | Não | Nome do imóvel | Imutável |
| `propertyOwnerId` | `string` | Não | UID do proprietário | **Imutável** |
| `agentId` | `string` | Sim | UID do corretor responsável | Imutável |
| `agencyId` | `string` | Sim | UID da agência imobiliária | Imutável |
| `requesterId` | `string` | Não | UID do solicitante ou `guest_<timestamp>` | **Imutável** |
| `requesterName` | `string` | Não | Nome do visitante | Imutável |
| `requesterPhone` | `string` | Não | Telefone para confirmação | Imutável |
| `requesterEmail` | `string` | Sim | Email para confirmação | Imutável |
| `preferredDate` | `string` | Não | Data solicitada (Formato YYYY-MM-DD, data futura) | Editável por mútuo acordo |
| `preferredTime` | `string` | Não | Faixa horária (ex: `'10:00 - 12:00'`) | Editável |
| `alternativeDate` | `string` | Sim | Opção alternativa de data | Opcional |
| `alternativeTime` | `string` | Sim | Opção alternativa de horário | Opcional |
| `status` | `ViewingStatus` | Não | `'pending' \| 'confirmed' \| 'rejected' \| 'cancelled' \| 'completed' \| 'no_show'` | **Criação forçada a `'pending'`**. Solicitante só pode alterar para `'cancelled'`. Anunciante/Admin pode alterar para qualquer estado. |
| `cancellationReason` | `string` | Sim | Motivo de cancelamento ou rejeição | Opcional |
| `notes` | `string` | Sim | Observações adicionais | Máximo 1000 caracteres |
| `createdAt` | `Timestamp` | Não | Carimbo de envio | Imutável |
| `updatedAt` | `Timestamp` | Não | Carimbo de atualização | Atualizado em cada transição |

---

### 2.3. Coleção `property_reports/{reportId}`

Canal seguro para denúncias de anúncios falsos, preços discrepantes, imóveis inexistentes ou fraudes.

| Campo | Tipo | Nulo/Opcional | Descrição | Regras de Acesso |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Não | Identificador único da denúncia | Imutável |
| `propertyId` | `string` | Não | Identificador do imóvel denunciado | Imutável |
| `reporterId` | `string` | Não | UID do denunciante ou `'anon_' + timestamp` | Imutável |
| `reporterEmail` | `string` | Sim | Email opcional de contacto para feedback | Imutável |
| `reason` | `PropertyReportReason` | Não | `'inexistent' \| 'wrong_price' \| 'wrong_location' \| 'inappropriate' \| 'duplicate' \| 'fraud' \| 'other'` | Imutável |
| `description` | `string` | Não | Detalhes da denúncia (10 a 2000 caracteres) | Imutável |
| `status` | `string` | Não | `'open' \| 'investigating' \| 'resolved' \| 'dismissed'` | **Criação forçada a `'open'`**. Leitura e atualização exclusivas de moderadores e administradores. |
| `moderatorNotes` | `string` | Sim | Parecer da equipa de auditoria | Exclusivo moderador/admin |
| `resolvedBy` | `string` | Sim | UID do moderador que encerrou o processo | Exclusivo moderador/admin |
| `resolvedAt` | `Timestamp` | Sim | Carimbo de encerramento | Exclusivo moderador/admin |
| `createdAt` | `Timestamp` | Não | Carimbo de abertura da denúncia | Imutável |

---

### 2.4. Coleção `lead_events/{eventId}`

Fluxo contínuo de auditoria de conversão (append-only). Nunca permite atualização nem remoção por usuários comuns.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `propertyId` | `string` | Identificador do imóvel visualizado ou interagido |
| `eventType` | `LeadEventType` | `'property_view' \| 'whatsapp_click' \| 'phone_click' \| 'contact_form_started' \| 'lead_created' \| 'viewing_requested'` |
| `sessionId` | `string` | Token de sessão do visitante no navegador para evitar contagens duplicadas |
| `userId` | `string?` | UID do usuário (quando autenticado) |
| `leadId` | `string?` | ID do lead gerado (quando evento decorre de submissão de formulário) |
| `source` | `string` | Origem da ação (`'web_property_details'`, etc.) |
| `createdAt` | `Timestamp` | Carimbo de auditoria temporal (`serverTimestamp()`) |

---

## 3. Diagrama de Transição de Estados (Lifecycles)

### 3.1. Funil de Leads
```
                  [Visitante Envia Formulário]
                               │
                               ▼
                            [ new ]
                               │
                ┌──────────────┴──────────────┐
                │                             │
         (Corretor Contacta)         (Classificado como Spam)
                │                             │
                ▼                             ▼
          [ contacted ]                    [ spam ]
                │
                ▼
         [ qualified ]
                │
                ▼
      [ viewing_scheduled ]
                │
                ▼
        [ negotiating ]
         │           │
         ▼           ▼
      [ won ]     [ lost ]
```

### 3.2. Ciclo de Visitas
```
                  [Visitante Solicita Visita]
                               │
                               ▼
                           [ pending ]
                               │
                ┌──────────────┼──────────────┐
                │                             │
       (Corretor Confirma)           (Corretor Rejeita)
                │                             │
                ▼                             ▼
          [ confirmed ]                  [ rejected ]
          │           │
          │     (Visitante/Corretor Cancela)
          │           │
          │           ▼
          │     [ cancelled ]
          │
    ┌─────┴─────────────────┐
    │                       │
(Visita Realizada)     (Cliente Não Comparece)
    │                       │
    ▼                       ▼
[ completed ]          [ no_show ]
```

---

## 4. Índices Compostos Necessários (`firestore.indexes.json`)

Para suportar as consultas do corretor no painel de gestão de leads sem violar as regras de desempenho do Firestore:

```json
{
  "indexes": [
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "propertyOwnerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leads",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "agentId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "viewings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "propertyOwnerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "preferredDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "viewings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "requesterId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "property_reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "lead_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "propertyId", "order": "ASCENDING" },
        { "fieldPath": "eventType", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 5. Garantias de Idempotência e Anti-Spam

1. **Deduplicação de 24 Horas:** Quando o mesmo número de telefone ou email contacta a mesma propriedade dentro de uma janela de 24 horas, o sistema não cria um novo documento de lead no banco. Em vez disso, atualiza `lastContactAt` e anexa a mensagem recente, mantendo o histórico unificado e evitando poluição da caixa de entrada do corretor.
2. **Cooldown no Cliente:** Bloqueio de 10 segundos entre submissões consecutivas de formulário para mitigar cliques duplos acidentais ou scripts de spam.
3. **Limite de Comprimento de Caracteres:** Mensagens limitadas estritamente a 2000 caracteres no frontend e validadas nas Security Rules do Firestore.
