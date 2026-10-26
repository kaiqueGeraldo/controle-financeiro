# Matriz de revalidação

| Item/condição original | Delta responsável | Prova independente atual | Decisão e limite |
|---|---|---|---|
| RCI034-01 senha JSON/Bearer/cookie originais | sanitize.mjs compartilhado | Mesmos bytes/SHA b59b7f23…; público sem as três sentinelas; bruto intacto | Sustentado nesses formatos |
| Caixa/espaços/escapes/múltiplos/nesting | visit JSON e textRules | JSON integral e objeto aninhado passam; mensagem JSON escapada em log com prefixo vaza | Residual RCI034-01/R1 P2, item não encerrado |
| Malformado sensível | parse JSON, detecção de aspa JSON incompleta | JSON inválido/JSON incompleto no texto bloqueiam; aspa textual incompleta é parcialmente redigida e publicada | Residual mesmo item; não exigir adivinhar segredo arbitrário |
| Diagnóstico/idempotência | transformação completa de arquivos | keep/status/count preservados nos controles; segunda coleta idêntica; o residual também é idempotente | Idempotência não prova remoção do segredo |
| Console e brutos | ci.mjs grava chunks privados | Runner falha 23 sem imprimir sentinelas, bruto contém o payload; coleta recebe arquivo completo | Barreira de subprocesso sustentada; não inferir logs Actions reais |
| Falha/reuso/coleta alternativa | pending→rename, destino novo, upload condicionado | JSON inválido exit 1 sem final; reuso recusado, destino anterior não alterado; coletor durável exercitado | Bloqueio estrutural sustentado; residual sem erro atravessa ambos |
| RCI034-L01 Job antes do filho | owned-process.ps1:25–38 | Leitura da ordem, controle ativo e erro de estabelecimento injetado em cópia | Sem janela de filho executando antes da associação; falha explícita sem fallback |
| UUID e isolamento | cancellation/cancel/pipe privada | UUID obsoleto ignorado, repetição/terminal seguros, caminho inexistente falha sem criar/alvejar processo | UUID não é autenticação; diretório local deve pertencer à execução |
| Filho/descendente/cancelamento inicial | Job/pipe/control.check | Handles retidos, ambos encerrados antes da expiração; porta liberada no probe, próximo gate ausente; runner 130 | Aceite Windows/processos |
| Morte abrupta do runner | EOF→supervisor termina→Job fecha | Probe original sem sobrevivência; novo teste com descendente e processo alheio | Aceite nesse cenário; result ausente é incompleto, não sucesso |
| Encerramento normal/filho já encerrado | propagação exit e fechamento Job | Exit 17/argumentos preservados; parent exit 0 e descendente encerrado; cancel tardio no-op | Aceite dirigido, sem exigir 130 de execução já terminada |
| Ctrl+C/Actions/Linux | handlers/grupo POSIX | Configuração inspecionada, evento real não executado | Pendência própria; não extrapolar Windows |
| Banco/containers após cancelamento | daemon fora do Job | Nenhum banco iniciado; sem prova nova de descarte externo | RCI034-L01 não encerrado irrestritamente; normal histórico preservado |
| Regressões ordinárias | runner/sanitizador/coletor novos | 8 testes, negativos 23/relatório/JAR, contraprovas e restaurações | Sustentado sem repetir suites financeiras |
| Aceite local/integral | DEC-CI-04/CF034 | Residual local confirmado; sem Actions ou pacote novo | Local não aceito; integral em_revisao |

RCI034-01/R1 é defeito confirmado local. Falta de prova de descarte externo é
lacuna delimitada, não banco abandonado demonstrado. Ctrl+C/Actions/Linux são
limites não certificados, não defeitos inferidos. A autoridade da DEC-CI-04 não
foi ampliada, e nenhum critério integral foi marcado por associação.
