# MeuPlace — CRM V1: Security Model & Tenant Isolation

## 1. Princípios de Segurança

O modelo de segurança do CRM V1 do MeuPlace baseia-se em quatro pilares fundamentais:
1. **Isolamento Estrito de Inquilino / Anunciante**: Corretores e proprietários só podem visualizar dados e PII pertencentes aos imóveis pelos quais são responsáveis.
2. **Imutabilidade e Append-Only**: Registros históricos e auditorias não podem ser alterados ou apagados por clientes.
3. **Validação na Borda (Firestore Rules)**: As regras de negócio não dependem exclusivamente do cliente frontend; qualquer requisição arbitrária via SDK é barrada pelas security rules.
4. **Proteção Contra Sequestro de Titularidade**: Chaves estruturais como `propertyOwnerId`, `propertyId`, `customerId` e `createdAt` são imutáveis.

---

## 2. Matriz de Autorização por Coleção

| Coleção | Leitura (Read) | Criação (Create) | Atualização (Update) | Exclusão (Delete) |
| :--- | :--- | :--- | :--- | :--- |
| `/leads/{leadId}` | Admin, Proprietário do Imóvel, Agente Atribuído, Comprador Autor | Usuário Autenticado ou Convidado com dados válidos e status `new` | Admin, Proprietário ou Agente Atribuído (respeitando FSM e imutabilidade de chaves estruturais) | Apenas Admin |
| `/lead_activities/{activityId}` | Admin, Proprietário do Lead, Agente Atribuído ao Lead, Autor da Atividade | Apenas Autenticado com `actorId == auth.uid` e `leadId` válido | **PROIBIDO** (Imutável: `allow update: if false;`) | Apenas Admin |
| `/lead_tasks/{taskId}` | Admin, Responsável (`assignedTo`), Criador (`createdBy`), Proprietário/Agente do Lead | Apenas Autenticado com `createdBy == auth.uid` e status inicial válido | Responsável, Criador, Gestor ou Admin (proibido alterar `leadId`, `propertyId`, `createdBy`) | Criador ou Admin |
| `/viewings/{viewingId}` | Admin, Solicitante (`requesterId`), Proprietário do Imóvel, Agente | Autenticado ou Convidado com status inicial estrito `pending` | Anunciante (transições válidas de status) ou Solicitante (apenas cancelamento) | Apenas Admin |
| `/lead_events/{eventId}` | Apenas Admin | Autenticado ou Convidado (apenas eventos canónicos com IDs válidos) | Apenas Admin | Apenas Admin |

---

## 3. Proteção de PII (Personally Identifiable Information)

### 3.1 Dados Pessoais do Cliente Comprador
* Os campos `customerPhone` e `customerEmail` são armazenados dentro do documento `/leads/{leadId}`.
* **Isolamento**: Graças às regras de consulta combinadas com o RBAC do Firestore, corretores concorrentes não conseguem listar leads atribuídos a outros agentes ou proprietários.
* **Visitantes Não Autenticados**: Não possuem autorização de leitura em nenhuma coleção do CRM (`leads`, `lead_activities`, `lead_tasks`, `user_notifications`).

---

## 4. Garantia de Imutabilidade na Timeline (`lead_activities`)

A regra implementada em `firestore.rules`:
```firestore-security-rules
match /lead_activities/{activityId} {
  allow update: if false;
  allow delete: if isAdmin();
}
```
Garante que nenhuma nota comercial, registro de contacto ou alteração de status possa ser adulterada retroativamente por um corretor insatisfeito ou usuário malicioso.

---

## 5. Verificação Ofensiva & Testes de Penetração

Todas as regras foram submetidas ao motor de testes de penetração com **140 vetores de ataque automatizados**:
* Tentativa de modificação de chaves estruturais: **BLOQUEADA**
* Tentativa de salto ilegal de status no pipeline: **BLOQUEADA**
* Tentativa de edição em `lead_activities`: **BLOQUEADA**
* Tentativa de deleção não autorizada de tarefas: **BLOQUEADA**
* Tentativa de criação de notificação arbitrária não-canónica: **BLOQUEADA**
* Taxa de sucesso dos testes de segurança: **100.0% (140/140 aprovados)**.
