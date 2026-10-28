# Prazo original e trabalho removido

O contrato mede B inteiro, do spawn observado pelo probe original até close,
com20s intactos. Inclui bootstrap, registros, checagens, comandos, restauração,
persistência, fechamento e última confirmação externa. O script inteiro também
compila a fixture e prepara/interrompe A; seu total não deve ser comparado a20s.
B começa com a mutação/checkpoint interrompidos, como exige o cenário original.

## Amostra independente prefixada

| Rodada | B natural até close | Margem para20s | Script inteiro | Consultas externas |
|---|---:|---:|---:|---:|
| prazo01 |15.083,9251ms|4.916,0749ms|33.698,6715ms|9 /7.052,5697ms |
| prazo02 |12.634,5410ms|7.365,4590ms|25.414,2531ms|9 /6.063,9517ms |
| prazo03 |12.287,4235ms|7.712,5765ms|26.367,8731ms|9 /5.892,9943ms |

**3/3 no original20s**, sem pedido de corte, seleção de rodada, retry ou aumento
de timeout. A margem mínima observada é4,916s; não se impõe a margem histórica
7,774s como requisito novo. Os resultados relatados pelo saneamento10,213/11,560/
12,226s foram preservados/conferidos; variam em relação a esta amostra. Não são
garantia universal, percentis, SLO de produção ou evidência de caches frios.

Pastas novas, mesmos Java21.0.12.1+1, Node24.18.0/libuv1.52.1 e fixture; Windows,
i7-13620H/16 lógicas. environment.json registra configuração/memória antes de cada
probe. Nenhuma aplicação de teste concorrente iniciada pelo revisor durante as
três medidas. Sem warmup artificial nem limpeza de caches do host. B lança seus
próprios guardiões/probes frescos, incluindo compilação de tipos; não foi retirado
trabalho obrigatório do intervalo. Appends da instrumentação estão incluídos, sem
desconto. As medições são de parede, não perfil exclusivo de CPU ou syscalls.

## Comparação estrutural e temporal qualificada

| Trabalho de B completo | Caminho anterior | Candidato |
|---|---:|---:|
| Invocações externas do probe |15|9|
| Jobs/guardiões de comando |5|3|
| Guardiões incluindo worker |6|4|
| Lançamentos diretos pelo controller |21|13|

`conferencia-independente.json` deriva contagens diretamente dos eventos de
lançamento e dos recibos, sem confiar apenas no resumo do implementador. Os21/13
somam invocações do probe e guardiões diretos; não representam toda a árvore:
checker ainda abre Docker e consulta CIM, e os adaptadores/ferramentas nascem
dentro dos seus Jobs.

A reversão isolada recolocou somente função/import anteriores, com SHA executado
idêntico ao arquivo de Gitacaa6ed9. Retornaram15 consultas/5 comandos/21 lançamentos;
os oito módulos copiados foram restaurados por hash. Consultas somaram10.391,1924ms,
contra5.893–7.053ms das três medidas atuais. Isso sustenta a redução estrutural e
de custo dessas etapas, sem inventar uma diferença exata entre durações completas.

A comparação antiga desta revisão **falhou no20s**: timer iniciou cleanup em
20.006,3897ms; o controller emitiu process-exit em20.008,2972ms. O probe não recebeu
evento close antes de sair e a consulta de identidade posterior encontrou PID já
encerrado. `resumeCloseMs=null`: dado censurado, sem margem/duração natural até
close disponível. Controller-exit não é substituto de close. Não houve repetição,
sleep artificial ou mudança de prazo para produzir esse resultado.

A comparação **histórica18,564s também passou20s** e continua positiva. Não foi
reclassificada como prova vermelha. O caminho antigo pode passar no limiar: a
aceitação do candidato depende do seu contrato e das garantias, não de obrigar
o anterior a falhar. A primeira versão do agregador independente presumiu close
disponível e falhou ao ler ns; fonte arquivada e leitura ajustada ao caso censurado,
sem novos atores. As partições completas em tools/tempos-depois.json cobrem somente
as três rodadas completas do candidato, com união de intervalos sem dupla contagem.

## Por que a redução é equivalente no alcance verificado

B chama verifyEnvironment duas vezes. Antes, cada chamada fazia current isolado,
mais Docker e CIM em Jobs separados; cada comando já fazia current fresco no
broker e closed externo após close. O current isolado era repetido pela boundary
do primeiro comando, sem efeito entre ambos. No candidato, a boundary imediatamente
anterior ao checker continua obrigatória; filho não gerenciado é recusado **antes
de lançar o checker**, como demonstra o negativo de omissão.

Docker e CIM são leituras executadas em ordem no mesmo checker, exigindo ambos
os sucessos. Seu único Job continua individualmente identificado; outro processo
externo consulta seu desaparecimento antes de responder. Remover seis invocações
do probe e dois ciclos de comando elimina inicialização/compilação repetidas;
não remove essas leituras nem certifica um Job por informação produzida dentro dele.
Não há cache, processo permanente, conexão reutilizada, paralelismo ou certificado
agregado de múltiplos Jobs. Os helpers de guardião/probe/broker/ProofStore e canal
permaneceram byte idênticos à base aceita.

Trade-off: os dois checks agora compartilham10s, em vez de dois budgets10s.
É mais restritivo, com menor discriminação operacional no erro agregado. Falha,
timeout, container/JVM ativa ou consulta inconclusiva bloqueiam; logs preservam
o motivo. Não se altera o contrato20s. Custo por chamada e roster seguem O(1)/O(p),
para p processos no roster, com histórico O(n) de requests e recovery O(r) de
recibos já existentes; não há delta de queries/N+1 ou
concorrência financeira. Não é necessário impor outra otimização fora do escopo.

## Ordem observada nas três rodadas

O cruzamento independente verificou checksum/raiz/runId/parentRunId, Job de cada
comando, requestId/sequence e resposta correspondente. Para os nove comandos
das três rodadas: close do guardião precede início da consulta externa closed,
publicação do recibo precede consumo do reply, e todas as confirmações precedem
a restauração final. Tempos finais:

| Rodada | Último restore | Checkpoint failed/restaurado | Confirmação externa final | Close de B |
|---|---:|---:|---:|---:|
|01|14.329ms|14.338ms|15.069ms|15.084ms|
|02|11.857ms|11.871ms|12.619ms|12.635ms|
|03|11.603ms|11.614ms|12.274ms|12.287ms|

A fixture de prazo não produz JUnit causal válido: B deve falhar na observação,
restaurar e deixar failed, nunca complete. Probe exit0 aprova esse contrato
sintético; não é aprovação de teste financeiro. Contenção e confirmação externa
continuam anteriores ao retorno; não foi transferido trabalho perigoso para depois.
