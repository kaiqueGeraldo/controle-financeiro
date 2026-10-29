# Checkpoints e alcance do aceite

A identidade liga candidato declarado, SHA do manifesto integral, bytes dos três
módulos, seleção, major/imagem, Java/Node e hash de ambiente relevante. Mudança
recusa reutilização; o conteúdo efetivo dos inputs também é conferido. No caso
real novo, um comentário no observador mudou sua identidade e foi recusado sem
reescrever o checkpoint. Não há assinatura contra operador adversarial.

| Caminho | Prova / resultado |
|---|---|
| Preparação falha, observer lança, exit1 sem efeito | Tentativa falha preservada, restauração e nova tentativa; não libera caso seguinte |
| Mutação sobrevive, assertion errada, erro/skip/método errado | Observador recusa, não conclui. Exit/arquivo/contagens genéricas são insuficientes |
| Interrupção running/mutated/observed/restoration-pending | Backups/inputs conhecidos restaurados; nova observação. Owner vivo bloqueia |
| Restauração incompleta ou bytes desconhecidos | Fail-closed; não sobrescreve mudança desconhecida, não avança |
| Legado parcial, XML truncado, evidência ausente/alterada/estrangeira | Reobserva quando recuperável ou recusa quando ambígua; não importa status1 como conclusão |
| Candidato/config/observador diferentes | Identidade incompatível, sem mutação/reuso |
| Conclusão válida | Revalida hashes, resultado causal e todos inputs; preflight PG17 novo reutilizado sem Maven e sem reescrever receipt |
| Tentativa completa seguida de incompleta | Completa antiga não encobre a última incompleta |
| Processo Java ativo | Prova real nova bloqueou antes da tentativa, não matou processo desconhecido |
| Wrapper próprio ainda anterior ao Java | **RVPLA-03 confirmado**; guard incompleto permite restaurar/avançar, embora não promova a falha causal a sucesso |

Gravação: eventos append-only, checkpoint temporário exclusivo, fsync, rename.
Cinco interrupções reais de processo antes do rename, nos estados running,
mutated, observed, restoration-pending e complete, foram executadas. Temp/evento
mais novo não substitui checkpoint. Ausência do primeiro checkpoint bloqueia;
demais estados anteriores recuperam sem reutilizar conclusão. Não foi ensaio de
queda de energia, durabilidade do diretório ou de toda a semântica do filesystem.

28 testes do candidato passaram. O mutante do skip antigo teve23 pass/5 fail,
incluindo a assertion “recorded exit1 before causal effect” com true!=false;
restaurado28/28. Os28 repetidos são controles dos mesmos casos. Dez probes
independentes incluem cinco interrupções reais, evento/cp divergentes, bytes
parciais, evidência fora da execução, revalidação causal e receipt p04.
Sobrepõem contratos de interrupção/integridade/identidade dos28; a diferença é
o processo realmente terminado entre fsync/rename e a leitura dos dados históricos.
Os28 modelam quiescência por callback booleano: não provam que a consulta real
detecta todo recurso próprio. O wrapper tardio demonstra essa lacuna.

Custo proporcional ao runner local sequencial: leitura de histórico, inputs e
evidências, aproximadamente O(A·M+S+E) em tentativas, mutações e bytes. Fsync/hashes
acrescentam I/O e espaço por tentativa, preservando falhas; nenhum custo novo
de query/N+1, lock ou concorrência de domínio. Não justifica banco de checkpoints
ou coordenação distribuída. O trade-off atual é recusar ambiguidades e bloquear
outra preparação Java/containers de adoção; preservar terceiros é preferível a
encerramento por nome. A propriedade dos wrappers precisa tratamento explícito.

Quiescência observada no fim desta revisão: PIDs próprios ausentes, nenhum Java
de runtime/adoption e nenhum container de API de preparação ativo. Isso prova o
encerramento desta execução, não corrige retroativamente a janela reproduzida.
Não certifica cancelamento universal, outro SO, DB exclusivo ou drenagem real.
