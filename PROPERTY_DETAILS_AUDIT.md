# AUDITORIA TÉCNICA E DE SEGURANÇA — PROPERTY DETAILS & LEAD CAPTURE V2

**Data:** 19 de Setembro de 2026  
**Projeto:** MeuPlace — Marketplace Imobiliário de Moçambique  
**Fase:** Fase 0 (Pré-Implementação da Fase 4)  
**Objetivo:** Mapeamento minucioso do fluxo de detalhes do imóvel, captura de leads, segurança de dados e modelos de acesso antes da execução da Fase 4.

---

## 1. Estado Atual dos Componentes e Fluxos

### 1.1. `src/pages/PropertyDetails.tsx`
* **Carregamento e Autorização de Exibição:**
  * O imóvel é lido via `getDoc(doc(db, 'properties', id))`.
  * Existe verificação no cliente de `isApproved`, mas ela ocorre pós-carregamento. Se a regra do Firestore permitir a leitura de um documento não aprovado, ele é transferido pela rede.
  * O estado de favoritos e comparação já foi unificado com `FavoriteContext` (Fase 3), mas o botão de comparação ainda não estava presente no cabeçalho ou barra de ações da página de detalhes.
* **Galeria de Imagens:**
  * Implementação simples com `currentImageIndex` e modal de zoom.
  * Falta contador explícito de imagens (`1 / 8`), grade/tira de miniaturas interativas na visualização principal, lazy loading refinado, e fallback resiliente em caso de erro 404 em URLs de fotos antigas.
* **Informações e Atributos Físicos:**
  * Apresenta quartos, banheiros e $m^2$.
  * Não apresenta de forma estruturada: cidade, distrito, bairro, estacionamento/garagem, mobilado (`furnished`), piscina (`pool`), ou características condicionais sem poluição visual.
* **Descrição:**
  * Exibe o texto completo diretamente. Em descrições longas em smartphones, empurra o contato e informações cruciais para fora da primeira dobra da tela.
* **Verificação do Imóvel:**
  * O selo de verificação de propriedade (`verificationStatus === 'approved'`) não é exibido com distinção; havia apenas um selo genérico de agente.
* **Canais de Contato:**
  * **WhatsApp:** Abre URL `wa.me` sem registrar evento estruturado de intenção (`whatsapp_click`).
  * **Telefone:** Revela o número via toggle booleano no cliente, sem telemetria (`phone_click`).
  * **Mensagem:** Salva na coleção `messages`, sem modelagem de `leads`, sem vínculo a funil comercial, e sem proteção contra spoofing do proprietário/agente destinatário.
* **Agendamento de Visitas (`viewings`):**
  * Ausente.
* **Denúncia de Imóvel (`property_reports`):**
  * Ausente.

---

## 2. Auditoria de Segurança e Vulnerabilidades Identificadas

| Identificador | Categoria | Descrição da Vulnerabilidade / Risco | Severidade | Ação Obrigatória na Fase 4 |
| :--- | :--- | :--- | :--- | :--- |
| **AUDIT-LEAD-001** | *Lead Spoofing* | O cliente poderia forjar `propertyOwnerId`, `agentId` ou `agencyId` ao criar leads ou mensagens, direcionando contatos para contas não autorizadas. | **CRÍTICA** | Regras do Firestore e serviço devem exigir que o lead aponte para uma propriedade aprovada real e herde os IDs imutáveis dela. |
| **AUDIT-LEAD-002** | *Status Manipulation* | Usuário comum poderia tentar criar ou atualizar lead com `status: 'won'`, `'qualified'` ou `'negotiating'`. | **ALTA** | Bloquear no `allow create` qualquer status que não seja `'new'`, e no `allow update` permitir alteração de status exclusivamente ao proprietário do imóvel, agente responsável ou admin. |
| **AUDIT-LEAD-003** | *Missing Collections in Rules* | As coleções `leads`, `lead_events`, `viewings` e `property_reports` ainda não possuem regras explícitas em `firestore.rules`. Estavam caindo no default deny ou permitindo comportamentos imprevisíveis. | **CRÍTICA** | Criar blocos de segurança declarativos com `diff().affectedKeys()` para `leads`, `lead_events`, `viewings` e `property_reports`. |
| **AUDIT-LEAD-004** | *Spam & Flooding* | Criação ilimitada de leads idênticos em sequência (bot flooding ou cliques repetidos de formulário). | **ALTA** | Implementar idempotência, cooldown de envio no cliente, sanitização de tamanho de texto e deduplicação inteligente no serviço de leads. |
| **AUDIT-LEAD-005** | *Fake Metric Tampering* | Risco de uso de `increment(1)` no frontend para inflar visualizações de imóveis ou uso de `Math.random()`. | **ALTA** | Proibir estritamente mutações diretas em `views` do documento de propriedade a partir do cliente. Eventos de visualização devem ser despachados para `lead_events` com deduplicação por sessão/cooldown. |
| **AUDIT-LEAD-006** | *Viewing State Escalation* | Solicitante de visita poderia tentar auto-confirmar ou alterar data sem consentimento do proprietário. | **ALTA** | Solicitante só pode criar visita com status `'pending'`. Transições para `'confirmed'`, `'rejected'` ou `'completed'` são restritas ao proprietário/agente ou admin. |
| **AUDIT-LEAD-007** | *Report Fraud* | Usuário comum poderia tentar moderar ou descartar denúncias de terceiros. | **MÉDIA** | Denúncias (`property_reports`) podem ser criadas por usuários autenticados com status `'open'`, mas a leitura e atualização de status são exclusivas de moderadores e administradores. |

---

## 3. Modelo de Dados Alvo (Leads, Viewings, Reports, Events)

### 3.1. Coleção `leads/{leadId}`
```typescript
interface Lead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyOwnerId: string;
  agentId?: string;
  agencyId?: string;
  customerId?: string; // Opcional se for visitante anônimo
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  message: string;
  contactPreference: 'whatsapp' | 'phone' | 'email';
  source: 'contact_form' | 'viewing_request' | 'whatsapp' | 'phone';
  status: 'new' | 'contacted' | 'qualified' | 'viewing' | 'negotiating' | 'won' | 'lost';
  createdAt: any; // FieldValue.serverTimestamp()
  updatedAt: any;
  lastContactAt?: any;
}
```

### 3.2. Coleção `lead_events/{eventId}`
```typescript
interface LeadEvent {
  id: string;
  propertyId: string;
  leadId?: string;
  eventType: 'property_view' | 'whatsapp_click' | 'phone_click' | 'contact_form_started' | 'lead_created' | 'viewing_requested';
  userId?: string;
  sessionId: string;
  source: string;
  createdAt: any;
}
```

### 3.3. Coleção `viewings/{viewingId}`
```typescript
interface Viewing {
  id: string;
  propertyId: string;
  propertyTitle: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  propertyOwnerId: string;
  agentId?: string;
  agencyId?: string;
  preferredDate: string;
  preferredTime: string;
  alternativeDate?: string;
  alternativeTime?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  createdAt: any;
  updatedAt: any;
}
```

### 3.4. Coleção `property_reports/{reportId}`
```typescript
interface PropertyReport {
  id: string;
  propertyId: string;
  reporterId: string;
  reason: 'inexistent' | 'wrong_price' | 'wrong_location' | 'inappropriate' | 'duplicate' | 'fraud' | 'other';
  description: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: any;
}
```

---

## 4. Plano de Implementação da Fase 4

1. **Definição de Tipos:** Atualizar `src/types/index.ts` com as interfaces de Lead, Viewing, Report, LeadEvent e dados sanitizados.
2. **Serviços Especializados:**
   * `src/services/leadService.ts`: Criação e deduplicação de leads com verificação de integridade do imóvel e anti-spam.
   * `src/services/viewingService.ts`: Agendamento seguro de visitas.
   * `src/services/reportService.ts`: Registro de denúncias contra fraudes.
   * `src/services/leadEventService.ts`: Despacho de telemetria sem duplicação e sem mutação indevida de contadores no cliente.
3. **Reformulação de `PropertyDetails.tsx`:**
   * Galeria moderna e acessível com miniaturas, contador e lightbox responsivo.
   * Atributos completos (bairro, cidade, quartos, banheiros, vagas, condomínio, status de verificação documental).
   * UX expansível ("Ver mais") na descrição.
   * Área "Publicado por" com distinção clara entre corretor e agência parceira.
   * Modais integrados: Contactar Agente, Agendar Visita, Denunciar Imóvel.
   * Barra de ações sticky em mobile (WhatsApp, Ligar, Contactar) sem sobrepor o conteúdo.
   * SEO estruturado com OpenGraph e JSON-LD (`RealEstateListing`).
4. **Endurecimento das Regras Firestore (`firestore.rules`):**
   * Adicionar blocos de controle para `leads`, `lead_events`, `viewings` e `property_reports` com `affectedKeys()`.
5. **Suítes de Teste:**
   * Testes unitários para serviços de leads e deduplicação (`tests/unit/leadService.test.ts`).
   * Testes de penetração e autorização para Phase 4 integrados à suíte `npm run test:security`.
6. **Relatórios Finais:**
   * `MARKETPLACE_CORE_PHASE_4_REPORT.md`
   * `LEAD_DATA_MODEL.md`
   * `LEAD_SECURITY_AUDIT.md`
