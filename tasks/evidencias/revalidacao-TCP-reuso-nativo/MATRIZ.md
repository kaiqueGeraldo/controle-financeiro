# Matriz de contratos e evidências

Decisões A–F completas no [parecer](README.md). As contagens são por invocação;
provas complementares sobrepõem contratos e não formam um total de novos aceites.

| Contrato | Verificação nova | Evidência / limite |
|---|---|---|
| Candidato delimitado | Branch/HEAD inicial exatos, ancestralidade e diff conferidos | preservacao-inicial.json; três arquivos src/test no delta funcional; README raiz alheio fora do staging |
| Término não implica liberação TCP | App antigo exato em cópia, uma execução | original-window-pg17.json, receipt e XML da contraprova; processo encerrado, LISTEN do PID antigo e bind único falho |
| Liberação antes do retorno | Controle corrigido após restauração | corrigido-window-pg17.json; waitFor, deadline, confirmação e bind medidos separadamente |
| Bind imediato na mesma porta | Originais PG16/JAR e PG17/JAR, 3/3 cada | Dois métodos originais byte idênticos; bind 127.0.0.1, reuseAddress=true mantido. Controle instrumentado: intervalo de 0,1023ms, sem retry |
| Liberação/retorno dentro do prazo de sucesso | Inspeção compartilha prazo de 10s ou fase forçada de 5s | Código, markers e review-cases.json; close positivo 2,177s. Até 2s adicionais para limpeza em erro, sem certificação tardia |
| Consulta não renova prazo | Condição retida/lenta e listeners próprios | Mesmo deadline em todas as queries de cada chamada; quatro queries retidas em 1,8s, erro; inspetor lento interrompido |
| Falha de inspeção bloqueia | Contraprova de query falha e complementos | Erro esperado antes de bind; JSON parcial, sem confirmação, contagem negativa e erro explícito bloqueiam |
| Endereço/família | Snapshot da aplicação wildcard IPv4/IPv6; complemento em ::1 | Filtro não restringe endereço/família; bloqueia conservadoramente a tupla própria coincidente |
| Não LISTEN | Conexão ESTABLISHED mantida após fechar listener | Complemento confirma ausência de LISTEN e bloqueio por tupla própria; não prova que tal conexão impediria bind |
| Identidade e possível PID reciclado | Process original para término, PID/nascimento nos registros | TCP fornece PID, não nascimento. Reutilização real de PID não forçada; coincidência pode bloquear, sem autorizar kill de terceiro |
| Listener substituto | Filho original encerrado; JVM do teste ocupa mesma porta | Ausência de endpoints antigos confirmada, próximo bind único falha, substituto permanece aberto e aceita conexão |
| HTTP alheio não é prontidão | Dois métodos originais e controle adicional | Serviço UNRELATED sem hits indevidos; colisão explícita não aprova aplicação; alheio permanece respondendo |
| Observadores encerrados | Dezesseis inspetores no complemento e observador persistente | Recibos/telemetria sem inspetor vivo ao final; auditoria de leitura sem processo associado |
| Custo limitado | Frequência e tempos reais | Queries completas na ordem de segundos; respostas sintéticas espaçadas em 453–506ms; O(n) por amostra da tabela, sem busy loop observado |
| Histórico qualificado | XMLs PG16/17 originais reexaminados e preservados | Configuração, porta, método e exceção conhecidos; tuplas/tempos TCP antigos desconhecidos. Sem diagnóstico automático de TIME_WAIT |
| Produto/pacote | Inventários e SHA inicial/final | JAR p05 anterior; 16 migrations, 29 históricos, README raiz e arquivos protegidos intactos |
| Isolamento | Runtime novo no prefixo autorizado | 836 inputs exportados/restaurados; 1.491 arquivos novos inventariados; 107 artefatos coletados, binários só por hash |
| Recursos ao término | Auditoria final sem terminação | Zero processos associados, zero endpoints nas portas amostradas e zero containers ativos; Java preexistente 20288 preservado |

## Reaproveitamento delimitado

| Aceite anterior | Base para manter o alcance anterior | O que não foi reexecutado/aprovado agora |
|---|---|---|
| RVPLA-01 | Sem mudança do protocolo de resume/checkpoint e dos caminhos corrigidos | Grupo de retomada causal anterior |
| RVPLA-03/04 | Runner, PowerShell, Job Object, broker/mailbox e confirmação externa byte intactos | Campanha de abandono/handoff; sem extensão para supervisor Linux nativo |
| RVPLA-05 residual | Sem alteração do caminho medido pelo probe sintético de 20s; fixture Maven não chama App.close | Probe completo de 20s e contagens anteriores; preservação por diff, não uma nova medição de latência |
| Audit/EPERM | Caminho de leitura/rename/fechamento de handles intacto | Audit PG17 e negativos EPERM; sem nova atribuição do detentor histórico |
| Demais aceites locais | Produto/frontend/migrations/CI e pacote sem delta | Suítes financeiras completas, acessibilidade expanded/zoom 200%, configuração e gates reais |
| Startup HQL | Não é implicação do aceite TCP | Inconclusivo, limite original de 40s e falhas históricas preservados; plano futuro em ENCAMINHAMENTO.md |

Sem regressão demonstrada nos caminhos afetados. O helper é conservador quanto a
tuplas próprias e não reserva a porta contra terceiros; erro pode retornar após
o deadline por limpeza do inspetor. Essas limitações compõem o alcance aceito.
