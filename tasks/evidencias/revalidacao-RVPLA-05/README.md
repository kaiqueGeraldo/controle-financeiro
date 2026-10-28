# Revalidação independente RVPLA-05 — 27/10/2026

**RVPLA-05/P2 permanece aberto:** as três execuções válidas do probe original
excederam 20 segundos. A cauda de saída gerenciada foi removida no recorte medido,
mas o ciclo completo ainda não recebeu aceite. **Correção da mailbox aceita** no
mecanismo causal testado; preflight, resume e audit PG17 limitados passaram.

Branch `codex/preparacao-local-adocao`. Base
`9c27881ca0506b0206c59d9e0e9fd1723efa83d9`; candidato
`019a6ce39fdb2e7182addedacc83fd634f9c778e`, intervalo `9c27881c..019a6ce3`.
HEAD inicial exato, ancestralidade/diff conferidos; somente README raiz alheio
modificado e staging vazio. Dois helpers existentes mudaram no candidato:
`owned-process.ps1` e `counterproof-supervision.mjs`. Nenhuma implementação foi
corrigida nesta revisão. Provas no commit
`98869a1d7db2068bce68d27b8800e7482d8a7281`; parecer/estados no seguinte,
identificado na entrega.

| Parecer | Decisão independente |
|---|---|
| A — RVPLA-05 | **Aberto/P2.** Cauda antiga localizada e reduzida, porém 0/3 no prazo original; observação diagnóstica natural de B em 21,167 s também excede 20 s |
| B — contenção/quiescência | Aceites específicos RVPLA-03/04 preservados, Windows/mesma sessão/criadores controlados. Fechamento e confirmação externa permanecem necessários; runner integral não aprovado |
| C — fixture alheia | **Categoria B: expiração natural antes da observação histórica.** Vida de 30 s contra verificação após pelo menos 42,709 s, exit0. Complemento controlado detecta término indevido; grupo completo original não ficou verde |
| D — audit/EPERM | **Correção aceita no mecanismo reproduzido:** antigo vermelho com EPERM/rename, restaurado verde; audit PG17 passou. Detentor e atribuição exclusiva da ocorrência histórica continuam desconhecidos |
| E — TCP/HQL | Permanecem separados e inconclusivos. Sem startup amplo, diagnóstico novo ou mudança do limite de 40 s |
| F — preparação local/adoção | Aceites locais anteriores mantidos em seu alcance. Prazo RVPLA-05 pendente; CF017/P01/P02, CF034 integral, expanded, zoom200%, configuração e gates reais preservados. Adoção/produção não liberadas |

[Latência e achado pendente](LATENCIA.md), [contenção e mailbox](CONTENCAO-AUDIT.md),
[fixture alheia](FIXTURE.md), [matriz](MATRIZ.md), [comandos](COMANDOS.md) e
[próximo passo](ENCAMINHAMENTO.md). [Plano prefixado](PLANO.md),
[resultados e mapa SHA](resultados.json), [inventário da rodada](runtime-files.json).

## Validações efetivamente executadas

| Grupo | Resultado / alcance |
|---|---|
| Probe original20s | Três pastas novas, prazo/assertions intactos, 3 falhas. Todos os resultados preservados; sem repetição para buscar aprovação |
| Contraprova/perfis de saída | Mutação direta parou antes da barreira do wrapper, sem provar B. Perfil gerenciado separado alcançou B e falhou no20s com caudas de ~2,25 s; fonte restaurada. Perfil nativo executado, caudas de ~9–12 ms; driver perdeu métrica agregada, falha preservada |
| Diagnóstico60s | Uma execução, B terminou naturalmente em 21,167 s, fonte restaurada, checkpoint failed e sem complete. Não aprova20s. Fotografia planejada no marco20s não foi capturada; trace monotônico localiza a fase sem inventar fotografia nativa |
| Checkpoints/resume/CI | 43/43, zero skips:28 core,10 independentes anteriores,5 consumidores CI locais |
| Broker | 4/4, incluindo owner/guardião morto, Job retido, filho/neto, processo alheio e outra execução legítima |
| Antes do filho | 1/1, sinal antigo após resume não pode criar filho |
| Handoff causal | Mecanismo antigo vermelho pelo mesmo oracle; fonte restaurada por SHA; corrigido bloqueia restore/complete/avanço e geração seguinte recupera |
| Inspeção/identidade | 2/2 inspeções e5/5 boot/recibo/PID+nascimento/sessão; sem kill por nome/porta/PID isolado |
| Canal/consumidor compartilhado | 2/2 canal: mutex e slot corrompido, recuperação em nova geração. Caminho sem Job nomeado preservou stdout/exit e fechamento dos handles |
| Probe completo antigo | Reexecutado uma vez com fixture/assertions originais; falhou no retorno20s antes da assertion de preservação. Não executou os cenários posteriores nem foi contado como verde |
| Complemento de fixture | Processo alheio vivo durante todo A/B, inclusive com probe20s falho. Oracle verde; encerramento antecipado simulado pelo teste detectado vermelho. Outra fixture terminou pela barreira explícita, exit0 |
| EPERM causal | Módulo antigo: EPERM/rename e oracle vermelho pelo motivo esperado; restaurado por SHA, verde mantendo leitor aberto |
| Protocolo adicional | Quatro casos registrados normalmente; quinto rejeitado e Job ausente, recuperado por recibos após erro do observador, sem novos atores; sexto ainda não iniciado executado uma vez à parte. Não se apresenta um script6/6 verde |
| PG17 real descartável | Preflight causal com1 assertion esperadamente falha,0 erros/skips; complete legítimo. Resume reutilizou prova, audit1 prova/0 novos testes, uma tentativa/SHA estável; observador divergente recusado |

Esses grupos se sobrepõem; não há total agregado de “testes únicos”. Não foram
repetidas suítes financeiras, PG16, API Linux, TCP ou HQL sem impacto pertinente.
As provas anteriores foram conferidas por hashes; não se herda um verde como
resultado desta execução. As falhas dos observadores e seus limites estão descritos
em COMANDOS.md, sem apagar as falhas do candidato nem promover diagnóstico a gate.

## Preservação e proveniência

Conferidos os **11.328 protegidos exigidos**, além das provas/fontes posteriores:
**14.475 protegidos** inicial/final,29 históricos e16 migrations. Os dois deltas
autorizados do saneamento foram comparados ao SHA final correspondente, sem
confundi-los com preservação byte idêntica da versão anterior. Produto/backend/
frontend sem diff no intervalo; não houve mudança de queries ou regras financeiras.

README raiz alheio SHA-256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`,
fora dos commits. JAR p05 intacto SHA-256
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`,
inputs produtores `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`. Sem pacote novo,
build atribuído a HEAD documental ou reprodutibilidade binária alegada.
Maven compilou apenas a cópia descartável para o preflight limitado.

Os834 inputs exportados do candidato estão restaurados. Coleção de1.602 artefatos
com SHA original/coletado e decodificação/sanitização declaradas;3.737 arquivos da
nova execução inventariados, inclusive binários de diagnóstico sem versioná-los.
Dois JSON deliberadamente inválidos preservados com bytes/hash e marcador.
Nomes longos compactados sem mover originais. Runtimes em
`../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rvpla05-20261027-01/`.

Auditoria final de leitura:153 recibos íntegros,152 Jobs com ausência certificada;
um recibo proposital de outra sessão sem certificado e um checksum propositalmente
inválido preservado. Zero processos associados e zero API containers rotulados
ativos; nenhuma terminação nessa auditoria. Isso não transforma recibo inválido
ou de outra sessão em prova de quiescência.

Sem limpeza destrutiva, alteração de implementação, banco real, Railway/Vercel,
CI remota, push, merge, deploy ou término de processo desconhecido. Limites:
Windows/mesma sessão, processos cooperativos; Docker Linux neste Windows não
certifica supervisor nativo Linux, daemon/SQL/WMI universal ou SLA de produção.
