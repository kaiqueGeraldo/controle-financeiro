# Verificações proporcionais

Definição anterior às verificações executáveis:risco→teste→ambiente→evidência.
O roteiro `verificar.mjs` registra essa separação e preserva falha antes de sair.
Nenhuma alteração de assertion, timeout, retry ou seleção para obter aprovação.

| Risco identificado antes de executar | Verificação | Ambiente | Resultado esperado e observado |
|---|---|---|---|
| ConsumidorCI mantém contagens, propagação, pacote/sanitização diante dos helpers compartilhados |5 contratos ci.test+8 sanitize.test existentes | Node 24.18.0/Windows; TEMP/TMP somente no runtime novo; sem serviços |13/13, zero falhas/skips;[log](contratos-ci-sanitizacao.log). Não é teste financeiro |
| TesteTCPWindows é selecionado pelo workflow Linux e vira skip proibido | Seletor real smoke/expanded, condiçãoJUnit 6.0.2 sobre fontes originais e consumidores originais de relatório | Temurin 21.0.12.1+1/Windows; somente a condição recebe os.name=Linux; sem executar corpo/serviço/DB |101/116 classes, inclusão em ambos; 1 skipped; gate rejeita; controle sem skip aceita. **CPA-01 confirmado**, sem CI nativa Linux |
| Limite do leitor de evidência pode estar sendo confundido com parseJSON estrito |5 testes originais e 2 entradas inválidas específicas do parecer | Node/Windows, dados sintéticos em memória |5/5; 2 entradas aceitas indevidamente pelo streaming e recusadas pelo parser estrito; limite CPA-02 preservado |
| Errata de portas pode alterar interpretação de TCP | Conferência das 4 observations e ambiente-final histórico | Leitura de JSON/logs existentes |53120/53124/61591/60421; 64885 remotoTimeWait; corrigido só relato |
| Main/base ou branches exigem integração adicional | Fetchmain, merge-base, contagens, ancestralidade, árvores, lista de commits/delta | Git local+fetch leitura do remoto |main fb986456 é merge-base, 0/48; branches contidas; sem merge necessário |
| Pacote antigo atribuído aoHEAD novo | SHA do JAR p05, diff de inputs pertinentes, manifests por hash, inspect de imagem existente | Só arquivos/imagem local; nenhum container criado |JAR b296…/imagem8c102… mantidos; src/main/POM/frontend/releaseDockerfile iguais ao produtor; helpers/testes posteriores diferentes |
| Revisão afeta trabalho alheio/históricos |80 caminhos explícitos, README, 16migrations, references porhash; final por diff | Leitura sem restauração/limpeza |Hashes iniciais/finais iguais nos protegidos; inventário apenas44 artifacts novos de runtime |

Resultados em [verificacoes.json](verificacoes.json),[imagem](imagem-observada.json),
[material](material-git.json),[limitesJSON](leitor-limites.json) e preservações.
`runtime-files.json` enumera somente a nova execução, sem percorrer o acervo antigo.

## Reaproveitamento justificado pelo diff

| Provas anteriores | Por que continuam aplicáveis | O que não foi executado agora |
|---|---|---|
| Preparação independenteA/B/C/E:PG16/17, guard, manutenção, jobs, saúde, preview, pacote | Produto/POM/frontend/releaseDockerfile sem delta desde24844b59; hashes de manifests e arquivos relevantes preservados |74PG17/15PG16/BFF14/contraprovas HTTP-SQL/recursos22/imagem; sem nova suíte integral |
| Startup finalHQL | Não há delta de App.awaitStatus ou produto depois do candidato aceito; quatro captures e matriz final inalteradas |Nenhum startup, nenhuma suíte de 17 contratos; modosmaintenance/jobs/DB indisponível usam suas provas funcionais anteriores |
| RVPLA-01/03/04/05 eEPERM | Nenhuma modificação desses helpers depois dos aceites finais; TCP eHQL afetam outros arquivos; Git+hashes conferidos |Não repetir43 checkpoints/broker/handoff/probes20s/auditPG17 ou todas as contraprovas |
| TCP Windows/JAR/PG16/17 | Nenhum delta de helper/close apósb8b645d0 e revisãoed978c1d/c091abb8; erro é no consumidorCI, sem invalidar prova Windows |Não repetir bind/TCP/PG16/17; tuplas históricas continuam desconhecidas |
| Regras financeiras, ownership/onboarding e jornadasCF032 | Sem mudanças dessas regras/queries neste intervalo; recortes de manutenção e modo aberto já revistos |Não repetir finanças/E2E/EXPLAIN, N+1 ou matrizes históricas sem hipótese nova |
| Smoke remoto main eprobes sintéticosCF034 anteriores | Apenas prova histórica da revisão/main identificadas; workflow/scriptsintocados exceto helper Windows já revisado |Nenhum verde remoto herdado pelo candidato56eb80b5; sem inferir expanded/Windows-novo/supervisor Linux |

## Ocorrência do observador e reprodução

A primeira conferência material/leitor terminou esses dois recibos e falhou ao
inspecionar a imagem por acesso negado ao named pipeDocker. Classificação:
**ambiente/permissão**, sem produto em execução. O comando diagnóstico confirmou a
mesma restrição. A fase de imagem foi separada e executada com permissão adequada;
os recibos anteriores não foram sobrescritos nem os testes repetidos. A resolução
consta de [ocorrencias-verificacao.json](ocorrencias-verificacao.json) e
imagem-observada.json. Nenhum auto-review rejeitou a consulta.

Comandos locais efetivamente executados:

```text
node tasks/evidencias/consolidacao-pre-adocao/conferir.mjs inicial
node tasks/evidencias/consolidacao-pre-adocao/conferir.mjs git
node tasks/evidencias/consolidacao-pre-adocao/verificar.mjs ../controle-financeiro-runtimes/preparacao-adocao/consolidacao-20261028-01
node tasks/evidencias/consolidacao-pre-adocao/conferir-material.mjs
node tasks/evidencias/consolidacao-pre-adocao/conferir-material.mjs imagem
node tasks/evidencias/consolidacao-pre-adocao/conferir-material.mjs runtime
```

O quarto comando é a ocorrência falha preservada; material/leitor já existiam,
portanto não repetir sua fase. Depois das correções documentais:inspeção de diff,
staging explícito, git diff --check, checagem dos links novos e preservação final. Nenhuma
falha de gate CI foi saneada nesta revisão. A condição de encerramento de CPA-01
está em ACHADOS; uma nova implementação requer outra revisão.
