# MEUPLACE — AUDITORIA DE ANTI-ABUSO E RATE LIMITING
**Fase 4.5 — Security, Abuse & Production Readiness Audit**
**Data de Execução:** 2026-09-20  
**Escopo:** Cloud Firestore, Serviços de Captura de Leads, Agendamento de Visitas, Denúncias e Telemetria  
**Classificação:** Auditoria de Integridade e Mitigação de Abuso  

---

## 1. Limitação Arquitetural Fundamental do Firestore

Uma premissa crucial de segurança em sistemas Firebase Firestore:

> **As Firestore Security Rules NÃO possuem capacidade nativa de rate limiting temporal.**  
> O motor de regras avalia cada requisição individualmente em isolamento atômico. Uma regra não tem memória de estado transacional passado ("quantos documentos este usuário criou nos últimos 5 minutos?") e não pode realizar agregações temporais dinâmicas durante a avaliação de uma regra `allow create`.

Depender exclusivamente das regras de segurança para conter ataques volumétricos, spam de leads ou negação de serviço econômico (Economic Denial of Sustainability - EDoS) é um erro grave de arquitetura.

A proteção contra abusos no MeuPlace deve ser estruturada em **defesa em camadas (Defense-in-Depth)**.

---

## 2. Mapa de Vetores de Abuso da Fase 4

| Vetor de Ataque | Alvo / Coleção | Mecanismo de Exploração | Impacto |
| :--- | :--- | :--- | :--- |
| **Lead Flooding** | `leads` | Script enviando centenas de formulários de contacto por minuto para o mesmo anunciante. | Notificações massivas, spam de SMS/WhatsApp, saturação da caixa do corretor, custos desnecessários. |
| **Viewing DoS** | `viewings` | Script gerando pedidos falsos de visitas para todas as datas e horários disponíveis. | Bloqueio de horários legítimos do corretor, perda de negócios reais, desmoralização da plataforma. |
| **Harassment Reporting** | `property_reports` | Ataque coordenado enviando centenas de denúncias falsas contra um anúncio concorrente. | Sobrecarga do painel de moderação, risco de suspensão indevida de anúncios legítimos. |
| **Metric Spoofing** | `lead_events` | Bot disparando eventos falsos de cliques em WhatsApp, chamadas ou visualizações. | Métricas falsas de popularidade, distorção de relatórios e ordenação algorítmica. |

---

## 3. Arquitetura de Defesa em Camadas Implementada

Para mitigar esses vetores sem adicionar serviços externos complexos ou alterar o contrato da Fase 4, foram implementadas as seguintes camadas:

```
[Cliente Web / Script de Ataque]
   │
   ▼
[CAMADA 1: Armadilha Anti-Bot Honeypot] ────────► Se preenchido: Rejeição imediata sem escrita no Firestore
   │
   ▼
[CAMADA 2: Cooldown de Sessão Local (10s)] ─────► Se <10s: Bloqueio imediato na camada de serviço
   │
   ▼
[CAMADA 3: Deduplicação Temporal (24 Horas)] ───► Se lead recente (<24h): Reutiliza doc existente, bloqueia flood
   │
   ▼
[CAMADA 4: Sanitização e Validação de Schema] ──► Tipos estritos, limites de caracteres (2 a 2000 chars)
   │
   ▼
[CAMADA 5: Firestore Security Rules] ───────────► Validação de identidade, campos imutáveis, status restrito
```

### 3.1 Camada 1: Armadilha Anti-Bot Honeypot
Bots e crawlers preenchem todos os campos de formulário disponíveis no DOM.
- Campos ocultos adicionados: `hp_website_contact`, `hp_website_viewing`, `hp_website_report`;
- Atributos: `tabIndex={-1}`, `autoComplete="off"`, `className="hidden"`, `aria-hidden="true"`;
- Validação no `leadService.ts`, `viewingService.ts` e `reportService.ts`: se o campo contiver qualquer valor, a requisição é interceptada antes de qualquer chamada ao Firestore.

### 3.2 Camada 2: Cooldown de Sessão Local
- Intervalo mínimo estatutário de **10 segundos** entre submissões sucessivas de leads na mesma sessão do navegador (`SUBMISSION_COOLDOWN_MS = 10000`);
- Previne múltiplos cliques acidentais ou duplo envio de formulários por usuários impacientes.

### 3.3 Camada 3: Deduplicação Temporal de Leads (Janela de 24 Horas)
- Ao receber um lead, o `leadService.ts` executa consulta sanitizada:
  ```typescript
  const duplicateQuery = query(
    leadsRef,
    where('propertyId', '==', property.id),
    where('customerPhone', '==', cleanPhone),
    limit(3)
  );
  ```
- Se já existir um contacto para aquele mesmo imóvel e telefone nas últimas **24 horas**, o sistema atualiza a mensagem e carimbo temporal (`lastContactAt`) do documento existente em vez de criar múltiplos documentos duplicados;
- Isso preserva o histórico limpo e evita spam desordenado na caixa do corretor.

### 3.4 Camada 4: Cooldown de Telemetria (`leadEventService.ts`)
- Visualizações de imóveis (`property_view`) utilizam cooldown local de **30 minutos** indexado por `propertyId` no `localStorage`;
- Recarregamentos repetidos de página (F5 spam) não geram novas escritas de eventos na coleção `lead_events`, evitando inflação artificial de impressões.

### 3.5 Camada 5: Firestore Rules — Status Restrito e Imutabilidade
- `status` inicial de qualquer lead é obrigatoriamente forçado para `'new'`;
- `status` inicial de qualquer viewing é obrigatoriamente forçado para `'pending'`;
- `status` inicial de qualquer report é obrigatoriamente forçado para `'open'`;
- Nenhum usuário pode forjar status de `'won'`, `'confirmed'` ou `'resolved'` no momento da criação;
- Chaves relacionais (`propertyOwnerId`, `agentId`, `customerId`) são imutáveis após a criação.

---

## 4. Testes de Verificação de Anti-Abuso

A suíte automatizada (`npm test`) cobre especificamente os mecanismos de anti-abuso:

```text
Validação de Input de Lead (Anti-Spam & Integridade):
  ✅ PASS: Honeypot preenchido bloqueia lead de bot automatizado
  ✅ PASS: Rejeita mensagem excedendo 2000 caracteres
  ✅ PASS: Rejeita telefone inválido (< 8 dígitos)
  ✅ PASS: Rejeita nome com menos de 2 caracteres

Deduplicação e Higiene de Contactos:
  ✅ PASS: Normalização de telefone detecta números idênticos em formatos diferentes
  ✅ PASS: Lead enviado há 20h é considerado duplicado recente (< 24h)
  ✅ PASS: Lead enviado há 30h permite novo contacto (> 24h)

Agendamento de Visitas:
  ✅ PASS: Honeypot preenchido bloqueia agendamento de bot
  ✅ PASS: Rejeita agendamento com data no passado

Denúncia de Imóveis:
  ✅ PASS: Honeypot preenchido bloqueia denúncia de bot
  ✅ PASS: Rejeita denúncia excedendo 2000 caracteres

Telemetria e Eventos:
  ✅ PASS: Não contabiliza visualização repetida dentro da janela de cooldown (5 min)
  ✅ PASS: Contabiliza nova visualização após expiração do cooldown (> 30 min)
```

---

## 5. Recomendações e Roadmap de Rate Limiting Avançado (Fases Futuras)

Para produção em larga escala, as seguintes defesas adicionais devem ser consideradas:
1. **Cloud Functions com Redis / Upstash (Token Bucket):**  
   Implementar endpoints callable ou REST que validem limites por IP e por UID (ex: máximo de 10 leads por hora por IP) utilizando cache Redis em memória de baixíssima latência.
2. **Firebase App Check Enforcement:**  
   Garante que ferramentas automáticas (como cURL, Postman ou scripts em lote) não consigam atingir a API Firestore diretamente.
3. **Cloud Armor / WAF:**  
   Para as rotas servidas via Cloud Run / Express (`/api/*`, `/sitemap.xml`), utilizar regras de rate limiting no Google Cloud Armor contra ataques de volumetria L7.
