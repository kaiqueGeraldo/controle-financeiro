# Matriz de revisão

| Critério | Evidência | Resultado |
|---|---|---|
| Bases/ancestralidade/worktree | hashes completos no PARECER e recibo inicial privado | Conferidos |
| README principal e worktree | PRESERVACAO.json, recibos inicial/final | Preservados |
| Universo Java | SELECAO.json, comparação com64b0cb4 | 116 identidades iguais |
| Exceção RF15 | SELECAO.json, manifest/listagens reais A/C | A25=B2+C23; sem interseção |
| Fechamento diante de omissões/skips/proveniência inválida | CONTRAPROVAS.json; contratos e oito mutações | Rejeitados |
| Componentes Linux | COBERTURA.json; JSON/audit/eventos do candidato | 626/626 em71;29 recuperadas |
| Erro global não refletido pelo JSON | reporter-probe sintético real | JSON success=true; audit1; gate rejeita |
| Processo falha apesar do JSON aprovado | runner-propagation-02 | exit7; build/marker bloqueados |
| Caminho físico Windows | before/after preservados; subst-result; mutação | Aceito no recorte |
| Proveniência | PROVENIENCIA.json; manifest860; Git blobs | Conferida; nenhum JAR novo da rodada reprovada |
| Erros backend | CAUSAS-CONTEXTOS/CACHE-CONTEXTOS | 168 guard +622 derivados;29 chaves correlacionadas |
| Infra original Linux | PREFLIGHT.json | A–E passam; F reprova; G não executada; H passa |
| Alternativa Windows | PREFLIGHT.json; directed-02 | A–H passam; guard4 +consumidor5 aprovados |
| Cleanup | cleanup-final privado, hash e baseline8 | Recursos próprios removidos; alheios preservados |
| Expanded/backend/RF15/E2E/pacote integrais | limites e próximo lote | Pendentes; não aprovados |
| CF010/CF015 e zoom | decisão e parecer local | em_revisao; exceção temporária mantida |

Não houve correção de implementação nem nova execução integral. As falhas de preparo dos probes da própria revisão estão qualificadas em CONTRAPROVAS.json, sem alterar os resultados do candidato.
