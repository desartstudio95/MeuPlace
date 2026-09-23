# MEUPLACE — AUDITORIA DE PRONTIDÃO PARA PRODUÇÃO
**Fase 4.5 — Security, Abuse & Production Readiness Audit**
**Data de Execução:** 2026-09-20  
**Status Global:** PRONTO PARA DEPLOY COM ACOMPANHAMENTO  
**Total de Testes Automatizados:** 175/175 Aprovados (100%)  
**Erros de TypeScript:** 0  
**Erros de Lint:** 0  
**Build de Produção (Vite + esbuild):** PASS  

---

## 1. Índices Compostos do Firestore (`firestore.indexes.json`)

Consultas com múltiplos filtros de igualdade e ordenação exigem índices compostos pré-declarados para evitar erros em tempo de execução (`FAILED_PRECONDITION: The query requires an index`).

Os seguintes índices essenciais da Fase 4 estão mapeados e configurados no repositório:

| Coleção | Campos Indexados | Finalidade de Negócio |
| :--- | :--- | :--- |
| `properties` | `isApproved` (ASC) + `createdAt` (DESC) | Feed principal de listagem pública ordenada por novidade |
| `properties` | `isApproved` (ASC) + `price` (ASC / DESC) | Filtros de preço mínimo e máximo no catálogo |
| `properties` | `isApproved` (ASC) + `city` (ASC) + `createdAt` (DESC) | Pesquisa por província/cidade em Moçambique |
| `properties` | `isApproved` (ASC) + `category` (ASC) + `createdAt` (DESC) | Filtro por tipo de imóvel (Apartamentos, Moradias, Terrenos) |
| `user_notifications` | `userId` (ASC) + `createdAt` (DESC) | Notificações do usuário ordenadas da mais recente para a mais antiga |
| `leads` | `agentId` (ASC) + `createdAt` (DESC) | Caixa de entrada de leads do corretor por ordem cronológica |
| `leads` | `propertyOwnerId` (ASC) + `createdAt` (DESC) | Painel do proprietário com histórico de interessados |
| `leads` | `propertyId` (ASC) + `customerPhone` (ASC) | Deduplicação temporal rápida de 24 horas por telefone |
| `viewings` | `agentId` (ASC) + `preferredDate` (ASC) | Agenda de visitas do corretor ordenada por data futura |
| `viewings` | `propertyOwnerId` (ASC) + `preferredDate` (ASC) | Agenda do proprietário |
| `viewings` | `requesterId` (ASC) + `createdAt` (DESC) | Histórico de visitas solicitadas pelo comprador |
| `property_reports` | `status` (ASC) + `createdAt` (DESC) | Fila de triagem da moderação (denúncias abertas primeiro) |

---

## 2. SEO, Metatags e Rastreamento por Mecanismos de Busca

### 2.1 Arquivo de Instruções para Crawlers (`public/robots.txt`)
- Declara permissão global (`Allow: /`) e aponta para o sitemap canônico: `https://www.meuplace.com/sitemap.xml`.

### 2.2 Endpoint Dinâmico de Sitemap (`server.ts`)
- O servidor Express implementa rota `/sitemap.xml` que consulta dinamicamente os imóveis aprovados e gera XML compatível com Google Search Console e Bing Webmaster Tools.

### 2.3 Metadados OpenGraph, Twitter Cards e JSON-LD (`PropertyDetails.tsx`)
- **Tags Canônicas e Sociais:** `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`;
- **Dados Estruturados Schema.org:** Emite script `<script type="application/ld+json">` contendo schema do tipo `RealEstateListing` e `SingleFamilyResidence`, informando preço, moeda (`MZN` / `USD`), localização e características físicas para indexação rica (Rich Snippets).

---

## 3. Higiene de Variáveis de Ambiente

Conforme verificado em `.env.example` e nos arquivos de código:

| Variável | Escopo | Descrição | Status |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Backend (Node/Express) | Chave de inteligência artificial (injetada de forma segura, nunca exposta ao browser) | Configurado |
| `APP_URL` | Backend / Frontend | URL base da aplicação no Cloud Run | Configurado |
| `VITE_RECAPTCHA_SITE_KEY` | Frontend (Client) | Chave pública para atestação de clientes genuínos via App Check | Declarado em `.env.example` |
| `VITE_APP_CHECK_DEBUG_TOKEN` | Frontend (Dev/CI) | Token de depuração para testes locais e pipelines sem reCAPTCHA | Declarado em `.env.example` |
| `ENFORCE_APP_CHECK` | Backend (Functions) | Flag de enforcement estrito nas Cloud Functions | Declarado em `.env.example` |

Nenhum segredo ou chave privada de serviço foi versionado no repositório.

---

## 4. Segurança de Código, Prevenção de XSS e Tratamento de Erros

1. **Prevenção de XSS (Cross-Site Scripting):**
   - O React escapa automaticamente todos os valores injetados no JSX;
   - Não há uso de `dangerouslySetInnerHTML` em formulários de contacto, mensagens de leads ou descrições enviadas por usuários;
   - As descrições de imóveis utilizam componentes de texto controlado com quebra de linha tratada sem injeção HTML.
2. **Prevenção de Injeção em Links (Tel / WhatsApp):**
   - No `PropertyDetails.tsx`, números de telefone para WhatsApp e discagem direta são sanitizados com expressões regulares (`replace(/\D/g, '')`), impedindo injeção de esquemas maliciosos como `javascript:`.
3. **Tratamento Resiliente de Erros:**
   - Todas as chamadas assíncronas do `leadService`, `viewingService` e `reportService` possuem blocos `try/catch` com feedback visual via `toast.error`;
   - O estado dos formulários é preservado em caso de falha de conexão, prevenindo frustração e perda de texto digitado pelo usuário.

---

## 5. Resumo da Suíte de Testes Automatizados

```text
========================================================================
SUÍTE DE TESTES                       TESTES EXECUTADOS   RESULTADO
------------------------------------------------------------------------
1. Query Layer & Filter Suite (V2)          25/25           APROVADO
2. Property Card & Engagement Suite (V2)    15/15           APROVADO
3. Lead Capture & Details Suite (V2)        25/25           APROVADO
4. Security Rules & Penetration Suite (V1) 110/110          APROVADO
------------------------------------------------------------------------
TOTAL GERAL                                175/175          100% PASS
========================================================================
```
