# Execuções reais, simulação e contraprovas

Os probes foram escritos antes da execução e operam somente em diretório novo
externo. Risco de cobertura: comparar identidades contra a seleção anterior à
correção. Risco de plataforma: executar o controlador no mesmo sistema da JVM.
Risco de relatório: testar consumidores reais e a criação de saída nova. Risco de
status: analisar o YAML atual e confrontar a semântica oficial de dependências.

## Execuções independentes

| Grupo | Ambiente e comando | Resultado / interpretação |
|---|---|---|
| Contratos do candidato | Node 24.18.0, Windows; node--test ci/suites/sanitize no export193916a1 |23/23, zero falhas/skips. Após as mutações, mesmos23/23; não46 casos únicos |
| Probes independentes | Node Windows; independentes.test.mjs, dados sintéticos fora do Git |7/7. Condições com outros nomes, alvo ausente/inválido, método/forma não suportada, relatórios e reuso |
| Original independente | verificar.mjs e CondicaoLinux.java originais copiados byte a byte, demais fontes do Git434e293f | Seleção antiga101/116,1skip, gate rejeita. JVM Windows21 com condiçãoLinux simulada; inclui os13 contratosCI/5 do leitor do roteiro antigo, sem somar como produto novo |
| WindowsTCP real | ci.mjs windows-native no checkout193916a1; Maven wrapper3.9.12, Temurin 21.0.12.1+1, Node 24.18.0 | Surefire1/1, zero falhas/erros/skips. Corpo/3s originais. XML bruto privado, hash em execucoes-windows.json; nenhum DB/JAR |
| ContratosLinux | Node 22.23.1 real em containerLinux/WSL2, mesmas três suítes de contratos |23/23, zero falhas/skips; diferença de Node 24 do workflow preservada como limite |
| JVM Linux antiga/corrigida | Temurin 21.0.12+8 real, fontes compiladas diretamente e JUnit 6.0.2 | Antiga:3 comuns+1Windows skipped, gate rejeita. Corrigida:3 comuns/zero skips, gate aceita. XML é ponte do resumo real JUnit, não Maven/Surefire |
| Workflow/status | YAML parseado com js-yaml4.1.1 e modelo de needs descrito no parecer | Falha/skipWindows propaga skipped ao required. Não executou Actions nem inspecionou rulesets remotos |

TopologiaLinux: hostWindows → Docker Desktop/engineLinux sobre WSL2 → container
Linux amd64, com controladorNode e JVM no container. Imagem JDK por digest:
`eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b`.
Node Linux foi reutilizado somente em leitura do runtime anterior, conferido por
SHA 93956de2…, e copiado para o runtime novo; origem e SHA completo no recibo.
Dependências JUnit/AssertJ/Jackson locais também foram rehashadas e copiadas.
Containers sem rede, sem porta publicada, sem banco; zero containers próprios
restantes ao final, conferidos pela labelUUID exclusiva desta execução.

## Contraprovas e restauração

| Contraprova | Como foi detectada | Controle/restauração |
|---|---|---|
| Reintroduzir seleção sem filtro por OS | União contém identidadeWindows indevida/duplicada; AssertionError do oráculo congelado | Hash exato restaurado; mesmo controle corrigido exit0 |
| Omitir DateUtilTest | Falta a identidade esperada no array anterior à correção; AssertionError | Hash exato restaurado; mesmo controle corrigido exit0 |
| Skip inesperado | requireBackendReports recusa skipped>0, mesmo com outra classe verde | XML sintético sem skip volta a ser aceito |
| Falha/erro de teste | Consumidor recusa contagens; nenhum skip artificial | Controle sem falhas/erros aprovado |
| XML obrigatório ausente | Identidade obrigatória sem arquivo é recusada | Adição do relatório correto aprova o controle |
| Seleção vazia/zero execuções | Contratos do candidato e probe independente recusam | Não se usa XML positivo para certificar seleção vazia |
| Diretório com evidência antiga | freshOutput recusa reabrir a saída existente | Nova saída externa aceita; saída dentro do checkout recusada |
| Windows falho/skipped no workflow | Modelo do YAML real demonstra required skipped, não reprovação explícita do gate | **R1 aberto**; não se alterou YAML para produzir um verde |

Logs de mutantes e SHA antes/executado/restaurado nos [recibos](execucoes-windows.json).
O oráculo é executado em outro processo após cada mutação, evitando cache de módulo.
Não houve alteração temporária nas fontes canônicas. Após os controles corrigidos,
sourceFor verificou novamente o manifesto da exportação; os 470 inputs atuais
coincidem com o snapshot testado e o mesmo digest do executor, independentemente
conferido. Nenhuma suíte financeira, startup ou campanhaTCP histórica foi repetida.

## Relatórios e correlação

A correlação não depende apenas de contagem positiva: seleção completa por
identidade, comando Maven com -Dtest e diretório Surefire explícitos, execução exit0,
relatórios de todas as classes selecionadas e contagens sem falha/erro/skip.
result.json contém candidato, digest, seleção, comando e hashesXML. Windows local
tem ci:null; isso é esperado e não cria identidadeActions fictícia.

O XML isoladamente não contém uma assinatura confiável de candidato/execução.
A garantia de atualidade do caminho examinado vem do runner: saída externa nova,
sem reutilização, comando próprio e fontes revalidadas. Não se amplia essa garantia
a XML copiado manualmente de outra origem ou inserido por agente externo depois
de criar a saída. A prova de reuso executada foi a tentativa de reabrir evidência
existente, que o runner bloqueia. Não é auditoria de filesystem hostil.

O coletor publicou somente o diagnóstico permitido, sem XML bruto de propriedades.
As pontesXML Linux não incluem ambiente; seus hashes ligam os resumos às JVMs reais
do recibo. Nenhuma aprovação do package/artifact remoto foi inferida desses dados.

## Comandos e ocorrência de retomada

```text
node tasks/evidencias/revalidacao-CPA-01/preservar.mjs inicial
node tasks/evidencias/revalidacao-CPA-01/executar.mjs ../controle-financeiro-runtimes/preparacao-adocao/revalidacao-cpa01-20261028-01
node tasks/evidencias/revalidacao-CPA-01/executar-linux.mjs ../controle-financeiro-runtimes/preparacao-adocao/revalidacao-cpa01-20261028-01
```

Os destinos e recibos são exclusivos. Para reproduzir, usar export novo das fontes
e dos scripts de prova sem copiar outputs gerados para a pasta de evidência, com
toolchain/JDK local explicitamente disponível. Não executar o verificador antigo
diretamente no acervo: ele escreve recibos; aqui sua cópia escreve só no runtime.

A primeira tentativa de iniciar o driver ficou impedida por indisponibilidade da
revisão automática por limite de uso. **Não foi executada**. Após a retomada pedida
pelo usuário, HEAD/README foram reconferidos e o runtime ainda não existia; a
execução então ocorreu uma vez. Não foi falha do candidato ou decisão de ação
insegura, nem retry de teste vermelho para obter aprovação. A falha cmd/Surefire
antiga do executor permanece preservada nas referências anteriores, sem reclassificação.
