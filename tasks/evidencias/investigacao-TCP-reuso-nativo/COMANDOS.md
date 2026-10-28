# Reprodução e rastreabilidade

Execução local Windows/PowerShell em28/10/2026. Escolher sempre runtime novo sob
o prefixo autorizado; os nomes preenchidos aqui são evidências, não destinos
para repetir comandos. Node foi usado apenas para preparar/executar/coletar.

```powershell
$run='../controle-financeiro-runtimes/preparacao-adocao/tcp-nativo-NOVA'
node tasks/evidencias/preparacao-local-adocao/prepare.mjs $run
node tasks/evidencias/investigacao-TCP-reuso-nativo/executar.mjs $run corrigido-pg16 16 'PortLifecycleProbeTest,AdoptionNativeSocketsTest'
node tasks/evidencias/investigacao-TCP-reuso-nativo/executar.mjs $run corrigido-pg17 17 'PortLifecycleProbeTest,AdoptionNativeSocketsTest'
node tasks/evidencias/investigacao-TCP-reuso-nativo/executar.mjs $run contraprova-bypass-pg17 17 'PortLifecycleProbeTest#ownedListenerEndsWhileUnrelatedReadyServiceSurvives'
node tasks/evidencias/investigacao-TCP-reuso-nativo/executar.mjs $run contraprova-inspecao-pg17 17 'PortLifecycleProbeTest#ownedListenerEndsWhileUnrelatedReadyServiceSurvives'
node tasks/evidencias/investigacao-TCP-reuso-nativo/executar.mjs $run corrigido-instrumentado-pg17 17 'PortLifecycleProbeTest#ownedListenerEndsWhileUnrelatedReadyServiceSurvives'
./tasks/evidencias/investigacao-TCP-reuso-nativo/auditar-recursos.ps1 -Runtime $run
```

Esperar **conclusão** de cada invocação antes da próxima, inclusive quando a
ferramenta retorna sessão assíncrona. O erro inicial de agendamento/compilação
sobreposta está declarado em VALIDACAO, não foi ocultado por repetição.

O executor seleciona Temurin21 em `controle-financeiro-backend/target/temurin21/`,
usa o JAR p05 por caminho absoluto e confere seu SHA a cada chamada. Maven com
`-Duser.timezone=UTC`, major16/17, seleção explícita, relatórios separados,
`-Dsurefire.rerunFailingTestsCount=0` e `test`. Argumentos exatos, instante UTC,
elapsed monotônico, exit e hash do log estão nos recibos. Não acessar banco externo:
Cf017PostgresSupport só cria Testcontainers com nome sintético e guard descartável.

As primeiras invocações `historico-*`, `diagnostico-*` e
`original-instrumentado-pg17` desta investigação foram feitas na exportação da
base3b245d9d **antes da correção**. Os mesmos nomes numa exportação de HEAD
corrigido não representam o estado anterior. Para contraprova causal reproduzível,
usar `contraprova-bypass-pg17`: ele extrai somente o App do blob exato3b245d9d,
executa em cópia e restaura a versão corrigida byte idêntica no finally.

Na primeira fase foram executados os dois métodos originais em16/17; depois
TcpNativeDiagnosticTest (seis sintéticos + observação16), uma observação17 e a
janela original instrumentada + dois sintéticos abruptos. Fontes dos primeiros
métodos estão no commit diagnóstico; `assertListener` foi adicionado somente
para o controle final. Capturas iniciais mais lentas foram preservadas.

O probe original canônico da revalidação continua byte idêntico. Instrumentação
é gerada só na cópia, preserva as assertions originais e salva fonte executada.
No controle final acrescenta identidade do replacement e uma requisição única
ao endereço antigo após fechar o replacement. As contraprovas registram hashes
antes/executado/restaurado e fontes a partir dessas rodadas. Seu exit esperado
vermelho não é erro de import, compilação ou indisponibilidade do banco.

Coletor e preservação foram executados uma vez nesta pasta de evidência e recusam
sobrescrita. Para outra revisão, usar recibos próprios; não reescrever os atuais.
O coletor confere833 inputs byte idênticos e o harness corrigido, inventaria todos
os arquivos e copia somente provas textuais, mascarando JDBC/token/password e
distinguindo SHA bruto/coletado. UTF-8 pode substituir bytes não UTF-8 dos logs
de ferramenta; os originais permanecem. `execucao/** -text` preserva bytes Git.

Sem instalação nova, rebuild do JAR, CI remota, banco real, push/merge/rebase ou
deploy. As chamadas com privilégio local atenderam escrita no runtime externo,
Git local e inspeção/Docker descartável; não houve rejeição final de aprovação.
