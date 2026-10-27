# RVPLA-03 — recorte e critérios antes da alteração

Base9bed5e20f2cc46e4c7ae721ff2390054eb6db141; branch existente conferida; apenas
README alheio modificado, SHA histórico confirmado. Sem produto/DB real/remoto.

Reproduzir o probe original de wrapper tardio antes de editar. Destino novo
rvpla03-* é a única adaptação inicial ao script da revisão; critérios preservados.
Reutilizar o Job Object existente: uma identidade de execução deve abranger Node,
shells, wrappers e descendentes antes de qualquer trabalho. Não confiar em uma
consulta momentânea de Java. Tratar janela de criação/registro e morte do owner.

Critérios: Node interrompido antes/depois de Java; wrapper em barreira; descendente
adicional; retomada imediata; falha/cleanup parcial; registro ausente/incompleto;
normal e terceiro/outra execução preservados. Conclusão causal RVPLA-01 continua
separada de cleanup. Checkpoint antigo sem propriedade verificável deve bloquear.

Reuso de porta: examinar os dois binds falhos separadamente. Sem dados no instante
original não atribuir TIME_WAIT ou wrapper por associação. Controle discriminante
de TCP/processo/cliente e reuso, sem mudar o probe original nem forçar porta livre.
Preservar aceite anterior da reserva dinâmica e40s; HQL permanece inconclusivo.

Regressão proporcional:28 testes de checkpoints, probes independentes/cancelamento
compartilhado, wrapper antigo por mutação e controles PG16/PG17/JAR/imagem dirigidos.
Runtimes e provas anteriores preservados. Sem novo pacote de produto ou autoaceite.
