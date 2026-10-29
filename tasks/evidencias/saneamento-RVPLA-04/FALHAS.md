# Falhas e limitações preservadas

- Original: diagnóstico0/contrato1 por efeito de descendente depois de complete.
  É a reprodução causal do defeito, não erro de infraestrutura.
- handoff-v1.mjs.txt: erro de sintaxe de expressão interpolada no novo driver;
  falhou antes de criar runtime/processos. Fonte v1 preservada; expressão foi
  calculada fora do template. Não é detecção causal de RVPLA-04.
- regression-01/shared.log: import relativo deixou de apontar para o repositório
  após realocar o script. Não executou o teste. A cópia seguinte usa import
  absoluto e diretório original da fixture; expected intacto, fontes/hashes
  originais e adaptados registrados, controle compartilhado passou.
- real-01: cmd recebeu argumentos com serialização inadequada ao passar pelo
  supervisor .NET; exit255, mensagem de sintaxe, nenhum JUnit. O runner recusou
  causalidade e registrou failed com fontes restauradas. Um adaptador Node dentro
  do mesmo Job conserva a serialização anterior do spawnSync. real-02 registrou
  a assertion causal esperada e foi auditado/reutilizado sem Maven adicional.
- broker-01: controle externo de mesmo nome terminou antes da assertion de
  preservação. A fixture própria espera20s; ele era criado antes do setup de
  outra execução e do alvo. Não se aumentou seu watchdog: em broker-02 os
  controles são criados junto à intervenção, depois de o alvo estar pronto.
  Mesmos expected por handles, incluindo ausência de associação ao Job alvo,
  passaram. O primeiro resultado permanece falho, sem atribuir sua morte ao
  supervisor com base apenas no handle sinalizado.
- regression-01/abandonment: o antigo observer espera exit do resume em20s
  totais, independentemente das etapas. O novo broker não terminou nesse prazo.
  O observer interrompeu sua própria tentativa;0002 ficou failed-before-completion
  com fonte mutante. Falha preservada; prazo e assertions não foram relaxados.
  Recuperação explícita posterior restaurou a fonte e criou0003 failed por JUnit
  ausente na ferramenta sintética. Histórico append-only mantém os estados
  interrompidos; os checkpoints atuais avançaram pela recuperação normal.
  Não se conta essa recuperação como aprovação do probe original.

As falhas intencionais identity/operational do grupo inspection-faults são testes
negativos: o expected é bloquear, manter a mutação e impedir próximo gate. O Job
retido é outro negativo: active0 com objeto ainda existente continua bloqueado.
As falhas antigas de bind e40s HQL permanecem nos diretórios antecedentes intactos;
neste lote não receberam diagnóstico novo nem foram reexecutadas sem hipótese.
