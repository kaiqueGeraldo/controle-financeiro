# Plano prefixado — 28/10/2026

Base conferida `3b245d9dd23e876700507718767827ea5e9f8a11`, branch original
`codex/preparacao-local-adocao`. Nova branch `codex/diagnostico-tcp-nativo`.
Único delta inicial: README raiz alheio, SHA histórico conferido. Sem AGENTS.md
físico encontrado na raiz, ancestrais consultados ou árvore; instruções fornecidas
na conversa e tasks/EXECUCAO.md/POLITICA-DE-TESTES.md aplicadas.

## Contrato anterior aos experimentos

`AdoptionRuntimeTest.App` lança diretamente a JVM do JAR preservado, sem wrapper
no modo nativo. Tomcat escolhe/reserva a porta real (`--server.port=0`), anuncia
no log exclusivo da instância, e o harness descobre essa porta. Não existe reserva
provisória nesse caminho aceito. `App.close` solicita destroy, espera até10s e,
se necessário, força somente o processo próprio e espera5s. Prontidão permanece
com orçamento40s. Banco descartável deve estar pronto e migrado antes do start.

O probe independente `PortLifecycleProbeTest`, introduzido na revalidação, exige
processo ausente após close e bind imediato de um `ServerSocket` em
`127.0.0.1:<mesma porta>`, com reuseAddress=true antes do bind. Também exige
resposta UP da aplicação, ausência de hits no serviço alheio durante a prova,
serviço alheio preservado e teardown dos recursos próprios. O reuso imediato é
assertion explícita desse probe, não requisito/SLO encontrado no produto. Essa
distinção normativa não dispensa nem altera a assertion. Família efetiva e opções
reais devem ser medidas; endereço Java IPv4 não prova família do handle nativo.

## Casos limitados, sequenciais, sem retries de bind

1. Dois controles históricos byte idênticos: PG16/JAR e PG17/JAR, somente os dois
   métodos PortLifecycleProbeTest. Sem repetir suítes financeiras/runner.
2. Processo sintético mínimo com conexão de cliente controlada: sem conexão,
   conexão aberta na parada, fechamento do cliente antes da parada; listener
   wildcard versus loopback e ServerSocket versus ServerSocketChannel apenas
   se necessários para discriminar a primeira observação (máximo6 casos).
3. Uma observação instrumentada PG16/JAR e uma PG17/JAR: PID/nascimento, UTC e
   nanoTime, socket antes/depois de close e bind; sem ampliar40s. Consultas não
   transformam erro de inspeção em porta livre; registram IPv4 e IPv6 e os dois
   lados das conexões. Uma consulta tem efeito temporal, não exclui corridas.
4. Se demonstrado defeito local, menor correção e contraprova em cópia isolada,
   com restauração/hash e controle final PG16/17 dos caminhos afetados. Caso
   contrário, nenhum remendo para produzir verde: registrar inconclusão.

| Hipótese | Evidência prevista | Experimento / enfraquecimento |
|---|---|---|
| Listener antigo/descendente | LISTEN com PID/identidade anterior | Estado/processo em close; ausência amostrada enfraquece, não exclui toda corrida |
| Socket do cliente/probe | Tupla com PID do observador após morrer a JVM | Cliente controlado, variar só ordem de fechamento |
| Estado residual do SO | Sem JVM/LISTEN mas tuplas residuais e bind falho | Captura rápida + controle sintético sem conexão |
| Família/endereço/opções | Resultado muda por uma propriedade mensurada | Comparar APIs/endereço sem relaxar exclusividade |
| Corrida de porta/concorrência | Outro PID ocupa porta ou serviço responde | Identidade das tuplas/controles; não encerrar terceiros |
| Falha da aplicação antes de bind | Sem marcador Tomcat/UP | Logs originais mostram ambos: hipótese enfraquecida para estas ocorrências |

HQL fica fora deste lote; no fim preparar próximo experimento condicionado aos
estados de rede conhecidos. Aceites RVPLA01/03/04/05 e EPERM preservados por delta.
Nada remoto, banco real, produto/migrations/pacote, política global ou timeout.

## Refinamento prefixado após primeira observação

Original PG17 reproduziu BindException; original PG16 falhou antes por startup40s.
Seis sintéticos com encerramento cooperativo passaram, inclusive com FIN_WAIT_2
e CLOSE_WAIT. As duas observações de aplicação passaram; a enumeração de
descendentes entre close/bind acrescentou aproximadamente55ms em PG16, portanto
não preserva a janela original. Não usar isso como contraprova do erro imediato.

Novos casos discriminantes limitados: dois sintéticos com destroy abrupto
(loopback/wildcard), uma cópia instrumentada do método original PG17 com somente
nanoTime primitivo entre os marcos e snapshots fora da janela. Nenhuma assertion
original é removida. Se ainda não discriminar, parar e registrar limite; não
executar laço indefinido nem adaptar opções de segurança.

## Causa equivalente demonstrada e validação da correção, prefixadas

A janela original PG17 voltou a falhar com listener IPv4/IPv6 ainda atribuído
ao PID morto depois de waitFor; ambos os términos abruptos sintéticos falharam
com LISTEN/ESTABLISHED ainda presentes. Não é evidência de TIME_WAIT. O retorno
do handle do processo precede a limpeza TCP do Windows. O harness usava somente
esse retorno como pós-condição de close e permitia o bind seguinte cedo demais.

Correção limitada: close nativo Windows/porta conhecida confirma ausência de
tuplas próprias via inspeção externa, compartilhando o mesmo budget10s (ou5s após
force) existente. Inspeção inválida/falha/estouro bloqueia; sem retry de bind,
alteração de porta/exclusividade ou mudança do caminho Docker/Linux/porta0.
Polling100ms só se a inspeção observou tuplas próprias, não é sleep de sucesso.

Validação limitada nova: originais byte idênticos PG16 e PG17 + negativo de
listener retido; instrumentação da propriedade do replacement somente PG17;
uma reversão exata da correção em cópia para contraprova PG17; uma falha explícita
de inspeção nessa cópia; hashes/restauração e controle final corrigido PG17.
Falha por startup40s permanece falha e não autoriza repetição indiscriminada.
