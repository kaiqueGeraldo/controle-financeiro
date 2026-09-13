# Harness de testes do frontend

Os testes usam somente dados sintéticos. O seed padrão é `cf001-v1`, o relógio
de navegador é `2026-09-08T02:59:59.000Z` e o fuso padrão é
`America/Sao_Paulo`. Eles podem ser alterados por `CF_TEST_SEED`,
`CF_TEST_FIXED_NOW` e `CF_TEST_TIMEZONE`.

## Comandos separados

- `npm run test:unit`: preserva os testes Node de calendário e os executa em
  São Paulo, UTC e UTC+14.
- `npm run test:component`: executa Vitest + Testing Library em jsdom. HTTP e
  navegação podem ser doubles; a regra do componente não pode ser mockada.
- `npm run test:e2e:install`: instala somente o Chromium usado pelo Playwright.
- `npm run test:e2e`: inicia e encerra o Next pelo supervisor do harness e
  executa o smoke em 360x800, 768x1024 e 1440x900.

O fluxo integrado temporal da CF-007 é intencionalmente opt-in porque também
precisa de JDK 21, Docker/Testcontainers e PostgreSQL. Ele é iniciado pelo teste
Java `TemporalBrowserApiPostgresE2E`, que sobe Spring em porta aleatória e roda
`tests/e2e/playwright.integrated.config.ts`. O comando reproduzível está na
evidência da CF-007; não apontar esse teste para banco compartilhado ou real.

P04 (13/09): o orquestrador mantém negócio/browser em `2027-01-31T05:00:00Z`
e define autenticação 48 h depois, `2027-02-02T05:00:00Z`, já após a expiração
antiga. Somente a `@TestConfiguration` injeta esse Clock em TokenService/AuthService.
Next dev e seu worker recebem o preload `tests/e2e/support/server-clock.cjs` via
comando/NODE_OPTIONS exclusivo do webServer integrado. Ele exige opt-in, backend
loopback e recusa NODE_ENV=production. O código produtivo não importa o preload
nem lê um override de relógio; JWT segue com assinatura e TTL de 24 h, sem bypass.
Relógio de autenticação avançado exige nova emissão e continua distinguindo tokens
válidos/expirados. `CF_E2E_AUTH_NOW` é transmitido pelo Java; não iniciar esse
config manualmente apontando para uma API sem o mesmo contrato de teste.

O wrapper de Playwright fixa `PLAYWRIGHT_BROWSERS_PATH=0`, mantendo o binário
do navegador sob `node_modules`, e imprime fuso, viewports, seed e relógio.
Ele recusa uma porta ocupada, aguarda `/auth` responder e encerra somente a
árvore do processo Next que criou. Falhas geram screenshot, vídeo e trace em
`tests/artifacts/playwright/`; o
relatório HTML inclui o projeto (viewport/fuso/seed) e o anexo
`harness-runtime.json`.

Testes cujo comportamento depende do tempo devem instalar
`support/controlled-clock.ts` antes da navegação. O smoke de autenticação não
congela o relógio porque a tela possui animações contínuas; aplicar
`setFixedTime` nessa tela não representa comportamento temporal relevante.

## Autenticação e integração

O smoke atual visita a rota pública `/auth` e não depende do backend. Fluxos
integrados futuros devem usar `support/synthetic-auth.ts` com namespace único
por execução e backend descartável. O helper cadastra pela UI/BFF real; não
injeta cookie, não intercepta API interna e não contém credencial real. O
domínio `example.invalid` não autoriza envio de e-mail.
