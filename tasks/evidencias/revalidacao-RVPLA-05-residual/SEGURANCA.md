# Contenção, confirmação e consumidores

Somente counterproofs.mjs mudou entre os helpers existentes. Guardião nomeado,
KILL_ON_JOB_CLOSE, criação antes dos descendentes, handles, mutex, identidade
PID+nascimento/sessão, baseline/creationCount, consultas e protocolo4 foram
comparados byte a byte à base aceita. Nenhum cache novo existe no candidato.

## Negativos pertinentes ao delta

- **Quatro condições de ambiente:** container aparente, erro Docker, JVM real
  da fixture e erro CIM bloquearam antes de Maven/mutação/tentativa/complete.
  Omitir o check Docker ou JVM em cópia permitiu efeito e foi detectado pelo
  mesmo oracle ENVIRONMENT_GUARD_ALLOWED_EFFECT. Fontes restauradas por SHA;
  os controles corrigidos não omitiram nenhum dos checks.
- **Falha pré-efeito reexecutável:** após erro Docker, a condição foi removida
  explicitamente; resume executou a primeira tentativa legítima, sem skip,
  terminou failed/restaurado e manteve identidade. É mudança causal da fixture,
  não retry silencioso para obter verde.
- **Última boundary:** filho Node não gerenciado após registro impediu até o
  lançamento do checker. Omitir só essa boundary no broker isolado permitiu
  efeito e o mesmo oracle acusou a violação. Ambas as fontes restauradas.
- **Confirmação fresca/gerações:** com certificado/slot de geração anterior e
  nonce antigo/aleatório presentes, inspeção atual negada bloqueou reuse, sem
  alterar checkpoint ou criar tentativa. Callback sintético que devolve o
  certificado antigo ficou vermelho por STALE_CONFIRMATION_ALLOWED_ADVANCE;
  restaurado e desarmada a falha, nova inspeção autorizou reuse legítimo.
- **Confirmação externa omitida:** contraprova independente manteve o objeto
  Job de comando aberto por handle de teste. Apenas no broker copiado, a query
  externa foi substituída por sucesso fabricado. O mesmo contrato de Job retido
  ficou vermelho: complete/fonte original foram observados indevidamente. Após
  restauração SHA, o mesmo controle reteve restoration-pending/mutant e bloqueou
  nova geração até liberar o handle; só então recuperou e concluiu legitimamente.

As últimas contraprovas demonstram sensibilidade a otimizações incorretas; não
acusam o candidato de cachear ou fabricar confirmações. O caso de Job retido
distingue objeto existente de processo perigoso vivo; ausência de processos não
basta para satisfazer o contrato de fechamento. Seleção de um cenário no driver
independente mudou só o conjunto executado, sem enfraquecer suas assertions.

As respostas continuam ligadas à raiz,runId,worker registrado e UUID novo da
solicitação. JSON parcial/duplicado/erro de auxiliar e outra execução não foram
transformados em quiescência. Os mecanismos de parsing/correlação e seus controles
anteriores foram preservados por hashes; os controles novos de confirmação,
canal, inspeção e identidade confrontam os consumidores atuais. Não se promete
resistência a escritor malicioso com acesso irrestrito capaz de forjar nonce e
processos do mesmo usuário. Não se declara defeito não demonstrado nessa hipótese.

## Integração e alcance

ProofStore pede verifyEnvironment antes de restaurar/reusar e no finally antes
de restaurar/concluir. Agora ele recebe resultado do checker agrupado somente
após boundary fresca, execução contida, close e ausência externa confirmada.
Falha/inspeção inconclusiva permanece erro; finally conserva restoration-pending
quando a condição não é demonstrada. Os controles de handoff e inspeção verificam
mutant, bloqueio de complete/próximo gate e recuperação em nova geração.

Processos alheios e outra raiz legítima foram examinados com os grupos dirigidos
e o complemento controlado já aceito. A fixture histórica Java30s e sua falha por
expiração permanecem preservadas; o grupo completo antigo não foi reexecutado
nem promovido a verde. O complemento usa barreira de término explícita e negativo
na identidade exata do processo criado pelo próprio teste, sem kill genérico.

EPERM causal anterior é reutilizado por diff/hashes: broker/mailbox/handles não
mudaram. Slots imutáveis não substituem arquivo aberto; erros não recebem sucesso.
O audit PG17 do caminho de ambiente alterado foi executado novamente. Detentor
histórico do handle continua desconhecido; essa lacuna não reabre por associação
o mecanismo causal aceito.

Limites dos aceites RVPLA-03/04 e EPERM continuam Windows/mesma sessão/criadores
cooperativos. Aplicação Linux em Docker sobre Windows não certifica supervisor
Linux nativo, serviço delegado, daemon/SQL/WMI universal ou SLA de produção.
TCP/reuso nativo e startup HQL permanecem separados/inconclusivos,40s intactos.
