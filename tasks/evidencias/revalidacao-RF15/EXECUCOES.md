# Execuções independentes — 11–12/10/2026

Produto db2d77d; Windows/PowerShell, Java21.0.12.1 Temurin, SpringBoot 4.0.2, PostgreSQL 16-alpine Testcontainers/Flyway 1–14; Node/Next 16.1.6, Playwright 1.63 e Chromium instalado do projeto. Usuários example.invalid únicos, mailbox fake/mercado fake; navegador→BFF→Spring→PG reais para persistência/finanças. Retries 0, worker 1, timeout 90s/assert 15s herdados, sem aumentos. Nenhuma API interna de sucesso financeiro interceptada. JVMUTC explícita no lote extra/backend e no probe de animação; Clock produto/auth 15jan2027 em São Paulo, relógios browser especificados por caso.

## Comandos e resultados

| Lote | Resultado | Evidência |
|---|---|---|
| Hashes |187/187 originais,24/24 árvore iguais | hash-check.json. Registro de bytes Windows conforme manifests originais; Git pode normalizar finais de linha |
| Testes contestados intactos |3 falhas OPEN/CLOSED/PAID,4 passam | contested-before.log; versão em cards-planning-audit.original.txt |
| Seleção ampla após correção normativa |14 arquivos/115 passam | components.log, inclui as três provas; não substituir por seleção menor |
| Contraprova isolada | fórmula antiga 3 falhas/4 passam; restaurado 7 passam | counterproof*.log/json, script separado; fonte principal intacta |
| Browser primeira seleção |0 casos, erro No tests found | browser.log + browser/playwright.log. Âncora^ no grep ignorou prefixo do título completo Playwright; removida só a âncora, sem mudar teste |
| Browser dirigido corrigido |12 passam/1 falha | browser-directed.log + browser-directed/playwright.log. Falha retorno investimento; meta/hábito exploratórios verdes registram resíduos, não os aprovam |
| Browser extra inicial |1 passa/1 falha | extra-backend.log + browser-extra. Privacidade navegação/rascunho passa; atraso na aba aberta falha |
| Backend pertinente no mesmo lote |15 CF019 + 5 Rf15InvoiceDates passam | extra-backend.log. Maven agregado 21 testes tem 1 falha do orquestrador browser; não declarar esse build de testes verde |
| Animação de contas |1 falha | accounts-animation.log, browser-extra/accounts-animation. Leitor inicial registra também rgba alpha 0: limitação reconhecida; frames alpha positivo e imagem permanecem válidos |
| Animação com alpha numérico |1 falha,17 amostras alpha>0 | accounts-alpha.log, browser-extra/accounts-alpha. Não é retry para obter verde; remove falso positivo de transparência do próprio probe |
| Lint/typecheck |exit0 | lint-final/typecheck-final e lint-delivery/typecheck-delivery após última edição do probe |
| Build frontend |exit0 | build.log, Next build completo. Não houve deploy; nova alteração posterior é apenas leitor de alpha no teste, validado por lint/typecheck |

No frontend, a seleção ampla foi exatamente a linha registrada no início de components.log. Provas corrigidas e contraprova têm comando/script próprios em TESTES-CONTESTADOS.md. Comandos estáticos: `npm run lint`, `npm run typecheck`, `npm run build`.

Na raiz, JAVA_HOME aponta para `controle-financeiro-backend/target/temurin21/jdk-21.0.12.1+1`, com bin no PATH. Browser dirigido:

```powershell
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rf15RemediationBrowserTest' '-Dreview.evidence=../../revalidacao-RF15/browser-directed' '-Dreview.grep=C: privacidade|C: detalhe|D: competência|RF15-01:|RF15-02:|RF15-03:|RF15-04:|Matriz CF' test
```

Lote extra/backend (o teste de animação foi acrescentado depois; para reproduzir exatamente os dois primeiros usar grep `fatura aberta|privacidade na navegação`):

```powershell
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rf15IndependentBrowserTest,Rf15InvoiceDatesTest,Cf019CardIntegrationTest' '-Duser.timezone=UTC' test
```

Confirmação de animação:

```powershell
./controle-financeiro-backend/mvnw.cmd -f controle-financeiro-backend/pom.xml --batch-mode '-Dtest=Rf15IndependentBrowserTest' '-Dreview.evidence=accounts-alpha' '-Dreview.grep=contas privadas' '-Duser.timezone=UTC' test
```

Usar diretório de evidência novo em reexecuções para não sobrescrever prova. Config nova seleciona somente rf15-independent.integrated.spec.ts; demais probes originais permaneceram intactos. Nenhum build Next concorreu com browser na porta3107. Alguns comandos exigiram execução fora do sandbox para Docker/cache/SWC, mantendo dados descartáveis.

## Alcance e limites

- Observação de animação é passiva por requestAnimationFrame: cor computada, alpha, viewport e produto das opacidades ancestrais; não altera DOM/CSS, duração, comportamento ou zoom. Callback grava primeira screenshot e JSON. Estado acessível é conferido separadamente.
- Meia-noite usa relógio controlado e evento window.focus para executar o listener de revalidação; não é relato de operação manual. Espera padrão 15s não atualizou a label; datas e seleção ficaram estáveis.
- Browser do extrato cobre foco/rascunho/cleanup real; aninhamento/defaultPrevented tem prova de componente. Não alegar fluxo financeiro aninhado inexistente no extrato.
- SQL final registra contas/transações/faturas/metas/investimentos após cada lote. Ex.: PAID 120 e conta 880, parcial 20 e saldo 980, ativo 8/unidades/custo80. Sem avaliar desempenho sob carga; campo DTO adicionado é escalar já carregado, sem nova consulta no diff.
- RVA03: somente evidência passiva histórica conferida, nenhuma sequência nova. Zoom: limitações/capacidades conferidas, nenhum 200 aplicado. Não certifica produção, CF017, nem todos os consumidores.
- Primeiro plano por shell não foi salvo; MATRIZ-PRE informa o momento efetivo de registro. Resultados históricos não foram apagados. Logs brutos podem ter espaços finais e warnings de infraestrutura; isso não equivale a falha de código.
- Diretório contém apenas contas sintéticas e provas sem tokens/headers. Mailbox fica em tests/artifacts ignorado. Sem alteração de produto; manifesto final permite conferir arquivos de prova.
