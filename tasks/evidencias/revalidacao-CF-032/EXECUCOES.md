# Execuções, contraprovas e ocorrências

Execução independente em23/10/2026, interrompida por indisponibilidade da revisão
automática de aprovação por limite de uso e retomada a pedido do usuário.
Nenhuma ação bloqueada foi contornada. Não houve correção de produto.

Runtime novo: `../controle-financeiro-runtimes/CF-032/revalidacao-20261023-01`.
Prepare oficial copia somente fontes/configs/fixtures sintéticas; node_modules é
junction existente. JDK21, PostgreSQL16 descartável/Testcontainers, JVM UTC,
Playwright Chromium153, navegador São Paulo, relógio de cenário22/10/2026.
Manifestos `candidate.json`, `source.json` e `source-final.json` delimitam o candidato.

## Resultados sem somar conjuntos sobrepostos

| Execução | Resultado e interpretação |
|---|---|
| build | Aprovado; cópia isolada, sem mudar fonte de produto |
| integrated | Zero testes selecionados; filtro ancorado incompatível; wrapper vermelho preservado |
| integrated-02 |20 selecionados,19 aprovados/1 falha R2; inclui os14 desejados aprovados, mais A/F/T0/T1/T2; filtro amplo selecionou além do planejado |
| backend |99:95 controles aprovados e4 erros na fixture nova de CertificationProbeTest; não é suíte99 verde |
| certification |5 probes novos aprovados após correção estrutural da fixture;20/1/etc dos95 não foram reexecutados por rotina |
| components.log |54 em9 arquivos aprovados; incluem19 específicos, não54+19 |
| checks.json |lint/tipagem aprovados; build.log aprovado |
| mutant-certification |2/2 falham por token anterior≠inventário persistido, sem omitir assertions |
| restored-and-session |5 probes restaurados aprovados e RV6 aprovado;6 testes Java verdes (um é harness de1 jornada), sem somar novamente os5 probes |
| audit.json / artifact-verification.json |8 checkpoints,6 XLSX,3 bordas temporais, isolamento, hashes e contagens conferidos |

Os95 são a mesma seleção de13 classes declarada no saneamento, agora executada
independentemente no candidato. Incluem20 de capacidade,1 concorrência diária,
8 concorrência de onboarding e demais controles de reservas/cartão/metas/intenções.
Não somar as execuções históricas92/95, subconjuntos13+S5, nem os controles
restaurados aos casos novos. Um teste Java de harness encapsula várias jornadas:
não somar sua contagem Surefire à de Playwright como cenários financeiros.

R2 procura dois elementos com nome acessível `... null`: caracterização antiga,
preservada vermelha após o saneamento. S2 adapta exclusivamente a seleção para os
nomes legítimos, mantendo656 e dois UUIDs; L/K são provas originais normativas e
passaram intactas. Nenhuma afirmação de operação histórica no ativo errado.

Fixture inicial do novo probe tinha `gaps` em vez da estrutura SummaryAmount
(`value`, `knownSubtotal`, `outsideIndividualRange`, `missingPaths`); falhou na
validação antes de exercitar certificação. Versão preservada como
`CertificationProbeTest-initial.java.txt`. Correção foi da entrada sintética,
sem mudar expected de rollback/token. O quinto teste examina vínculo direto de
investimento: não cria reserva nominal/progresso e0,01 continua rejeitado.

O verificador auxiliar de arquivos teve erro de rótulo: procurava RECEITA EXCLUSIVA B,
mas a fixture H define EXPENSE/DESPESA EXCLUSIVA B. Ajustado ao cenário original,
mantendo exigência de presença própria e ausência cruzada; não houve alteração dos
arquivos exportados. Erros de consultas shell por wildcard Windows/caminho de
documento foram resolvidos por caminhos reais; não são falhas do produto.

## Sensibilidade

Oito arquivos originais conferidos por hash, incluindo journeys/support/config,
harness, oracle e R1/R2/R3. Vermelhos originais E2/K/L/C/R3 lidos nos relatórios da
revisão anterior e confrontados com os verdes atuais. Nenhuma troca de expected.

Quatro contraprovas históricas conferidas em `../saneamento-CF-032/counterproofs`:
retirar conhecimento→E2 aceita204/0,01; limite antigo→componentes10 falhas;
retirar fallback→componentes6 falhas; retirar segundos→R3 lê12:34. Baseline e
restaurado verdes, hashes dos5 alvos idênticos ao candidato; mutação difere.
Antecedem o delta do produtor CLOSE/ASSIGN; não são alegadas como teste desse delta.

Nova contraprova independente `mutate-certification.ps1` remove somente a chamada
de binding final de OnboardingOpenings no runtime. Dois casos CLOSE/ASSIGN falham
na comparação do token efetivo; `mutation.json` prova restauração byte a byte.
Probes positivos exigem adicionalmente revisão1, baseCURRENT_DECLARATION, ausência
de transações artificiais, histórico anterior intacto, capacidade após commit e
invalidação posterior sem renovar evidência. A falha SQL de certificação exige
rollback, não é mutação do produto nem erro ambiental contado como sensibilidade.

## Reprodução

1. `prepare.ps1 -RuntimeRoot <diretorio-novo>`; build no frontend copiado.
2. Acrescentar ao journeys.spec.ts da cópia R1/R2 e R3 originais, registrar
   `registerRemediationProbes`; acrescentar `session.ts` para RV6.
3. Copiar CertificationProbeTest.java ao pacote de testes onboarding da cópia.
4. `src/test/cf032/run.ps1 -RuntimeRoot ... -Evidence <novo> -Tests ... -Grep ...`;
   cada execution.json registra argumentos exatos efetivamente executados.
5. `audit.py <integrated-02> <saida>` e `verify-artifacts.py`; scripts não escrevem XLSX.
6. Contraprova somente no runtime dedicado, restauração em finally; confirmar487 hashes.

Limites: não aumentamos timeout/retry, não limpamos target, não apagamos falhas.
Runtimes históricos before/after/final/mutants intocados. Probes são finitos;
sem carga de produção, zoom nativo200%, banco real, deploy ou auditoria geral.

Inspeção de staging: os avisos de whitespace vêm dos logs Maven/Surefire brutos,
preservados como emitidos; scripts novos passam diff --check. Git inicialmente
quotou caminhos de screenshots com acentos, causando falso alerta no verificador
de prefixo; nova inspeção com core.quotePath=false confirmou252 provas, todas no
diretório autorizado. README raiz não foi staged. Commit de provas:794cb5b.
