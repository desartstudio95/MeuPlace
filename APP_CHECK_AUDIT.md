# MEUPLACE — AUDITORIA DE APP CHECK (FIREBASE)
**Fase 4.5 — Security, Abuse & Production Readiness Audit**
**Data de Execução:** 2026-09-20  
**Ambiente:** Web (React 18 / Vite / TypeScript), Node.js / Express, Firebase Firestore, Firebase Storage & Cloud Functions  
**Classificação:** Documento Técnico de Arquitetura e Segurança  

---

## 1. Sumário Executivo

O Firebase App Check protege os recursos do backend (Firestore, Cloud Storage e Cloud Functions) contra tráfego não proveniente de clientes genuínos da aplicação. Clientes maliciosos ou scripts automatizados (cURL, Puppeteer, bots de scraping) frequentemente extraem chaves públicas do bundle da aplicação (`apiKey`, `projectId`, `appId`) e realizam chamadas diretas às APIs do Firebase, contornando a interface web.

Esta auditoria identificou o estado de prontidão do App Check no ecossistema do **MeuPlace**, mapeou a superfície de exposição sem App Check, implementou a infraestrutura de suporte no cliente e nas Cloud Functions, e estabeleceu o plano de ativação segura para produção.

---

## 2. Diagnóstico Atual: Superfície de Exposição sem App Check

| Serviço Firebase | Estado de Enforcement | Risco Principal sem App Check | Impacto de Negócio |
| :--- | :--- | :--- | :--- |
| **Cloud Firestore** | Desativado (Monitoramento) | Scraping de imóveis aprovados em escala; flood de criação de leads e denúncias; exaustão de cota de leitura/escrita. | Elevação de custos de billing; degradação de performance para usuários reais; extração em massa do catálogo imobiliário por concorrentes. |
| **Cloud Storage** | Desativado (Monitoramento) | Download direto de fotos de imóveis e logos sem passar pelo marketplace; tentativa de upload de arquivos por bots contornando a UI. | Consumo excessivo de largura de banda (egress); custos com CDN. |
| **Cloud Functions (Callable)** | Preparado (`ENFORCE_APP_CHECK`) | Invocação automatizada de funções administrativas (`approveProperty`, `deleteProperty`, `setUserRole`). | Embora protegidas por checagem de role admin (`checkAdmin`), chamadas sem App Check sobrecarregam instâncias sem servidor e aumentam custos computacionais. |

### 2.1 Por que Security Rules Sozinhas Não Substituem o App Check?
As **Firestore Security Rules** e **Storage Security Rules** são mestres absolutos em **Autorização** (quem pode fazer o quê) e **Integridade de Dados** (validação de schemas e campos imutáveis).  
Entretanto, as Security Rules:
- **NÃO** sabem se a requisição veio do navegador do MeuPlace ou de um script Python em linha de comando;
- **NÃO** impedem que um usuário autenticado ou anônimo execute 50.000 requisições legítimas por minuto via script, causando negação de serviço e faturas astronômicas de banco de dados;
- **NÃO** detectam automações e emuladores headless.

O **App Check** atua na camada de **Atestação de Plataforma** (Layer 7 / Application Attestation), garantindo que apenas instâncias genuínas do aplicativo MeuPlace consigam obter tokens de acesso válidos.

---

## 3. Implementação e Prontidão do Código

### 3.1 Cliente Web (`src/lib/firebase.ts`)
Foi implementada a inicialização segura com suporte a múltiplos provedores e token de depuração para desenvolvimento:

```typescript
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';

let appCheckInstance: AppCheck | null = null;
export const getAppCheckInstance = (): AppCheck | null => {
  if (typeof window === 'undefined') return null;
  if (appCheckInstance) return appCheckInstance;

  try {
    const recaptchaSiteKey = import.meta.env?.VITE_RECAPTCHA_SITE_KEY;
    const isDev = import.meta.env?.DEV;

    // Em desenvolvimento local/CI, ativa token de debug para não bloquear desenvolvedores
    if (isDev && typeof window !== 'undefined') {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env?.VITE_APP_CHECK_DEBUG_TOKEN || true;
    }

    if (recaptchaSiteKey) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.info('[AppCheck] Inicializado com sucesso via ReCaptchaV3Provider.');
    } else {
      if (isDev) {
        console.info('[AppCheck] VITE_RECAPTCHA_SITE_KEY não configurada. App Check em modo passivo.');
      }
    }
  } catch (err) {
    console.warn('[AppCheck] Inicialização diferida:', err);
  }

  return appCheckInstance;
};
```

### 3.2 Backend Cloud Functions (`functions/src/index.ts`)
Foi implementado o middleware `checkAppCheck`:

```typescript
const checkAppCheck = (context: functions.https.CallableContext) => {
  if (process.env.ENFORCE_APP_CHECK === "true" && !context.app) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "A função deve ser chamada a partir de um aplicativo atestado pelo App Check."
    );
  }
};
```

### 3.3 Variáveis de Ambiente (`.env.example`)
Documentadas as variáveis necessárias:
- `VITE_RECAPTCHA_SITE_KEY`: Chave pública do reCAPTCHA v3 / Enterprise;
- `VITE_APP_CHECK_DEBUG_TOKEN`: Token gerado pelo console para testes em localhost e ambientes CI/CD;
- `ENFORCE_APP_CHECK`: Flag no backend para alternar entre modo de observação (`false`) e bloqueio ativo (`true`).

---

## 4. Plano de Rollout para Produção (3 Fases)

Para evitar que usuários legítimos em navegadores legados ou redes restritas sejam bloqueados acidentalmente, o rollout deve seguir a metodologia oficial do Firebase:

```
[Fase 1: Registro & Monitoramento]
   ↓ 
   Configurar site key do reCAPTCHA v3 no Firebase Console
   Deploy do frontend com App Check em modo de registro (sem bloquear)
   Acompanhar taxa de tráfego verificado no Console (Métricas: >98% verificado)
   ↓
[Fase 2: Enforcement em Callable Functions]
   ↓
   Ativar ENFORCE_APP_CHECK="true" nas Cloud Functions
   Validar logs de erros e garantir que nenhuma ação administrativa falhe
   ↓
[Fase 3: Enforcement Global no Firestore & Storage]
   ↓
   Ativar "Enforce" no Firestore e Cloud Storage no Firebase Console
   Garantir rotas de exceção documentadas e monitoramento de alertas via Cloud Monitoring
```

---

## 5. Matriz de Riscos Residuais e Recomendações

1. **Navegadores com bloqueadores de anúncio agressivos:** Usuários com extensões que bloqueiam scripts de terceiros do Google podem ter dificuldades na obtenção do token reCAPTCHA.  
   *Mitigação:* Utilizar reCAPTCHA Enterprise com domínio próprio e TTL de token ajustado (1 hora) com fallback informativo na interface.
2. **Ambientes de CI/CD e Testes Automatizados:**  
   *Mitigação:* O arquivo `run-penetration-test.ts` utiliza o motor de regras com identidades simuladas e tokens de debug válidos, não sofrendo interferência na esteira de integração contínua.
