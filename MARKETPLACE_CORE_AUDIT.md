# AUDITORIA PRÉ-DESENVOLVIMENTO — MEUPLACE MARKETPLACE CORE V2

**Data da Auditoria:** 11 de Setembro de 2026  
**Sistema:** MeuPlace — Portal Imobiliário de Moçambique  
**Status dos Testes de Segurança (V1):** 89/89 PASS (0 vulnerabilidades ativas)  
**Objetivo:** Mapeamento minucioso do estado atual da aplicação, componentes reutilizáveis, lacunas e plano cirúrgico de implementação do Marketplace Core V2 sem introduzir regressões funcionais ou de segurança.

---

## 1. SITUAÇÃO ATUAL DO PROJETO

O MeuPlace possui uma fundação sólida em **React 18 + TypeScript + Vite + Tailwind CSS + Firebase (Auth, Firestore, Storage, Functions)** e um backend Node/Express (`server.ts`) com suporte a WebSockets para chat em tempo real e cabeçalhos de segurança rigorosos.

A fase anterior (**Security Hardening V1 & Penetration Testing V1**) blindou com sucesso as Security Rules do Firestore e Storage, corrigindo 6 vulnerabilidades críticas (privilege escalation, falsificação de autoria, mutação indevida de status de aprovação/verificação, injeção de métricas falsas e sobrescrita em storage).

Contudo, diversas partes do **Marketplace Core** ainda operavam como protótipos visuais, com dados simulados (`setTimeout`, `Math.random()`), queries sem sincronização com os filtros de segurança das regras (`isApproved == true`), e lacunas no funil de conversão e geração de leads reais.

---

## 2. ARQUITETURA EXISTENTE & COMPONENTES REUTILIZÁVEIS

### 2.1 Páginas e Estrutura de Rotas (`src/App.tsx`)
*   `/` (`Home.tsx`): Página inicial com Hero, busca rápida, imóveis em destaque, resorts e call-to-action.
*   `/properties` (`Properties.tsx`): Listagem geral de imóveis com barra lateral de filtros básicos e grid de cards.
*   `/properties/:id` (`PropertyDetails.tsx`): Página detalhada do imóvel com galeria, características, perfil do corretor, agendamento de visita e modal de mensagem.
*   `/properties/compare` (`Compare.tsx`): Comparador lado a lado com `CompareContext.tsx`.
*   `/favorites` (`Favorites.tsx`): Página de favoritos.
*   `/map` (`MapSearch.tsx`): Pesquisa geoespacial interativa com Leaflet / OpenStreetMap.
*   `/agencies` (`Agencies.tsx`): Diretório de agências imobiliárias.
*   `/agency/:id` (`AgencyProfile.tsx`): Perfil individual da agência e seus corretores/imóveis.
*   `/agent/:name` (`AgentProfile.tsx`): Perfil público do corretor com avaliações e listagem de seus imóveis.
*   `/dashboard` (`AgentDashboard.tsx` / `UserDashboard.tsx`): Painéis específicos para corretores e utilizadores comuns.
*   `/admin/*`: Painel administrativo completo (`Dashboard`, `Properties`, `Users`, `Agencies`, `Analytics`, `Reports`, `Orders`, etc.).

### 2.2 Componentes UI Reutilizáveis
*   `src/components/PropertyCard.tsx`: Card de apresentação de imóvel. *Ponto de melhoria:* Adicionar badges de verificação oficial, dados completos (quartos, banheiros, vagas, área, moeda MZN/USD), e botão de favoritar reativo direto no card.
*   `src/components/PropertyMap.tsx`: Visualizador de mapa Leaflet para coordenadas específicas.
*   `src/components/Chat.tsx`: Modal e janela de mensagens com suporte híbrido (Firestore + Socket.io).
*   `src/components/SEO.tsx`: Gerenciador de OpenGraph e metadados dinâmicos com `react-helmet-async`.
*   `src/components/ui/*`: Biblioteca Radix UI / Tailwind estilizada (Dialog, Button, Input, DropdownMenu, Skeleton, Select, etc.).

### 2.3 Serviços e Contextos Existentes
*   `src/services/propertyService.ts`: Funções de CRUD de propriedades, uploads e contadores.
*   `src/context/AuthContext.tsx`: Gestão de sessão, perfis no Firestore (`/users/{uid}`), claims administrativos e favoritos locais/remotos.
*   `src/context/NotificationContext.tsx`: Notificações in-app e push context.
*   `src/context/CompareContext.tsx`: Gerenciamento de estado de comparação salvo em `sessionStorage`.

---

## 3. PROBLEMAS ENCONTRADOS & MOCKS DETECTADOS

Durante a inspeção minuciosa dos arquivos-fonte, foram identificadas as seguintes inconformidades com as diretrizes do Marketplace Core V2:

1.  **Regressão Silenciosa de Query Firestore (Violação do Filtro `isApproved`):**
    *   Arquivos: `src/pages/Properties.tsx`, `src/pages/Home.tsx`, `src/pages/MapSearch.tsx`, `src/pages/CategoryPage.tsx`, `src/pages/AgentProfile.tsx`, `src/services/propertyService.ts`.
    *   *Causa:* As queries públicas executavam `query(collection(db, 'properties'))` sem `where('isApproved', '==', true)`. Como as Security Rules de Firestore não atuam como filtros automáticos e rejeitam a leitura caso a consulta retorne documentos aos quais o usuário não tem permissão de leitura (`isApproved == false`), visitantes anônimos e usuários normais recebiam erro `permission-denied` ou visualizavam listas vazias.
2.  **Métricas Falsas & Valores Simulados com `Math.random()`:**
    *   `src/pages/AgentDashboard.tsx` (linhas 1712-1713): `{p.impressions || Math.floor(Math.random() * 500) + 100}` e `{p.whatsappClicks || Math.floor(Math.random() * 50) + 10}`.
    *   `src/pages/dashboard/ResortDashboard.tsx` (linhas 848-849): Simulação idêntica de métricas.
    *   *Regra Violada:* "NÃO criar dados fictícios para simular funcionalidades reais." As métricas devem ser 0 ou baseadas em eventos reais de interação (`lead_events`).
3.  **Favoritos Simulados no Painel do Usuário:**
    *   `src/pages/dashboard/UserDashboard.tsx` (linhas 20-28): Uso de `setTimeout` com lista vazia simulada em vez de carregar os favoritos reais persistidos no perfil do usuário ou coleção `favorites`.
4.  **Falha de Incremento de Views no Client:**
    *   `src/pages/PropertyDetails.tsx` (linhas 64-69): Chamada direta de `updateDoc(docRef, { views: increment(1) })` a partir do cliente. O Security Hardening V1 corretamente colocou `views` na lista de campos protegidos contra edição pelo cliente em `properties`. Essa escrita falhava silenciosamente com erro de permissão no console. O registro de visualização deve ser feito via coleção de eventos ou endpoint de telemetria / backend.
5.  **Falta de Filtros Avançados do Mercado Moçambicano:**
    *   Faltavam filtros como: Províncias (Maputo Cidade, Maputo Província, Matola, Gaza, Inhambane, Sofala, Nampula, Cabo Delgado, Tete, Zambézia, Niassa, Manica), Moeda (MZN e USD), Vagas de Garagem, Imóveis Verificados, Tipo de Negócio (Venda / Arrendamento) e ordenação dinâmica (Mais recentes, Menor preço, Maior preço, Relevância).
6.  **Ausência de Coleta e Gestão Estruturada de Leads:**
    *   Cliques de WhatsApp, solicitações de agendamento de visita e mensagens não eram estruturados em uma coleção dedicada de `leads` e `lead_events` com status (`novo`, `em_contacto`, `visita_agendada`, `concluido`, `perdido`).
7.  **Buscas Salvas (`saved_searches`):**
    *   Não havia funcionalidade para o utilizador autenticado guardar uma combinação de filtros e receber alerta ou acessar com um clique.

---

## 4. COLEÇÕES FIRESTORE ENVOLVIDAS & REGRAS DE ACESSO

Para garantir que tudo funcione com dados reais e sem violar as regras de segurança existentes:

| Coleção | Propósito | Regra de Acesso Existente / Ajuste |
| :--- | :--- | :--- |
| `properties` | Catálogo de imóveis | Leitura pública condicionada a `isApproved == true`. Criação segura por agentes aprovados com `status: Pendente` e `isApproved: false`. Edição apenas pelo dono sem alterar campos restritos. |
| `users` | Perfis de usuários e corretores | Usuário atualiza seu próprio documento, campos administrativos protegidos. Campo `favorites` (array de IDs) acessível para o usuário salvar seus imóveis favoritos. |
| `leads` | Oportunidades geradas por anúncios | Criação pública/autenticada por interessados no imóvel. Leitura/atualização restrita ao corretor dono do imóvel (`agentId == auth.uid`) ou admin. |
| `lead_events` | Telemetria de cliques (WhatsApp, telefone, cópia de link, visualização) | Registro de eventos reais de conversão para alimentar as métricas do corretor sem violar a restrição de escrita direta no documento do imóvel. |
| `viewings` | Agendamentos de visitas aos imóveis | Criação pelo interessado com data, hora e contacto; leitura e alteração de status (`confirmada`, `cancelada`, `realizada`) pelo corretor e pelo visitante. |
| `saved_searches` | Pesquisas salvas com filtros | Leitura e escrita restritas ao próprio usuário (`userId == auth.uid`). |
| `agencies` | Diretório oficial de imobiliárias | Leitura pública; gestão por admin ou gestor da agência. |
| `property_reports` | Denúncias de anúncios falsos/duplicados | Criação por qualquer usuário; leitura/resolução exclusiva por moderadores e administradores. |

---

## 5. MAPEAMENTO DAS QUERIES FIRESTORE QUE PRECISAM DE CORREÇÃO

Todas as consultas públicas de `properties` devem aplicar rigorosamente o filtro `where('isApproved', '==', true)`:

1.  `src/pages/Properties.tsx`:
    *   *Antes:* `query(collection(db, 'properties'))`
    *   *Depois:* `query(collection(db, 'properties'), where('isApproved', '==', true))` + filtros compostos de tipo, localização, categoria e ordenação client-side ou indexed.
2.  `src/pages/Home.tsx`:
    *   *Antes:* `query(collection(db, 'properties'), where('isPromoted', '==', true), limit(6))`
    *   *Depois:* `query(collection(db, 'properties'), where('isApproved', '==', true), where('isPromoted', '==', true))`
3.  `src/pages/MapSearch.tsx`:
    *   *Antes:* `query(collection(db, 'properties'))`
    *   *Depois:* `query(collection(db, 'properties'), where('isApproved', '==', true))`
4.  `src/pages/CategoryPage.tsx`:
    *   *Antes:* `query(collection(db, 'properties'), where('category', '==', filterCategory))`
    *   *Depois:* `query(collection(db, 'properties'), where('isApproved', '==', true), where('category', '==', filterCategory))`
5.  `src/pages/AgentProfile.tsx`:
    *   *Antes:* `query(collection(db, 'properties'), where('agent.name', '==', decodedName))`
    *   *Depois:* `query(collection(db, 'properties'), where('isApproved', '==', true), where('agent.name', '==', decodedName))`
6.  `src/services/propertyService.ts`:
    *   Garantir que os métodos de busca pública incluam `where('isApproved', '==', true)`.

---

## 6. RISCOS DE REGRESSÃO & MITIGAÇÕES

| Risco | Impacto | Estratégia de Mitigação |
| :--- | :--- | :--- |
| **Quebra de índices compostos no Firestore** | Queries com múltiplos `where` e `orderBy` falharem com erro `requires an index`. | Empregar filtragem híbrida inteligente: aplicar `where('isApproved', '==', true)` obrigatoriamente na query Firestore e realizar filtros complementares refinados em memória no cliente quando não houver índice pré-construído, garantindo resposta instantânea e sem falhas. |
| **Violação das Security Rules V1** | Testes de penetração (`npm run test:security`) falharem se as regras forem modificadas descuidadamente. | As regras de segurança para `properties`, `users`, `orders` e `storage` permanecerão intactas. Novas regras necessárias (para `leads`, `viewings`, `saved_searches`) serão anexadas respeitando estritamente o isolamento por `auth.uid` e `agentId`. O comando `npm run test:security` continuará rodando com 100% de sucesso. |
| **Sobrecarga de re-renders ou travamentos em listas** | Queda de FPS ao filtrar dezenas de imóveis com fotos em alta resolução. | Paginação visual e debounce nos inputs de texto e faixa de preço. Lazy loading nas imagens com fallbacks otimizados. |
| **Inconsistência de Favoritos Offline / Online** | Perda de favoritos se o usuário favoritar antes de fazer login. | Sincronização automática entre `localStorage` temporário e Firestore após login no `AuthContext`. |

---

## 7. PLANO DE EXECUÇÃO EM FASES (CORE V2)

### FASE 1 — Sincronização de Queries & Correção das Regressões de Leitura
*   Atualizar todas as consultas públicas para exigir `where('isApproved', '==', true)`.
*   Remover todos os `Math.random()` e simulações artificiais de métricas nos dashboards.
*   Conectar o contador de propriedades do serviço com o filtro de aprovação.

### FASE 2 — Motor de Busca & Filtros Avançados (`Properties.tsx`)
*   Implementar barra de busca abrangente com busca textual (título, descrição, bairro, província).
*   Filtro por Tipo (Venda / Arrendamento / Todos).
*   Filtro por Categoria (Apartamento, Moradia, Terreno, Escritório, Comercial, etc.).
*   Filtro por Província / Cidade de Moçambique com cidades satélites (Matola, Maputo, Beira, Nampula, Vilankulo, Pemba, etc.).
*   Filtro por Faixa de Preço (MZN / USD) com inputs min/max.
*   Filtro por Quartos (T1, T2, T3, T4, T5+), Casas de Banho e Garagem.
*   Filtro de Apenas Verificados (`verificationStatus === 'approved'`).
*   Ordenação: Mais recentes, Menor preço, Maior preço, Mais visualizados.
*   Sincronização bidirecional completa com URL Search Params (`?type=...&city=...&minPrice=...`).

### FASE 3 — Card de Imóvel Premium & Ações Rápidas (`PropertyCard.tsx`)
*   Badges informativas claras (Verificado com ícone oficial, Tipo de Negócio, Preço em destaque).
*   Indicadores visuais de Quartos, Banheiros, Área em m² e Garagem.
*   Botão de Favoritar com preenchimento reativo e feedback instantâneo.
*   Botão de Adicionar à Comparação.
*   Tag do Corretor / Imobiliária responsável.

### FASE 4 — Página de Detalhe do Imóvel & Lead Capture (`PropertyDetails.tsx`)
*   Informações completas do imóvel e especificações técnicas.
*   Badges de Documentação Verificada e NUIT/Alvará.
*   Formulário de Contato / Envio de Proposta com geração de documento na coleção `leads`.
*   Botão de WhatsApp com mensagem contextualizada pré-formatada e registro de evento em `lead_events`.
*   Botão de Ligar com revelação de telefone e tracking de evento.
*   Agendamento de Visita com escolha de data/turno persistido em `viewings`.
*   Compartilhamento em redes sociais e cópia do link.
*   Denúncia de Anúncio (`property_reports`).

### FASE 5 — Sistema de Favoritos Robusto (`/favorites` & `UserDashboard.tsx`)
*   Persistência real no Firestore para usuários autenticados e espelhamento em `localStorage` para visitantes.
*   Listagem completa de favoritos salvos com opções de remoção, ordenação e pesquisa.
*   Conexão direta no `UserDashboard` eliminando o `setTimeout` mock.

### FASE 6 — Sistema de Gestão de Leads para Corretores (`AgentDashboard.tsx`)
*   Painel de Leads recebidos com identificação do imóvel de origem, nome, telefone, email e mensagem.
*   Controle de status do lead (`Novo`, `Em Contacto`, `Visita Agendada`, `Concluído`, `Perdido`).
*   Visão de Agendamentos de Visitas pendentes e confirmadas.
*   Métricas reais calculadas a partir de `lead_events` (Cliques no WhatsApp, Contatos telefônicos, Visitas agendadas e Visualizações reais).

### FASE 7 — Pesquisas Salvas & Alertas (`saved_searches`)
*   Permitir ao usuário salvar a pesquisa atual a partir da página `/properties`.
*   Gestão de pesquisas salvas no perfil com opção de executar a busca novamente com 1 clique.

### FASE 8 — Comparador Lado a Lado Refinado (`Compare.tsx`)
*   Comparação detalhada de até 4 imóveis incluindo preço/m², condomínio, características, localização e status de verificação.
*   Tabela com cabeçalho fixo e rolagem horizontal suave no mobile.

### FASE 9 — Validação, Auditoria de Segurança & Compilação Final
*   Execução do `npm run test:security` para assegurar que nenhuma regra de segurança foi violada.
*   Execução do `compile_applet` para validação de build em produção.
*   Verificação de responsividade mobile e fluxos de ponta a ponta.

---

## 8. CONCLUSÃO DA AUDITORIA
A base do MeuPlace possui excelente qualidade e design profissional. As intervenções necessárias concentram-se em conectar o frontend a fluxos de dados 100% reais, corrigir as queries para alinhamento com as regras de segurança já aprovadas e implantar o ciclo completo de geração de leads imobiliários.
