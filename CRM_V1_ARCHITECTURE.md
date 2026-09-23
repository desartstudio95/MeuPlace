# MeuPlace — CRM V1: Architectural Blueprint

## 1. Visão Arquitetural

A arquitetura do CRM V1 do MeuPlace organiza as oportunidades comerciais em uma estrutura orientada a eventos, com separação de responsabilidades entre telemetria de navegação, auditoria comercial e agendamentos de visitas.

```
                      +-----------------------------+
                      |         PROPERTY            |
                      | (Imóvel & Titularidade Real)|
                      +--------------+--------------+
                                     |
                                     | gera
                                     v
                      +-----------------------------+
                      |           LEAD              |
                      |   (Oportunidade Comercial)  |
                      +--------------+--------------+
                                     |
          +--------------------------+--------------------------+
          |                          |                          |
          v                          v                          v
+-------------------+      +-------------------+      +-------------------+
|  LEAD_ACTIVITIES  |      |    LEAD_TASKS     |      |     VIEWINGS      |
|  (Timeline CRM    |      | (Tarefas/Follow-  |      |   (Agendamentos   |
|   Append-Only)    |      |  ups Operacionais)|      |    de Visita)     |
+-------------------+      +-------------------+      +-------------------+
          |                          |                          |
          +--------------------------+--------------------------+
                                     |
                                     v
                      +-----------------------------+
                      |     USER_NOTIFICATIONS      |
                      |   (Alertas In-App Reais)    |
                      +-----------------------------+
```

---

## 2. Separação Estrita: Telemetria vs Atividades Comerciais

Para evitar poluição da timeline de vendas com dados analíticos brutos e proteger a integridade das métricas do portal, adotou-se uma separação física e lógica:

| Característica | `lead_events` (Telemetria) | `lead_activities` (Timeline CRM) |
| :--- | :--- | :--- |
| **Objetivo** | Analytics de funil, métricas de tráfego, cliques e conversão | Histórico comercial, auditoria de relacionamento, notas internas |
| **Geração** | Automática por interações do cliente na interface web | Disparada por ações comerciais de agentes ou marcos de negócio |
| **Exemplos** | `property_view`, `whatsapp_click`, `phone_click` | `lead_contacted`, `note_added`, `task_completed`, `reassigned` |
| **Acesso** | Restrito a administradores e agregações estatísticas | Disponível para o agente responsável e proprietário do imóvel |
| **Mutabilidade** | Append-only cliente anónimo/autenticado | Append-only autenticado com autorização RBAC estrita |

---

## 3. Máquinas de Estados Finitos (FSM)

### 3.1 Pipeline de Leads (`LeadStatus`)
O fluxo comercial segue rigorosamente o grafo de transições unidirecional protegido na camada de dados (`firestore.rules` e `src/types/index.ts`):

```
       [ new ] 
        /   \
       v     v
 [ contacted ] [ archived ]
     /    \
    v      v
[ qualified ] [ lost ]
    |
    v
[ negotiating ]
    /    \
   v      v
[ won ] [ lost ]
   |
   v
[ archived ]
```

* **Regras de Integridade**:
  * É estritamente proibido saltar diretamente de `new` para `won` ou `negotiating`.
  * Um lead `won` (convertido) não pode ser revertido para `new` ou `lost`.
  * Leads perdidos (`lost`) podem ser reativados exclusivamente para o estado `contacted` para renegociação.

### 3.2 Visitas (`ViewingStatus`)
* Estados: `pending` $\to$ `confirmed` | `rejected` | `cancelled` $\to$ `completed` | `no_show`.
* Validações de integridade garantem que apenas visitas confirmadas podem ser marcadas como concluídas ou ausência (`no_show`).

---

## 4. Arquitetura de Atribuição (Assignment Model)

A titularidade comercial do lead opera com base em dois níveis de custódia:
1. **Titularidade Primária (Proprietário)**: `propertyOwnerId` — derivado de forma imutável a partir do cadastro do imóvel. Garante que o dono do patrimônio nunca perde visibilidade sobre os potenciais compradores.
2. **Custódia Operacional (Agente)**: `agentId` — define o profissional responsável pelo atendimento, tarefas e negociação.

### Fluxo de Reatribuição
Quando um lead é transferido para outro corretor:
1. O campo `agentId` é atualizado no documento `/leads/{leadId}`.
2. É criado um registro imutável em `/lead_activities` com tipo `reassigned`, arquivando o histórico de quem transferiu e quem recebeu.
3. É despachada uma notificação canónica `/user_notifications` do tipo `lead_assigned` para a caixa de entrada do novo corretor.

---

## 5. Arquitetura de Tarefas e Lembretes (Follow-ups)

A coleção `/lead_tasks` fornece a base para o gerenciamento de tarefas comerciais:
* **Vínculo Fixo**: As chaves `leadId`, `propertyId`, `createdBy` e `createdAt` são **imutáveis** após a criação, bloqueadas em `firestore.rules`.
* **Atualizações Operacionais**: O responsável pode alterar título, descrição, prioridade, data limite (`dueAt`) e marcar conclusão (`status = completed`).
* **Sincronização com a Timeline**: Conclusão ou criação de tarefas gera automaticamente um registro correspondente na timeline de atividades do lead.
