# MEUPLACE — MATRIZ DE AUTORIZAÇÃO E SEGURANÇA (RBAC)
**Fase 4.5 — Security, Abuse & Production Readiness Audit**
**Data de Execução:** 2026-09-20  
**Escopo:** Matriz de Controle de Acesso Baseado em Papéis (RBAC) e Máquinas de Estado  
**Classificação:** Referência Normativa de Segurança  

---

## 1. Papéis de Usuário (Roles)

| Papel | Código | Descrição |
| :--- | :--- | :--- |
| **Anônimo** | `anonymous` | Visitante sem autenticação. Navega por imóveis públicos e envia formulários abertos. |
| **Comprador / Inquilino** | `user` | Usuário autenticado básico. Salva favoritos, envia leads, agenda visitas e avalia corretores. |
| **Proprietário Particular** | `agent` (plano básico) | Usuário com permissão para anunciar imóveis próprios. |
| **Corretor Profissional** | `agent` (plano pro/unlimited) | Profissional imobiliário com volume ampliado e selo de verificação. |
| **Admin de Imobiliária** | `agencyAdmin` | Gestor de agência imobiliária cadastrada no MeuPlace. |
| **Moderador** | `moderator` | Equipe de compliance. Analisa denúncias de imóveis e aprova anúncios pendentes. |
| **Administrador** | `admin` | Administrador geral da plataforma MeuPlace. |
| **Super Administrador** | `superAdmin` | Acesso irrevogável e gestão de permissões administrativas. |

---

## 2. Matriz de Operações por Recurso (CRUD)

Legenda:  
- **ALLOW**: Permitido sem restrições de contexto.  
- **OWN**: Permitido apenas se o recurso pertencer ao usuário autenticado (`userId == auth.uid` ou `agentId == auth.uid`).  
- **DENY**: Estritamente bloqueado.  
- **COND**: Permitido sob condições estritas de schema ou status inicial.  

| Recurso / Coleção | Anônimo | Usuário Comum (`user`) | Anunciante (`agent`) | Moderador (`moderator`) | Administrador (`admin`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Imóveis Aprovados (`properties`)** | Read | Read | Read | Read | Read / Write |
| **Imóveis Pendentes (`properties`)** | DENY | DENY | OWN | Read | Read / Write |
| **Criar Imóvel (`properties`)** | DENY | DENY | COND | COND | ALLOW |
| **Editar Imóvel (`properties`)** | DENY | DENY | OWN (campos não-críticos) | DENY | ALLOW |
| **Aprovar Imóvel (`properties`)** | DENY | DENY | DENY | ALLOW (via backend) | ALLOW |
| **Perfis de Usuários (`users`)** | DENY | OWN (leitura/edição) | OWN (leitura/edição) | Read | Read / Write |
| **Salas de Chat (`chat_rooms`)** | DENY | OWN (participante) | OWN (participante) | DENY | ALLOW |
| **Pedidos / Pagamentos (`orders`)** | DENY | OWN (leitura / criar pending) | OWN (leitura / criar pending) | DENY | ALLOW |
| **Avaliações (`agent_reviews`)** | Read | COND (criar 1..5 / OWN editar) | Read | Read | Read / Write |
| **Favoritos (`favorites`)** | DENY | OWN | OWN | DENY | ALLOW |
| **Leads — Criar (`leads`)** | COND (`new`) | COND (`new`) | COND (`new`) | DENY | ALLOW |
| **Leads — Ler (`leads`)** | DENY | OWN (`customerId`) | OWN (`agentId` / `propertyOwnerId`) | DENY | ALLOW |
| **Leads — Gerenciar Status (`leads`)**| DENY | DENY | OWN (`agentId` / `propertyOwnerId`) | DENY | ALLOW |
| **Visitas — Solicitar (`viewings`)** | COND (`pending`)| COND (`pending`) | COND (`pending`) | DENY | ALLOW |
| **Visitas — Cancelar (`viewings`)** | DENY | OWN (`requesterId`) | OWN (`requesterId`) | DENY | ALLOW |
| **Visitas — Confirmar/Rejeitar** | DENY | DENY | OWN (`propertyOwnerId` / `agentId`) | DENY | ALLOW |
| **Denúncias — Criar (`property_reports`)** | COND (`open`)| COND (`open`) | COND (`open`) | COND (`open`) | ALLOW |
| **Denúncias — Ler / Moderar** | DENY | DENY | DENY | ALLOW | ALLOW |
| **Telemetria (`lead_events`)** | COND (write) | COND (write) | COND (write) | DENY | Read / Write |
| **Notificações (`user_notifications`)** | DENY | OWN (`userId`) | OWN (`userId`) | OWN (`userId`) | ALLOW |

---

## 3. Matriz de Imutabilidade de Campos

Uma vez gravados no banco de dados, os seguintes campos críticos são **estritamente protegidos contra mutações**:

| Coleção | Campos Estritamente Imutáveis | Motivo de Segurança |
| :--- | :--- | :--- |
| `properties` | `id`, `ownerId`, `agentId`, `createdAt`, `isApproved` (apenas admin/mod) | Previne roubo de titularidade de anúncio e auto-aprovação. |
| `leads` | `id`, `propertyId`, `propertyOwnerId`, `agentId`, `customerId`, `createdAt` | Previne transferência maliciosa de leads entre corretores concorrentes. |
| `viewings` | `id`, `propertyId`, `propertyOwnerId`, `agentId`, `requesterId`, `createdAt` | Impede desvio de agendamentos para outros corretores. |
| `property_reports` | `id`, `propertyId`, `reporterId`, `reason`, `description`, `createdAt` | Preserva a integridade probatória de denúncias submetidas. |
| `orders` | `id`, `userId`, `amount`, `currency`, `planId`, `status` (apenas backend) | Previne ataque de manipulação de preço e auto-aprovação de pagamento. |
| `lead_events` | Todos os campos (Coleção é 100% Append-Only) | Garante auditabilidade inalterável de telemetria e métricas de conversão. |

---

## 4. Máquinas de Estados e Transições Autorizadas

### 4.1 Ciclo de Vida do Imóvel (`properties`)
```
[Rascunho / Draft]
       │
       ▼ (Agente submete)
[Pendente de Aprovação]
       │
       ├─────────────────────────┐
       ▼ (Moderador / Admin)     ▼ (Moderador / Admin)
[Disponível / Aprovado]       [Rejeitado / Com pendências]
       │
       ├─────────────────────────┐
       ▼ (Agente fecha negócio)  ▼ (Agente fecha negócio)
    [Vendido]                 [Arrendado]
```

### 4.2 Ciclo de Vida do Lead (`leads`)
```
[Novo / 'new'] (Obrigatório na criação)
       │
       ▼ (Agente inicia contacto)
[Contactado / 'contacted']
       │
       ▼ (Agente valida perfil financeiro)
[Qualificado / 'qualified']
       │
       ▼ (Proposta em andamento)
[Negociação / 'negotiating']
       │
       ├─────────────────────────┬─────────────────────────┐
       ▼                         ▼                         ▼
[Ganho / 'won']           [Perdido / 'lost']        [Spam / 'spam']
```

### 4.3 Ciclo de Vida do Agendamento de Visita (`viewings`)
```
[Pendente / 'pending'] (Obrigatório na solicitação)
       │
       ├─────────────────────────┬─────────────────────────┐
       ▼ (Agente aprova data)    ▼ (Agente rejeita)        ▼ (Cliente cancela antes)
[Confirmada / 'confirmed']  [Rejeitada / 'rejected']  [Cancelada / 'cancelled']
       │
       ▼ (Visita realizada)
[Concluída / 'completed']
```

### 4.4 Ciclo de Vida da Denúncia (`property_reports`)
```
[Aberta / 'open'] (Obrigatório no envio)
       │
       ▼ (Moderador assume apuração)
[Em Investigação / 'investigating']
       │
       ├─────────────────────────┐
       ▼                         ▼
[Resolvida / 'resolved']   [Descartada / 'dismissed']
(Ex: Anúncio pausado/removido) (Ex: Denúncia infundada)
```
