# Achados e condições de encerramento

## Situação vigente — CPA-01/R1 encerrado localmente

[Revalidação independente de81b20bca](../revalidacao-CPA-01-R1/README.md):
agregação requerida aceita no alcance local. Always/needs/invocação/exit1 conferidos;
500 combinações no avaliador real, CLI, estrutura YAML e7 mutações sustentam o
encerramento de R1/P2. Seleção e pacote preservados, sem novo achado confirmado.
Consolidação recebe parecer A para publicação controlada e CI remota; scheduler,
cancelamento e checks remotos serão validados na próxima etapa autorizada.
CPA-02 continua delimitado e não impede esse recorte. Não houve implementação.

## Histórico — revalidação independente CPA-01 de193916a1

[Parecer de193916a1](../revalidacao-CPA-01/README.md): a incompatibilidade original
de seleção está **encerrada** e a cobertura foi preservada. CPA-01 permanece aberto
somente pelo resíduo **R1/P2**, agregação de status: Windows falho/skipped impede
pacote, mas propaga skipped ao required, sem reprovação explícita do contexto.
[Reprodução estática, impacto condicional e encerramento](../revalidacao-CPA-01/WORKFLOW-REQUIRED.md).
Nenhum workflow foi corrigido na revisão; parecer C mantido por esse resíduo.

Os registros de CPA-01 a seguir são históricos da base56eb80b5, inclusive seu
estado aberto anterior. CPA-02 mantém separadamente o alcance diagnóstico já
delimitado, sem invalidar as capturas atuais conferidas.

## CPA-01/P2 — teste Windows torna o gate Linux necessariamente vermelho

**Aberto, confirmado; classificação: harness/integração de CI.** Introduzido no teste
de TCP em b8b645d0 e exposto pela combinação com o consumidor já integrado na main.
Não afeta o aceite do mecanismo TCP Windows/JAR ou regras de produto.

Caminho: `.github/scripts/suites.mjs:backendSelection` enumera todo `*Test.java`
não abstrato, exceto 15 históricos no smoke. Inclui
`com.controlefinanceiro.api.migration.AdoptionNativeSocketsTest` em smoke e
expanded. `ci.yml:jobs.required/expanded` executa em ubuntu-latest.
`AdoptionNativeSocketsTest.liveOwnedListenerCannotBeCertifiedReleasedOrTerminated`
tem `@EnabledOnOs(OS.WINDOWS)`. O resultado Linux é skipped; em
`.github/scripts/ci.mjs`, `requireCounts` recusa skipped>0. O gate backend é
anterior ao E2E/package. Sem outro saneamento, required não pode aprovar esse conjunto
no runner Linux; expanded depende dele e nem chega a executar.

### Reprodução executada

`node tasks/evidencias/consolidacao-pre-adocao/verificar.mjs <runtime-novo>`
usa os seletores reais: **101 classes smoke/116 expanded**, ambos incluem a classe.
Cópias byte idênticas do teste/helper foram compiladas com Temurin 21, JUnit 6.0.2
e dependências locais com SHA registrados. `CondicaoLinux.java` avalia a condição
real com `os.name=Linux` dentro da JVM Windows. O corpo de rede não executa:
**1 encontrado / 1 ignorado / 0 aprovados / 0 falhas**. O resumo foi adaptado ao contrato XML e
passado aos `junitCounts`,`requireReportedClasses`,`requireCounts` originais:

```text
backend: invalid counts {"tests":1,"failures":0,"errors":0,"skipped":1}
```

Controle de consumo com 1 teste/zero skips é aceito. Isso distingue o defeito de
uma falha do observador. [Recibo/hashes/comandos](verificacoes.json),
[saída JUnit](junit-condition.log). Não é execução nativa Linux ou Surefire remoto;
a seleção, condição JUnit e rejeição pelo consumidor foram executadas localmente.
Não é necessário ligar aplicação/DB ou executar toda a suíte para demonstrar
essa incompatibilidade determinística.

### Saneamento mínimo proposto — não implementado

1. Tornar a seleção consciente do ambiente de execução e registrar os contratos
   encaminhados a outro OS, sem convertê-los em verdes/dispensados.
2. Job Windows/JDK 21 executa o teste original e exige presença do relatório,
   execução real, zero falhas/erros/skips. Ele não precisa de banco para esse método.
3. Required Linux depende do job Windows e exige todos os relatórios de sua própria
   seleção aplicável, zero skips. Assim o pacote não é exposto antes da prova Windows.
4. Testes de seleção/consumo devem detectar ausência da classe em ambos os OS,
   duplicação/omissão, relatório ausente e skip inesperado. O conjunto deve cobrir
   explicitamente todas as classes anteriormente obrigatórias.

Arquivos previstos: suites.mjs, ci.mjs/contratos e ci.yml; ajustes mínimos de coleta
somente se necessários para o relatório/manifesto do novo job. Preservar teste,
assertions, 3s do cenário, 40s de startup, 10s/5s TCP e política de zero skips.
Não corrigir com `skipped===1` permitido, nova exclusão silenciosa ou remoção do teste.

Trade-off: partição explícita adiciona custo de job Windows e coordenação dos
recibos, mas mantém prova na plataforma correta. Portar inspeção de sockets para
Linux seria outra implementação sem necessidade demonstrada neste recorte.
Critério de encerramento: seleção completa comprovada, contratos locais dirigidos
aprovados e revisão independente do delta; comportamento real do novo job Windows
permanece critério remoto a validar depois de autorização. Até então parecer C.

## CPA-02/P3 — limite conhecido do envelope JSON do leitor diagnóstico

**Aberto para implementação futura delimitada; não é novo achado de produto ou
impedimento atual da preparação.** Origem: parecer final de startup e
`leitor-conferencia.json`. Reproduzido nesta revisão em
[leitor-limites.json](leitor-limites.json):

```text
{"recording":{"events":[{}]}
{"events":[{},]}
```

Ambos falham em JSON.parse, mas eventsFromChunks aceita um evento. Ele verifica
objetos/separadores internos e fechamento do array, sem validar todo o envelope.
Consumidores são análises JFR em tasks, não API, ProofStore ou sanitização de CI.

Impacto atual: as capturas não mudaram; a revisão anterior conferiu fechamento
completo, contagens com jfr summary e extração Docker por JSON estrito. Os hashes
dos manifests e recibos dessa conferência estão preservados. Não há demonstração
de medição atual inválida. Os 5 testes existentes aprovados não certificam JSON
geral estrito. Não reler 1,21 GB nem repetir startups apenas para essa ressalva.

Impacto futuro: entrada truncada/virgula final poderia ser tratada como completa.
Encerramento proposto em lote separado: estado de envelope completo, sufixo e
vírgula final estritos, casos adversariais nos limites de chunks, sem perder streaming
(tempo O(bytes), memória proporcional ao maior evento). Revisão independente deve
confrontar compatibilidade e arquivos reais. Não trocar por JSON.parse do arquivo
inteiro, que já excedeu o limite de string no histórico. Se nova evidência depender
de envelope não conferido, parar sua análise até validação independente/correção;
não ampliar o aceite do leitor por associação.

## Inexatidão documental corrigida

ANALISE/PRESERVACAO da investigação HQL citavam 53120/60421/53124/64885 como portas
da aplicação. Fontes conferidas: as quatro observation.json, ambiente-final.json
e parecer final. Ordem dos cenários: **53120, 53124, 61591, 60421**; 64885 é RemotePort
de uma tupla TimeWait local 60421/owner0. Errata só no relato; tempos, XMLs, logs,
resultados, manifests e recibos históricos não foram alterados. Não reabre TCP.
