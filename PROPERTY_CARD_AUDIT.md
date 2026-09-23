# MEUPLACE — PROPERTY CARD AUDIT (FASE 3)

## 1. Visão Geral do Componente Atual

- **Arquivo Principal:** `src/components/PropertyCard.tsx`
- **Total de Linhas:** 156 linhas
- **Interface de Props:**
  ```typescript
  export interface PropertyCardProps {
    property: Property;
    className?: string;
    isHighlighted?: boolean;
  }
  ```

---

## 2. Ocorrências e Usos no Código

O `PropertyCard` é consumido em 6 pontos críticos da aplicação:

1. `src/pages/Properties.tsx` (Linha 795): Listagem principal do catálogo com filtros e paginação.
2. `src/pages/Home.tsx` (Linha 524): Seção de imóveis em destaque na página inicial.
3. `src/pages/CategoryPage.tsx` (Linha 76): Listagem filtrada por categoria específica.
4. `src/pages/AgentProfile.tsx` (Linha 317): Portfólio público do corretor.
5. `src/pages/dashboard/UserDashboard.tsx` (Linha 145): Aba "Meus Favoritos" do utilizador comum.
6. `src/pages/dashboard/ResortDashboard.tsx` & `AgentDashboard.tsx`: Visão de imóveis ativos no painel.

---

## 3. Análise Detalhada dos Elementos Atuais

| Elemento | Implementação Atual | Problema / Oportunidade Identificada | Solução Fase 3 |
| :--- | :--- | :--- | :--- |
| **Imagem e Galeria** | Carrossel simples com botões de próximo/anterior; altura fixa `h-36`; placeholder externo `https://placehold.co/800`. | `h-36` (144px) distorce imagens panorâmicas; falta lazy-loading explícito; quebra se link externo falhar; layout shift. | Usar container com aspect ratio consistente (16:10 ou 4:3), `loading="lazy"`, `onError` com fallback SVG de alta fidelidade e `Skeleton` integrado. |
| **Favoritos** | Botão com ícone `<Heart>` (Linha 100) estático sem `onClick`. | Botão puramente decorativo sem ação nem persistência. | Integrar ao `FavoriteContext` centralizado: estado real (`♡` / `♥`), atualização otimista, persistência no Firestore sem N+1 reads, suporte a visitantes anônimos com sincronização pós-login. |
| **Comparação** | Botão flutuante `<SplitSquareHorizontal>` no canto da foto. | Ícone discreto que não deixa claro se o imóvel já está na comparação. Limite anterior era 4 no contexto. | Atualizar `CompareContext` para limite estrito de 3 ("Pode comparar até 3 imóveis."); botão com rótulo claro e estado `✓ Comparando`. |
| **Badges** | Exibe `isPromoted` ("Destaque") e `type` ("Venda"/"Arrendamento"). | Não exibia o badge de verificação oficial (`verificationStatus === 'approved'`), nem badge temporal ("Novo"). | Adicionar badge "Verificado" baseado em `verificationStatus === 'approved'` e "Novo" para imóveis criados nos últimos 14 dias. |
| **Preço** | Formatação simples com `toLocaleString()` e `/mês` hardcoded. | Moeda USD vs MZN e espaçamento precisam de padronização limpa. | Formatter dedicado `formatPropertyPrice(price, currency, type)`. |
| **Características** | **Ausentes** no card atual (apenas título, localização e preço). | Utilizador não sabia quantos quartos, banheiros ou m² o imóvel possuía sem abrir os detalhes. | Adicionar linha com quartos, WC e área construída (`m²`), omitindo zeros ou valores não informados. |
| **CTA / Links** | Apenas link no título e na imagem. | Não havia botão principal explícito de ação ("Ver imóvel"). | Adicionar botão CTA "Ver imóvel" com foco acessível e link direto para `/properties/:id`. |
| **Event Tracking** | Inexistente. | Sem telemetria estruturada de engajamento do card. | Preparar emissão de eventos: `property_card_view`, `favorite_add`, `favorite_remove`, `compare_add`, `compare_remove`, `property_open`. |
| **Acessibilidade** | Faltavam `aria-label` nos botões de ação e tags de descrição. | Leitores de tela não compreendiam a finalidade dos botões flutuantes. | Adicionar `aria-label` completos, foco visível pelo teclado e contraste WCAG AA. |
| **Responsividade** | `max-w-[350px]` fixo. | Pode restringir a largura em telas maiores ou criar espaçamento inconsistente em grids flexíveis. | Suporte fluido: largura total controlada pelo grid pai (`w-full`). |
