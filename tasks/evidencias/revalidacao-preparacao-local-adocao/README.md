# Revalidação independente da preparação local — 27/10/2026

**Aceite parcial. RVPLA-01 encerrado; corrida de porta aceita. Novo resíduo
RVPLA-03 de quiescência confirmado. Startup continua inconclusivo e não aprovado.**
Não houve correção de produto/harness nem liberação de adoção real.

Branch `codex/preparacao-local-adocao`. Base `07c396371029d9942b8667e5c638c04a9e6aeb4b`;
candidato `aa068d17aba41855c3f5f5fb5385b6dfd2babc4a`, intervalo `07c3963..aa068d1`.
Ancestralidade, HEAD, diff real
de125 arquivos e working tree conferidos. Entrada: somente README raiz alheio
modificado, staging vazio. As mudanças desta revisão são provas e parecer/estados.

| Parecer | Decisão independente |
|---|---|
| A — resume/checkpoints | **RVPLA-01 encerrado**: falha antes do efeito é preservada/reexecutada, sem skip ou próximo gate. Identidade/causalidade/integridade e restauração de inputs verificadas. **Retomada integral aberta por RVPLA-03**: wrapper próprio pré-JVM pode sobreviver à interrupção e iniciar trabalho após a nova tentativa |
| B — corrida de porta | **Diagnóstico e correção aceitos no recorte**: reserva no listener real, mutação antiga detectada, controles restaurados e caminhos PG16/PG17/JAR/imagem exercitados. Reuso nativo imediato não certificado |
| C — startup | **Inconclusivo, gate não aprovado**. A falha de bind nova está explicada; estouros históricos de40s não. Nenhum defeito específico de query foi confirmado |
| D — preparação local | Aceites PG16/17, guard/writers/jobs, saúde/preview e proveniência preservados. Permanecem pendentes quiescência após interrupção e previsibilidade de startup, além dos gates integrais já existentes |
| E — adoção real | **Não liberada**. CF017/P01/P02 e CF034 integral em_revisao; expanded, zoom nativo200%, configuração remota, inventário/backup/restore/freeze reais e produção continuam pendentes. CF035/036 não iniciadas |

[Achados](ACHADOS.md), [matriz](MATRIZ.md), [checkpoint/escopo](CHECKPOINTS.md),
[startup](STARTUP.md) e [encaminhamento](ENCAMINHAMENTO.md) detalham os contratos.
O novo achado não mantém artificialmente aberto o skip por status1 corrigido.

## Validações novas e falhas preservadas

| Execução | Resultado efetivamente observado |
|---|---|
| Observador independente original | Reexecutado byte idêntico com saída redirecionada; demonstra predicado antigo sobre histórico. Inadequado sozinho para decidir sobre fonte corrigida; preservado |
| Runner antigo versus candidato, mesma falha na ferramenta | Antigo registra status1 e pula; candidato conserva0001 failed e cria0002 failed, sem próximo caso. Sem DB nessa fixture |
| 28 testes do candidato |28/28; mutante antigo23 pass/5 fail, incluindo assertion causal esperada; bytes restaurados e28/28 novamente. Não são56 casos diferentes |
| Probes independentes de checkpoint | Primeira execução8/10 por dois erros do próprio probe; corrigidos,10/10. Inclui cinco interrupções reais antes do rename, divergência evento/checkpoint e receipt p04 |
| PG17/JAR |6 casos: os três contratos originais, regressão de porta e recusa de terceiro passaram; probe de reuso imediato teve1 erro de bind. Total5 pass/1 erro,0 skips |
| PG16/JAR |3 casos: regressão de porta e recusa de terceiro passaram; probe de reuso imediato teve1 erro de bind. Total2 pass/1 erro,0 skips |
| PG17/imagem Linux |4/4: três contratos originais e probe de identidade/encerramento/reuso, sem falhas/erros/skips |
| Mutação do alocador antigo |1 assertion falha por porta ocupada,0 erros/skips; SHA restaurado; controle restaurado1/1 |
| Diagnóstico nativo de transporte | Primeiro wrapper falhou lendo encoding de log após observar o processo; fonte v1/saída preservadas. Segunda execução1/1 registrou processo ausente, nenhuma conexão/listener naquela consulta e reutilizou as duas portas anteriores. Não explica retroativamente o estado no instante dos dois binds falhos |
| Quiescência após interrupção | Wrapper próprio vivo durante0002 e Java/efeito tardio depois do resume: **RVPLA-03 confirmado**, sem DB/efeito financeiro |
| Preflight real PG17 |1 assertion causal detectou mutação; inputs restaurados. Resume reutilizou sem Maven, checkpoint idêntico; audit scoped passou. Java ativo bloqueou antes da tentativa; observador diferente recusado |

Sem soma entre rodadas sobrepostas, mutações, wrappers diagnósticos e casos
financeiros. Não foi repetida a suíte financeira integral ou frontend/E2E: o
delta não toca suas fontes/configurações.28 testes modelam quiescência por callback;
o probe independente do wrapper testa a completude da verificação real.

O probe de reuso imediato foi mantido falho, sem relaxar assertion. Uma consulta
posterior mostrou as portas livres/reutilizáveis; não há amostra do estado TCP
no instante original para afirmar TIME_WAIT. A correção da reserva dinâmica não
depende de reutilizar imediatamente um número fixo. O encerramento da execução
foi conferido ao final por consulta, não apenas pelo envio de stop.

Falhas dos probes da revisão: expected incorreto de retorno em vez de exception;
receipt legado sem campo reports, que foi recuperado de seu comando original;
leitura UTF-8 estrita de log de ferramenta com outros bytes. Critérios causais e
timeout40s não foram alterados. Logs intermediários permanecem em execucao/.

## Produto, pacote e evidências

JAR p05: produtor dos inputs24844b594e4ed8fe906e0fc6eaee32bdd58f31a0,
SHA-256 **b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b**.
Imagem local ID8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1.
Os contratos JAR/imagem acima executaram esses artefatos anteriores. Maven test
compilou classes/probes da cópia; não gerou novo pacote aprovado, não atribui build
ao HEAD documental e não demonstra reprodutibilidade binária.

831 inputs preservados do p05 conferem. Exportação nova832, todos restaurados;
contra p05 mudam somente AdoptionRuntimeTest e a nova AdoptionPortAllocationTest.
Nenhum diff de src/main, migrations, queries, pom/Dockerfiles, frontend ou CI no
intervalo revisado. O agent diagnóstico externo não compõe o produto.

162 artefatos originais/coletados da revisão e saneamento anteriores foram
reconferidos por SHA; timelines HQL foram recalculadas nos logs brutos. Nova coleta
tem93 artefatos com SHA original/coletado e sanitização explícita. Decodificação
de log pode substituir bytes não UTF-8; originais externos permanecem íntegros.
Checkpoints coletados são leitura, não recibos portáveis para resume. Três nomes
novos precisaram encurtamento após recusa de staging por caminho longo; mapa e
hashes em coleta-ajuste-caminhos.json, sem alteração do original ou bytes coletados.

Preservação inicial/final cobre2.870 arquivos,29 históricos,16 migrations,
manifests, falhas de startup e p05. README raiz mantém
6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA,
fora dos commits. Runtime novo revalidacao-20261027-01 e subdiretórios permanecem
externos. Nenhum clean/reset, limpeza geral de target ou reescrita de prova antiga.
O snapshot final foi feito após o commit de provas af73bbd e antes do commit de
parecer/estados. A entrega identifica o HEAD final; não se tenta inserir no próprio
commit um hash autorreferente. As consultas finais reconferiram também os162
originais/coletados anteriores e o JFR Linux, sem novas execuções de produto.

Nova ressalva histórica: a afirmação genérica anterior de cinco contraprovas
causais p04 não se sustenta para readiness, cuja falha precedeu o efeito. O aceite
local de saúde usa a contraprova independente estreita e controle restaurado,
preservados; a prova p04 ambígua não recebe sucesso por herança.

Sem nova auditoria Railway/Vercel, acesso ao DB real, alteração remota, push,
merge, CI remota, ativação ou deploy. [Comandos](COMANDOS.md),
[resultados/hashes](resultados.json), [proveniência](base-proveniencia.json) e
[plano prévio](PLANO.md) permitem reproduzir o recorte em execução nova.
