# Execuções dirigidas

Runtime examinado: `e4079a9585ec04477c35e71100dbdb3f56541479`.
Ambiente Windows, dependências existentes, JDK 21 e PostgreSQL Testcontainers.
Nenhum arquivo de produto ou teste existente foi editado nesta revisão.

## Componentes e TypeScript

Em `controle-financeiro-frontend`:

```powershell
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts cf015-revalidation-overlap cf015-reconciliation-lifecycle cf015-payment-reconciliation cf015-financial-consumers cf015-recovery-expanded async-state cards-planning-audit
node node_modules/typescript/bin/tsc --noEmit
```

- [componentes.log](componentes.log): **41 aprovados**, sete arquivos, sem
  falhas/skips. Inclui teste original do revisor sem alteração.
- [typecheck.log](typecheck.log): exit 0; arquivo vazio é resultado esperado.

Não se executou novamente a suíte completa, build ou lint global. Resultados
dessas verificações de rodadas anteriores não são apresentados como execução
desta revisão. Os testes compartilhados incluem casos de outros achados, sem
reabrir seus encerramentos.

## Detecção dos defeitos em cópia isolada

Na raiz:

```powershell
node tasks/evidencias/revalidacao-CF-015-RV01/probe.mjs
```

- Hook de `f550b9e` com teste original intacto: **um teste falha por fechamento
  indevido** (`onClose` uma vez), [original-hook.log](original-hook.log).
- Candidato sem guard da geração após sucesso das leituras: **dois testes
  falham** por resolver undefined após troca de sessão/desmontagem,
  [missing-success-guard.log](missing-success-guard.log). Cinco casos não
  selecionados pelo filtro aparecem skipped; não houve alteração de skip.
- Não são falhas de import, ambiente ou expected ajustado. Exit 0 do script
  significa que ambos os testes defeituosos produziram os exits 1 esperados.
- [probe.json](probe.json): três blobs iguais do teste original, dez hashes do
  candidato conferidos, cópia restaurada e produto compartilhado intacto.

## Jornada integrada

Em `controle-financeiro-backend`:

```powershell
$env:JAVA_HOME='C:/Users/Aluga.com/AppData/Local/Temp/cf006-jdk21/jdk-21.0.12.1+1'
$env:CF015_VISUAL_DIR='../tasks/evidencias/revalidacao-CF-015-RV01/visual'
$env:CF015_NATIVE_ZOOM='0'
.\mvnw.cmd --batch-mode '-Duser.timezone=UTC' '-Dcf007.playwright.project=sao-paulo' '-Dtest=TemporalBrowserApiPostgresE2E' test
```

Execução com acesso autorizado ao cache Maven/Docker local, usando somente
banco descartável. JVM UTC/navegador São Paulo; namespace `cf007-4f7ab2a7`.
Resultado: **9/9 Playwright, sem retries/skips, e 1/1 Java do orquestrador
com conferência SQL/Excel aprovados**, exit 0, tempo Maven 4m44s.
[integrado.log](integrado.log), [playwright.log](playwright.log).
Zoom opt-in desligado não significa aprovação: sua lacuna permanece explícita.
O comando existente mantém notas/temporal/visual de viewport acoplados à
conferência SQL; não se alterou o harness para obter verde nem se enfraqueceu
o oráculo do banco. Capturas geradas não constituem nova inspeção visual.

Pagamento `ok`, `read`, `lost` e `overlap`: POST passa por navegador/BFF/Spring/
PostgreSQL. São injetadas falhas de leitura/transporte, não sucesso monetário.
No modo overlap, primeira leitura é retida, evento real de refresh inicia
outra leitura recusada e a recuperação ocorre somente por GET. As assertions
observam modal pendente, mensagem, botão de envio bloqueado e POST único;
depois fatura PAID, dívida zero, saldo 900, planejamento e reload. O Java
confere saldo 900, exatamente um débito de 100 e fatura/plano PAID em SQL.

## Preservação

HEAD inicial e candidato: e4079a9. README raiz era a única alteração inicial,
com hash `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Staging inicialmente vazio. O teste original continua com blob
`bd65cf47cd29f42c81acdc788622f4763d6f509f`.
As alterações desta revisão restringem-se a evidências e estado documental
de CF-009/013/015. CF-016 continua proposta e seu arquivo não foi modificado.
Relatórios anteriores, produto, testes e README preexistente preservados.

O commit local que adiciona este documento contém somente documentação,
evidências e o script de probe isolado. Pode ser identificado com
`git log -1 -- tasks/evidencias/revalidacao-CF-015-RV01/EXECUCOES.md`.
Staging explícito exclui README raiz e todas as camadas de produto/testes.
Logs brutos conservam espaços finais das ferramentas; o check de whitespace
dos documentos/scripts exclui `*.log`. Estado pós-commit conferido na entrega.
