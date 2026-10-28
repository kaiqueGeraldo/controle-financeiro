# Experimentos, correção e limites

Resultados por invocação, todos preservados em [resultados.json](resultados.json).
Não somar grupos sobrepostos como testes únicos. Teste diagnóstico verde pode
conter bind falho deliberadamente registrado como dado.

| Invocação | Resultado | Interpretação |
|---|---|---|
| historico-pg16 |2 testes,2 falhas,0 erros/skips|Startup ultrapassou40s nos dois métodos, antes de validar reuso/colisão; não reproduziu o TCP histórico |
| historico-pg17 |2 testes,1 passou/1 erro,0 skips|Mesmo BindException original no reuso; recusa do serviço alheio passou |
| diagnostico-pg16 |2 métodos passaram,0 falhas/erros/skips|Aplicação reusou após janela alterada; seis sintéticos cooperativos reusaram, sem depender do estado ser vazio |
| diagnostico-pg17 |1 método passou|Reuso após instrumentação mais lenta; não contraria o erro imediato |
| original-instrumentado-pg17 |2 métodos,1 erro/1 passou|Método original falhou com TCP próprio ainda presente; segundo método contém os dois sintéticos abruptos, ambos registrando bind falho |
| corrigido-pg16 |3/3,0 falhas/erros/skips|Dois probes originais byte idênticos + negativo de listener retido |
| corrigido-pg17 |3/3,0 falhas/erros/skips|Mesmos contratos e negativo |
| contraprova-bypass-pg17 |1 erro esperado|App antigo exato restaurou BindException, sem assertion removida; cópia restaurada por SHA |
| contraprova-inspecao-pg17 |1 erro esperado|Inspeção lançando erro explícito bloqueou close com IllegalStateException; sem INDEPENDENT_CLEANUP; cópia restaurada por SHA |
| corrigido-instrumentado-pg17 |1/1,0 falhas/erros/skips|Controle final restaurado: replacement do PID certo, conexão antiga recusada, alheio preservado e sockets finais vazios |

Não houve rerun automático ou retry de bind. A falha de startup não foi apagada
pelos controles posteriores, que validam a correção TCP. As três execuções com
assertions originais finais não são uma certificação estatística de disponibilidade.
Os refinamentos foram prefixados no PLANO; volume final limitado, sem busca de
verde por repetição indefinida.

## Ajuste de harness

Implementação local `b8b645d0`: somente `src/test` foi alterado no backend.
`App.close` preserva o caminho anterior para Docker, Linux e porta desconhecida0.
No Windows nativo com porta descoberta: deadline10s antes de destroy; se realmente
necessário force, budget5s como antes. Espera do processo e inspeção TCP usam o
mesmo deadline de sua fase. Atraso de inspeção não estende um retorno de sucesso.

`AdoptionNativeSockets` consulta externamente a tabela TCP e conta tuplas do
PID próprio relacionadas à porta. Sucesso exige consulta completa/exit0, JSON
válido, confirmação de inspeção e contagem inteira não negativa igual a0 dentro
do prazo. Consulta indisponível, saída inválida, timeout ou recurso retido lançam
erro. Não é tentado bind pela confirmação, não há cache, troca de porta, término
de detentor por porta ou alteração de SO_REUSEADDR/SO_EXCLUSIVEADDRUSE.

Somente se há tuplas próprias, nova amostra é feita, com cadência máxima100ms
entre consultas e teto do mesmo deadline. É espera por condição observável,
explicitamente anterior ao retorno de close; o bind imediato original continua
inteiro depois. Inspetor excedido é encerrado somente pelo próprio handle; há
limite2s adicional **para cleanup de erro**, nunca para certificar sucesso. Esse
limite e eventual falha de cleanup são visíveis, não prolongam startup40s.

Trade-off: uma consulta PowerShell/CIM adicional por close nativo conhecido,
com dependência de permissão/módulo local. Na captura final close levou
**2.452,8864ms**, dentro10s; bind iniciou0,1777ms depois e terminou em0,4037ms.
Não se afirma que o SO levou2,45s para liberar: essa duração inclui lançamento,
consulta e observação. Alternativas rejeitadas: sleep sem condição oculta a
fronteira; retry/troca de porta violam o probe; socket menos exclusivo abre
compartilhamento indevido. A consulta percorre a tabela de n endpoints, O(n)
por amostra, com custo de processo/I/O dominante neste recorte. Nenhuma query
financeira/N+1, arquitetura de produto ou timeout de startup foi alterado.

## Propriedade e restauração

Na captura final, API2064/nascimento12:56:11.056Z possuía LISTEN em61016 e cliente
Surefire5976. Após close, o replacement127.0.0.1:61016 pertence a5976. Uma única
requisição ao endereço antigo depois de fechar replacement recebeu
`java.net.ConnectException`. O alheio recebeu exatamente seu hit previsto e
respondeu UNRELATED; o método completo registrou
`INDEPENDENT_CLEANUP completed=true portReused=true unrelatedPreserved=true`.
A amostra posterior ficou vazia. Não há resposta UP da instância antiga.

Contraprova de causa, em cópia apenas: App corrigido SHA
`c34b7f918791606bd7ecbf737cce07ef1e02bbada61b76f9db36542531e7342f`
→ blob antigo `90473fc6224b486929e86affaf991b86733fd4aea530e1940e1127a57ac783ef`
→ mesmo SHA corrigido. Contraprova de inspeção: helper
`b32deceab79052d6cd44e078042e011948f933515b2716cc13d02a1e75751d28`
→ mutante `0efdc15683d4147ee61b2dcffee55ff1874be7008dc80e2d6d664ed22b344936`
→ mesmo SHA original. Recibos incluem fontes executadas e restauradas, sem mutar
o checkout principal. Controle final verde ocorreu depois das duas restaurações.

Auditoria somente por leitura, posterior a todos os atores: zero processos
associados, zero endpoints nas portas amostradas e zero containers ativos. O Java
preexistente do editor PID20288, com nascimento original, foi preservado. Não
houve kill de processos alheios nem limpeza de target/runtimes.

## Limites materiais

Windows11Pro10.0.26200/Temurin21.0.12.1/Docker Desktop29.6.2, PG16.15/17.11.
Uma amostra durante os controles mostrou CPU35% e memória livre5.340.396KiB;
não é série temporal nem causa comprovada das falhas de startup. Um agendamento
incorreto iniciou a compilação PG17 cerca de16s antes de acabar a invocação PG16;
os testes/atores PG17 começaram depois do término PG16. A sobreposição parcial
de compilação impede alegar isolamento de carga daqueles dois controles; suas
falhas permanecem. As demais invocações foram sequenciais e sem instalação/build
concorrente planejado. Não se usa essa observação como causa HQL.

Consultas são amostras temporais. Zero tuplas próprias não reserva atomicamente
a porta contra outros processos: a assertion original ainda pode detectar uma
colisão posterior. Dados históricos sem captura continuam sem estado retroativo.
Linux/Docker não foi reexecutado porque seu ramo de encerramento foi preservado;
nenhuma certificação nova de supervisor Linux ou SLA universal foi feita.
