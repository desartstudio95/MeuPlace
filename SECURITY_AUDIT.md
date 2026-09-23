# MEUPLACE — RELATÓRIO DE AUDITORIA DE SEGURANÇA (SECURITY AUDIT)

**Data:** 11 de Setembro de 2026  
**Versão:** 1.0  
**Status:** Auditado — Pronto para Remediação  
**Escopo:** Frontend (React/Vite/TypeScript), Backend (Express/Socket.io), Cloud Functions (Firebase/Node.js), Firestore Security Rules, Firebase Storage Rules, Firebase Authentication & RBAC.

---

## 1. Sumário Executivo

A auditoria de segurança da plataforma **MeuPlace** identificou múltiplas vulnerabilidades de severidade Crítica e Alta na camada de autorização, regras de acesso a banco de dados e arquivos, controle de planos de assinatura, integridade de dados e geração de métricas.

O modelo anterior operava sob a premissa de confiança no frontend (*Client-Trust*), permitindo que usuários mal-intencionados escalassem privilégios para Administrador, publicassem imóveis aprovados e destacados sem pagamento, enviassem e-mails em massa através da coleção `mail`, apagassem fotos e imóveis de concorrentes, e injetassem métricas forjadas.

Abaixo está o inventário detalhado de todas as vulnerabilidades catalogadas, categorizadas por severidade, arquivo, linhas afetadas, impacto de negócio e técnica de remediação a ser aplicada.

---

## 2. Inventário de Vulnerabilidades

| ID | Vulnerabilidade | Severidade | Arquivo Principal | Linhas | Impacto |
|---|---|---|---|---|---|
| **VULN-01** | Privilege Escalation para Admin via Auto-Atribuição no Firestore | **CRITICAL** | `firestore.rules`, `src/context/AuthContext.tsx` | `firestore.rules`: 18-24, 85; `AuthContext.tsx`: 100-123 | Qualquer usuário autenticado pode atualizar seu próprio perfil para `role: 'admin'`, ganhando controle total da plataforma. |
| **VULN-02** | Credenciais Administrativas e E-mails/UIDs Hardcoded | **CRITICAL** | `firestore.rules`, `storage.rules`, `src/context/AuthContext.tsx` | `firestore.rules`: 19-20; `storage.rules`: 12-13; `AuthContext.tsx`: 100, 126, 178, 198, 266 | Falha no princípio de autorização baseada em Claims/Roles server-side. Se o e-mail for alterado ou spoofed, controle é comprometido. |
| **VULN-03** | Relay de E-mail Aberto e Abuso Não Autenticado na Coleção `/mail` | **CRITICAL** | `firestore.rules`, `src/services/emailService.ts` | `firestore.rules`: 116-121 | Atacantes não autenticados podem inserir documentos arbitrários na coleção `mail`, disparando spam em massa ou phishing via domínio da plataforma. |
| **VULN-04** | Auto-Ativação de Planos Pagos sem Transação Financeira | **CRITICAL** | `src/pages/Plans.tsx`, `firestore.rules` | `src/pages/Plans.tsx`: 103-110; `firestore.rules`: 85 | Qualquer corretor pode selecionar um plano "Unlimited" ou promocional e gravar diretamente `planId: 'unlimited'`, `planLimit: 999999` e `planExpiration` no Firestore sem pagar. |
| **VULN-05** | Exclusão Arbitrária de Imagens no Firebase Storage por Qualquer Usuário | **CRITICAL** | `storage.rules` | `storage.rules`: 31 | A regra `allow delete: if isAuthenticated()` em `/properties/{fileName}` permite que qualquer usuário autenticado exclua todas as imagens de todos os imóveis da plataforma. |
| **VULN-06** | Auto-Aprovação e Destaque Gratuito de Imóveis | **HIGH** | `src/pages/AddProperty.tsx`, `src/pages/EditProperty.tsx`, `firestore.rules` | `AddProperty.tsx`: 229-270; `EditProperty.tsx`: 78-80; `firestore.rules`: 36-40 | O cliente define `isApproved`, `isPromoted`, `boostedUntil`, `verificationStatus` diretamente na criação e edição do imóvel. |
| **VULN-07** | Injeção de Arquivos Arbitrários no Storage (Falta de Validação MIME) | **HIGH** | `storage.rules`, `src/services/propertyService.ts` | `storage.rules`: 28-32; `propertyService.ts`: 110-148 | O bucket `/properties/{fileName}` não restringe tipo MIME para `image/*`, permitindo upload de scripts maliciosos ou HTML executável até 10MB. |
| **VULN-08** | Documentos Sensíveis de KYC sem Particionamento ou Proteção no Storage | **HIGH** | `storage.rules`, `src/services/propertyService.ts`, `src/pages/AgentDashboard.tsx` | `storage.rules`: 71; `propertyService.ts`: 131; `AgentDashboard.tsx`: 255 | Documentos de identidade/alvará são salvos em `kyc_documents/` sem particionamento por UID e sem regra específica no `storage.rules` (ou expostos). |
| **VULN-09** | Mensagens e Contatos com Criação Não Autenticada e Sem Validação de Schema | **HIGH** | `firestore.rules`, `src/pages/PropertyDetails.tsx` | `firestore.rules`: 89-94 | `allow create: if true` na coleção `messages` permite spam descontrolado, spoofing de remetente e poluição de banco de dados. |
| **VULN-10** | Acesso Irrestrito a Mensagens de Chat Entre Usuários e Corretores | **HIGH** | `firestore.rules` | `firestore.rules`: 106-108 | `allow read, write: if isAuthenticated() || isAdmin()` em `/chats/{roomId}/messages/{messageId}` permite que qualquer usuário leia ou envie mensagens em salas de terceiros. |
| **VULN-11** | Criação Irrestrita de Agências Premium | **HIGH** | `firestore.rules`, `src/pages/AgentDashboard.tsx` | `firestore.rules`: 53-57 | `allow create: if isAdmin() || isAuthenticated()` permite a qualquer corretor registrar sua agência como `premium_agencies` sem validação de plano ou assinatura. |
| **VULN-12** | Avaliações Falsas e Sem Autenticação (`agent_reviews`) | **MEDIUM** | `firestore.rules`, `src/pages/AgentProfile.tsx` | `firestore.rules`: 74-78; `AgentProfile.tsx`: 101 | `allow create: if isAuthenticated() || true` permite criação de avaliações anônimas sem verificação de negócio e sem validação de nota (1 a 5). |
| **VULN-13** | Métricas e Estatísticas Falsas Geradas por `Math.random()` | **MEDIUM** | `src/pages/AgentDashboard.tsx`, `src/pages/dashboard/ResortDashboard.tsx` | `AgentDashboard.tsx`: 871, 875, 903, 907, 1655, 1667; `ResortDashboard.tsx`: 791, 803 | Exibição de métricas inventadas no painel do corretor/resort, violando o princípio de integridade e transparência com anunciantes. |
| **VULN-14** | Socket.IO Sem Autenticação e Armazenamento em Memória Volátil | **MEDIUM** | `server.ts` | `server.ts`: 12-48 | Conexões de WebSocket sem autenticação por Firebase Token JWT, salas acessíveis sem verificação de participantes e mensagens armazenadas em array volátil em memória. |
| **VULN-15** | Ausência de Cloud Functions para Transações Críticas e Custom Claims | **HIGH** | `functions/src/index.ts` | `functions/src/index.ts`: 1-84 | O backend de funções não suporta provisionamento de roles em signup, transição de estados de aprovação com trilha de auditoria, e webhooks de pagamento. |

---

## 3. Análise Detalhada por Vulnerabilidade

### VULN-01 & VULN-02: Privilege Escalation e Contas Hardcoded
- **Localização:** `firestore.rules` (linhas 18-24), `src/context/AuthContext.tsx` (linhas 99-123).
- **Problema:** A regra `isAdmin()` verifica se `users/{uid}.data.role == 'admin'` ou se o e-mail corresponde a `desartstudiopro@gmail.com`. Como a regra `users/{userId}` permite `allow update: if isOwner(userId)` sem validação de campos protegidos (`request.resource.data.diff(resource.data).affectedKeys()`), qualquer usuário pode enviar `{ role: 'admin' }` no Firestore e instantaneamente adquirir poder de administrador global.
- **Solução:**
  1. Basear `isAdmin()` exclusivamente em Custom Claims do Firebase Auth (`request.auth.token.role == 'admin'`) com fallback estrito para documento protegido não editável pelo próprio usuário.
  2. Impedir que o proprietário do documento de usuário atualize campos restritos (`role`, `isApproved`, `planId`, `planLimit`, `planExpiration`, `kycStatus`).
  3. Remover qualquer lógica no frontend que configure `role = 'admin'` com base em strings de e-mail.

### VULN-03: Abuso da Coleção `/mail` (Open Relay)
- **Localização:** `firestore.rules` (linhas 116-121).
- **Problema:** A regra permite `allow create: if true;`. Qualquer pessoa ou bot pode escrever e-mails arbitrários para qualquer destinatário no mundo, abusando da cota da plataforma e prejudicando a reputação do domínio.
- **Solução:**
  1. Permitir escrita em `/mail` apenas via Cloud Functions / Server com Firebase Admin SDK.
  2. Fechar escrita direta do cliente em `firestore.rules` (`allow create: if false`).
  3. Disponibilizar endpoints ou callable functions para formulários de contato público com sanitização e rate limiting.

### VULN-04: Auto-Atribuição de Planos Pagos
- **Localização:** `src/pages/Plans.tsx` (linhas 103-110).
- **Problema:** A função `handleSubscribe` grava os dados do plano diretamente no perfil do usuário no Firestore (`planId`, `planLimit`, `planExpiration`), sem gateway de pagamento nem autorização backend.
- **Solução:**
  1. Criação da coleção `orders` ou `payments` com status inicial `pending`.
  2. A ativação do plano deve ser executada exclusivamente no servidor/Cloud Functions mediante confirmação de pagamento (M-Pesa, E-Mola, Cartão, ou aprovação manual de comprovante pelo Admin).
  3. Proteger os campos de plano no Firestore Rules para que apenas `isAdmin()` possa modificá-los.

### VULN-05: Exclusão de Mídias de Terceiros no Storage
- **Localização:** `storage.rules` (linhas 28-32).
- **Problema:** `match /properties/{fileName} { allow delete: if isAuthenticated(); }`.
- **Solução:**
  1. Estruturar os caminhos de upload no Storage por ID de usuário: `/properties/{userId}/{propertyId}/{fileName}`.
  2. Permitir exclusão apenas se `request.auth.uid == userId` ou `isAdmin()`.

### VULN-06 & VULN-07: Publicação de Imóveis e Integridade do Storage
- **Localização:** `firestore.rules` (linhas 36-40), `src/pages/AddProperty.tsx` (linhas 229-270).
- **Problema:** `isApproved` é determinado no cliente e gravado no Firestore. Arquivos de propriedades aceitam qualquer extensão sem validar se são imagens.
- **Solução:**
  1. No `firestore.rules`, exigir que no `create` de propriedades:
     - `request.resource.data.isApproved == false`
     - `request.resource.data.status in ['Pendente', 'draft', 'pending_approval']`
     - `request.resource.data.isPromoted == false`
     - `request.resource.data.agentId == request.auth.uid`
  2. No `update`, proibir que não-admins modifiquem `isApproved`, `isPromoted`, `boostedUntil`, `views`, `impressions`, `whatsappClicks`.
  3. No `storage.rules`, exigir `isImage()` e tamanho máximo de 10MB.

### VULN-08: Exposição e Desorganização de Documentos KYC
- **Localização:** `storage.rules`, `src/services/propertyService.ts` (linha 131).
- **Problema:** Os uploads de KYC são colocados em pastas genéricas sem regras específicas, expondo documentos sensíveis (Alvará, NUIT, BI).
- **Solução:**
  1. Caminho restrito: `/kyc_documents/{userId}/{fileName}`.
  2. `allow read: if request.auth.uid == userId || isAdmin();`
  3. `allow write: if request.auth.uid == userId && isLessThan10MB();`
  4. `allow delete: if isAdmin();`

### VULN-09 & VULN-10: Mensagens e Salas de Chat
- **Localização:** `firestore.rules` (linhas 89-108).
- **Problema:** `/chats/{roomId}/messages/{messageId}` permite leitura e escrita para qualquer usuário autenticado. `/messages` permite criação sem auth.
- **Solução:**
  1. Em `chatRooms/{roomId}`, validar que apenas participantes (`userId` ou `agentId` ou `participants`) possam ler ou enviar mensagens na subcoleção `messages`.
  2. Validar que `request.resource.data.senderId == request.auth.uid`.
  3. Mensagens de contato público fora de chat devem ser sanitizadas e validadas por endpoint/função protegida contra spam com rate limiting.

### VULN-13: Remoção de Métricas Falsas (`Math.random()`)
- **Localização:** `src/pages/AgentDashboard.tsx` e `src/pages/dashboard/ResortDashboard.tsx`.
- **Problema:** Contadores de visualizações, cliques no WhatsApp e impressões utilizam `Math.random()`.
- **Solução:**
  1. Substituir por contadores atômicos ou telemetria real baseada em eventos registrados no Firestore (`property.views`, `property.impressions`, `property.whatsappClicks`), iniciando em 0.
  2. Proteger a integridade das métricas contra manipulação direta pelo corretor.

---

## 4. Plano de Remediação em 6 Etapas

1. **Etapa 2 — Hardening de Regras e RBAC:**
   - Reescrever `firestore.rules` e `storage.rules` com Zero-Trust, validação de schema, RBAC por claims e bloqueio de privilege escalation.
   - Refatorar `AuthContext.tsx` e `authService.ts` para eliminar credenciais hardcoded e proteger campos sensíveis de perfil.
2. **Etapa 3 — Blindagem de Imóveis, Chats, KYC e Pagamentos:**
   - Corrigir fluxo de criação/edição de imóveis em `AddProperty.tsx` e `EditProperty.tsx` para respeitar status pendente e proibir auto-aprovação.
   - Proteger KYC e upload de documentos.
   - Implementar modelo seguro de pedidos de planos e promoções com status `pending` e confirmação administrativa/servidor.
   - Corrigir `Chat.tsx` e `AgentDashboard.tsx` para isolamento de salas.
3. **Etapa 4 — Blindagem de Cloud Functions e Servidor:**
   - Expandir `functions/src/index.ts` com funções seguras para aprovação de imóveis, aprovação de KYC, concessão de roles via custom claims e ativação de planos.
   - Blindar `server.ts` adicionando rate limiting, validações de entrada e autenticação.
4. **Etapa 5 — Logs de Auditoria e Limpeza de Métricas Falsas:**
   - Substituir `Math.random()` por métricas autênticas persistidas.
   - Adicionar trilha de auditoria para ações de moderadores e administradores.
5. **Etapa 6 & 7 — Testes e Validação:**
   - Criar suíte de testes de regras de segurança e autenticação.
   - Executar compilação, linting e testes.
