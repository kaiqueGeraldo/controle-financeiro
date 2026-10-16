# Execuções e limites — 16/10/2026

Windows/PowerShell, JDK21.0.12.1, Node24.18.0, Next16.1.6,
Playwright1.63.0, PostgreSQL16-alpine em Testcontainers. Sem fallback externo;
EmailService/MarketDataService são doubles herdados de PostgresIntegrationTest.
Somente exportação `.cf22` de e1c6312, produto principal preservado. Nenhuma
execução de CF029, migração real, deploy manual ou comunicação real.

## Preparação e comandos

`node tasks/evidencias/investigacao-CF022/prepare.cjs`: preserva hashes, exporta
backend/frontend com git archive, conecta node_modules já instalado e cria
instrumentação na cópia. Primeiro intento parou em EPERM na junction; a exportação
foi preservada. `resume-prepare.cjs` retomou exatamente desse ponto com permissão
ampliada, sem refazer/sobrescrever originais. Scanner confirmou322 arquivos e
classes flex/fixed; `.cf22/.gitignore` ignora somente o ZIP, sem excluir fontes CSS.

Comando-base no backend da cópia, JAVA_HOME apontando para o JDK local acima:

```powershell
./mvnw.cmd --batch-mode '-Dmaven.repo.local=C:/Users/Aluga.com/.m2/repository' `
  '-Dtest=SELECAO' '-Duser.timezone=UTC' '-Dcf022.clock=MODO' `
  '-Dcf022.evidence=../../tasks/evidencias/investigacao-CF022/NOME-NOVO' test
```

Seleção scheduler: `Cf022SchedulerProbeTest#freshThenResidualFixtures`.
Seleção browser: `HabitBrowserIntegrationTest`. Modo original ou date-only.
`run.ps1` encapsula os mesmos argumentos, recusa reutilizar log e restaura bytes
de Habit.java em finally. As duas primeiras execuções scheduler e demais invocações
com nomes adicionais usaram diretamente o comando-base. Não rodar scripts antigos
de evidência que sobrescrevem seus outputs; usar pasta/runtime novos para revisão.

## Inventário dos resultados

| Log/pasta | Resultado | Interpretação |
|---|---|---|
| scheduler-lazy |1 teste novo,0 failures/errors/skips; fixture fresca e residual501 passam|Assertions originais executadas duas vezes, três callbacks por caso; 479/9890ms totais|
| scheduler-eager |1 teste novo,0 failures/errors/skips; fresca e residual501 passam|Reintrodução isolada de EAGER,598/11053ms; não reproduziu timeout|
| browser-original |1 falha Java; nenhuma jornada de hábitos|Erro de encerramento de trace não iniciado mascarou erro primário; SQL terminal vazio|
| browser-original-02 |1 falha Java; nenhuma jornada de hábitos|A substituição de declaração/diagnóstico não casou CRLF, tracingStarted ausente; erro do probe preservado|
| browser-original-03 |1 falha Java; nenhuma jornada de hábitos|Captura corrigida mostra toHaveURL5s após login200; ainda /auth, SQL vazio|
| browser-date-only |1 falha Java; nenhuma jornada de hábitos|Mesmo impedimento de preparação /auth no controle; não é RJ02201 nem prova contra o relógio no clique semanal|
| browser-api-original |1 orquestrador Java aprovado;4 jornadas reais|Cadastro/login API e cookie sintético; hábitos criados/toggle/reload pela UI; drift de animações observado, sem timeout30s|
| browser-api-date-only |1 orquestrador Java aprovado;4 jornadas reais|Mesma fixture/ações, sem tempos negativos de animação; ver resumo e diagnóstico RJ02201|
| verify.log |ENOBUFS ao ler asset maior que buffer padrão|Falha do verificador, não de produto; preservada|
| verify-final.log |144 arquivos históricos e431 arquivos de produto preservados|Buffer ajustado para leitura de assets, sem tolerância de teste alterada; binários comparados como bytes|

Contagens sobrepostas: não somar os callbacks aos testes Java, nem chamar as
tentativas de cadastro de jornadas CF022. Um orquestrador aprovado confere também
quatro hábitos/streak0, quatro logs PENDING04/01, quatro metas0 e zero GoalHistory.
terminal-sql.txt é releitura adicional, inclusive em falha; assertions originais
financeiras permanecem no Java e browser. Resultados esperados vêm de DEC08.

## Ajustes exclusivamente de diagnóstico

Snapshots browser-observer-run01/02/02-actual/03 e scripts preservam os estados
intermediários. repair-observer-03 normaliza CRLF antes da substituição e verifica
a presença da declaração e logging original. Não muda produto.

Após falha também no controle Date-only, `prepare-api-fixture.cjs` delimita a
preparação: registro/login reais pelo BFF, token recebido instalado como cookie
httpOnly/Lax; token nunca escrito em artefato público. Visita home por navegação
completa e mantém assertion da URL. Isso não revalida nem corrige cadastro/CF011.
Sequência alvo DAILY→WEEKLY_GOAL, payloads, marca/desmarca, releitura HTTP e SQL
mantidos; não se chama essa fixture de reprodução integral do runtime histórico.

Os dois modos usam reducedMotion=no-preference (o histórico usava reduce),
animações nativas ativas, nenhum click forçado, retry, sleep novo ou timeout
aumentado. `settle` conserva click/response e aguarda ambos para não perder erro;
DOM/WAAPI/eventos/rede são observações suplementares. Capturas antes do click
podem ocorrer antes do GET pós-criação; não equivalem a estado estabilizado.

Para reconstruir o probe final em exportação nova, aplicar nesta ordem: prepare,
repair-observer, repair-observer-03 e prepare-api-fixture. O resume só foi usado
para a interrupção EPERM local. Conservar os snapshots intermediários como prova
das falhas; não aplicar novamente patches sobre um runtime já preparado.

## Preservação e privacidade

`verify.cjs`: compara hashes dos144 originais/README e431 fontes/assets de
produto de checkout/cópia contra e1c6312, admitindo CRLF em texto; registra diffs
dos adaptadores de teste/configuração. Nenhuma fonte de produto foi corrigida.
As alterações EAGER existiram somente na cópia e foram restauradas antes do browser.

`sanitize.cjs`: preserva bytes brutos em raw/ ignorado; remove senha sintética/JWT
de logs e snapshots ARIA publicados, com hashes original/publicado. Traces, se
gerados, ficam privados/ignorados por conter cabeçalhos de sessão; não publicar
cookies. Success tracing não foi exportado: observação pública consiste em
JSON/JSONL, imagens, logs e SQL. Nenhuma falha ambiental ou intermediária apagada.
`summary.json` deriva dos arquivos, e não substitui a interpretação dos limites.

Verificação final do index encontrou normalização de fim de linha em três scripts
no primeiro commit de provas. `.gitattributes` desta pasta exige bytes exatos;
reindexação com essa regra e commitdcf0721 preservam os bytes originais.134 hashes
do manifesto conferidos no index; diff ignorando fim de linha vazio. O check de
whitespace desses scripts sinaliza CR terminal preservado, não mudança funcional.
Checagem de documentação passa. `node --check` recusou snapshot com extensão.txt;
parse sem execução por vm.Script passou nos15 scripts/snapshots, registrado em
syntax-validation.json. Nenhuma dessas falhas instrumentais é teste de produto.
