# Matriz independente por contrato

| Contrato | Prova | Decisão / limite |
|---|---|---|
| Handoff não pode autorizar restore/complete com filho ativo | Original/vermelho, mesmo oracle antigo vermelho/corrigido verde, checkpoint/source/filho e geração seguinte | RVPLA-04 encerrado no cenário Windows demonstrado |
| Command Job antes da criação de executável/filhos | Associação do guardião antes do adaptador;4/4 broker com filho/neto | Sustentado sob criadores controlados/CreateProcess |
| Desconhecido/erro não vira vazio/sucesso |2/2 inspeções tipadas, mailbox corrompida e audit EPERM sem certificado | Fail-closed observado; EPERM com causa pendente |
| Job vazio difere de ausente | Handle retido impediu closed/recovery até liberação | Bloqueio conservador aceito, sem afirmar processo vivo por objeto existente |
| Morte de broker/guardião/canal | Grupos reais e controle extra por handles/ausência de Jobs | Sustentado nos cenários; sem universalizar mecanismos de cancelamento |
| Identidade, terceiro e concorrência | Mesmo nome/outro root preservados; mesmo-root mutex recusou segundo dono | Sem kill genérico/PID isolado; protocolo do worker síncrono, sem multi-produtor arbitrário |
| RVPLA-01/checkpoints/retomada |43 controles e preflight causal/resume, falhas permanecem failed/pending | Aceite causal preservado; audit novo não aprovado |
| Abandono original RVPLA-03 | Complemento testa handles/Jobs antes de B e elimina tardio; vulnerável acusa violação | Aceite físico específico preservado, Windows/sessão atual |
| Retorno do resume em20s | Base7,711s; candidato timeout e diagnóstico28,181s | **RVPLA-05/P2**, custo viola gate vigente, sem ampliar limite |
| Preflight PG17/reuse/audit | Causal1/1 esperado, resume sem Maven; audit EPERM; identidade divergente recusada | Parte positiva delimitada; nenhum audit verde novo |
| TCP/HQL | Falhas anteriores/hash preservados, nenhuma causalidade nova | Inconclusivos,40s intactos, sem investigação ampla |
| Produto/pacote | Backend/frontend sem diff,834 atuais/831 p05 e SHA JAR/migrations | Aceites/proveniência anteriores preservados; sem build/reprodução binária de HEAD |
| Adoção real/CF017/CF034 | Gates reais não executados; nenhum checkbox integral encerrado | Não liberados; expanded/zoom200%/configuração/produção pendentes |
