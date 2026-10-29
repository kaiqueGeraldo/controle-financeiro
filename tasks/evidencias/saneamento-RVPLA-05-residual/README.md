# Saneamento residual RVPLA-05/P2 — 28/10/2026

**Saneado localmente, aguardando revisão independente.** O probe original20s passou nas três execuções prefixadas em10,213 /11,560 /12,226s, margem mínima7,774s. O custo residual demonstrado era reiniciar/compilar probes e abrir comandos redundantes de ambiente. Foram15→9 consultas externas,5→3 comandos e21→13 lançamentos diretos pelo controller, sem cache ou observador permanente. [Caminho crítico, reconciliação e trade-offs](LATENCIA.md), [plano fixado antes da alteração](PLANO.md), [dados antes](tempos-antes.json) e [depois](tempos-depois.json).

Somente um arquivo existente de implementação mudou: `tasks/evidencias/preparacao-local-adocao/counterproofs.mjs`. Docker e CIM executam em ordem no mesmo checker, exigindo sucesso dos dois; a boundary fresca do broker substitui o current isolado que ela repetia. O broker continua aguardando close e lançando consulta **externa** para cada Job antes de responder. Root/worker, identidade PID+nascimento, sessão, mutex, baseline/creationCount, contenção, guardiões, probes, mailbox imutável e ProofStore não foram alterados. Um teste específico confirma que o filho não gerenciado bloqueia **antes de iniciar o checker**; omitir a última boundary em cópia fica vermelho.

Branch `codex/preparacao-local-adocao`; base informada/confirmada `acaa6ed9374f8c9a205d92955f0f4f946b17aa8a`. Provas/parecer anteriores `98869a1d7db2068bce68d27b8800e7482d8a7281` /acaa6ed9 e ancestralidade até019a6ce3 conferidos. Na leitura inicial só README raiz alheio estava modificado, staging vazio; a fotografia de preservação já registra a nova pasta própria de observação. Implementação/testes no commit local **e88ee50af24454f0393fdc1ed5321064387b79d2**; evidências/estados no commit seguinte, identificado na entrega. Intervalo para revalidação: **acaa6ed9..HEAD final da entrega**, com hashes completos na resposta.

## Estados separados

| Recorte | Estado entregue |
|---|---|
| A — RVPLA-05/P2 | Saneado localmente, **em revisão**;3/3 no original20s. Não encerra o achado por autoaprovação |
| B — RVPLA-03/04 | Aceites específicos preservados no alcance Windows/mesma sessão; novos controles dirigidos de contenção, inspeção e ordem passaram |
| C — audit/EPERM | Aceite causal anterior preservado por diff/hashes; canal/ciclo de vida intocados. Novo audit limitado do caminho compartilhado passou. Detentor histórico continua indeterminado |
| D — TCP/reuso nativo e HQL | Inconclusivos nos seus recortes;40s mantidos, sem investigação/aceite novo por associação |
| E — adoção real | Não liberada. CF017/P01/P02 e CF034 integral continuam em_revisao; demais gates e tarefas maiores permanecem próprios |

## Provas novas, sem somar grupos sobrepostos

| Grupo | Resultado e alcance |
|---|---|
| Linha de base antes de editar | Original passou por pouco19,674s,15 consultas/5 comandos. Margem0,326s não apaga as três falhas válidas do revisor |
| Perfil nativo isolado | Original falhou20s;13 chamadas completas particionadas,~86,3% em startup/compilação. Perfil censurado e overhead explícitos, helper restaurado por SHA; não é gate verde |
| Smoke funcional |11,326s,9 consultas/3 comandos; rodada distinta da amostra final |
| Amostra final prefixada |3/3,10,213–12,226s, amplitude2,013s; margem mínima7,774s. Mesmos marcos/assertions, sem retry, warmup artificial ou seleção de melhor |
| Contraprova do custo | Somente função/import antigo recolocados:15 consultas/5 comandos,18,564s. Também passou20s nesta observação; prova estrutural/caminho crítico, **não** negativo global forçado. Fonte restaurada por hash |
| Ambiente antes do efeito | Docker com container aparente, erro Docker, JVM ativa e erro CIM:4 bloqueios, sem Maven/mutação/complete. Remover cada check em cópia: mesmo oracle vermelho por efeito indevido. Falha Docker pré-efeito reexecutou sem skip e com uma primeira tentativa legítima/restaurada |
| Última boundary obrigatória | Filho Node não gerenciado após registro: bloqueio antes do checker. Omitir a boundary do broker em cópia: oracle vermelho, efeito indevido detectado; ambas as fontes restauradas |
| Confirmação fresca/gerações | Geração nova não avançou com arquivos de confirmação antiga quando inspeção atual foi negada; checkpoint SHA idêntico. Callback sintético que reutiliza o certificado antigo é detectado vermelho; restaurado, nova inspeção autoriza reuse legítimo sem tentativa extra |
| Checkpoints/resume/CI locais |43/43,0 skips:28 core,10 independentes anteriores,5 consumidores CI. Não são43 testes novos |
| Broker/Jobs |4/4: normal, morte de owner, morte de guardião, objeto Job retido. Parent/child/grandchild, processo alheio e outra execução legítima preservados; fechamento solicitado não virou confirmado |
| Antes do filho/handoff | Antes-do-filho1/1; handoff antigo vermelho pelo mesmo oracle, corrigido retém mutant/restoration-pending sem próximo gate, recupera apenas na geração seguinte. SHA restaurado |
| Inspeção/identidade |2 inspeções inconclusivas bloqueiam restore/complete/avanço;5 controles de boot/recibo/PID+nascimento/sessão. Não há kill por nome/porta/PID isolado |
| Canal |2/2: mesmo-root concorrente recusado sem parar primeiro dono; slot ativo corrompido cancela árvore, conserva mutant e recupera em nova geração. Só endereço observado adaptado ao protocolo já aceito |
| Complemento alheio aceito | ReviewForeign vivo durante A/B, mesmo oracle verde; término antecipado simulado **pelo teste na sua identidade exata** detectado vermelho. Outro exemplar terminou pela barreira explícita, exit0. Probe original control usado pelo complemento também passou |
| Preflight PG17 descartável | Uma assertion de mutação esperadamente falha,0 erros/skips; prova causal complete e834 inputs restaurados. Não é suíte financeira completa nem teste positivo de regra financeira |
| Resume/audit/identidade reais | Uma tentativa, checkpoint SHA idêntico; reutilização verificada, audit1 prova/0 testes novos, observador divergente recusado sem alteração ou tentativa extra |

O complemento de confirmação não afirma resistência a uma resposta forjada com nonce correto por um escritor malicioso: testa replies/slots antigos em seus namespaces/nonces e falha real da inspeção nova. A contraprova de cache altera só o callback sintético, não acusa o broker de cachear. O candidato de produção não introduz cache, reuso de conexão ou batching de identidades.

A fixture original Java30s e sua falha histórica/categorização por expiração foram preservadas; **não** se voltou a usá-la como prova de interferência. O grupo completo antigo não foi reexecutado nem promovido a verde. O complemento controlado aceito foi executado novamente. O teste causal EPERM aceito foi reutilizado com justificativa por diff/hashes porque canal/guardião/probe não mudaram; novo audit pertinente passou. Consumidor compartilhado sem Job nomeado e suporte Linux anteriores não são novos resultados desta rodada. As falhas/limites dos observadores anteriores continuam preservados, sem reabri-los por associação.

## Preservação e proveniência

Conferidos os14.475 inventariados e11.328 anteriormente exigidos, mais fontes/provas da revisão. Fotografia inicial/final com **19.841 protegidos**,29 históricos,16 migrations e todos os3.737 arquivos da execução independente anterior. O único delta corrente autorizado, counterproofs.mjs, tem versão anterior em Gitacaa6ed9 e nas cópias before-01; SHA antigo d761e0d490650bcbf8dd686ccefef608db02bb5e84c3c261cccaa401426398f7 e novo dbc0f1e0697f2e368ec1fa69c6078c5ae0ba2af18f962b7f9130870aad804da6. Não se apresenta essa alteração como preservação byte idêntica. Nenhum outro arquivo protegido teve mudança.

README raiz preexistente SHA-256 `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`, fora dos commits. Produto/backend/frontend/migrations sem diff. JAR anterior p05 SHA-256 `b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`, inputs produtores `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`. Nenhum pacote novo ou build atribuído ao HEAD documental; não se alega reprodutibilidade binária. Maven compilou apenas a cópia de teste exportada no commite88ee50a.

[Coleta e mapa SHA](resultados.json):13 runtimes novos,1.531 artefatos e[inventário de3.701 arquivos novos](runtime-files.json), incluindo521 binários locais de teste/compilação **somente inventariados**, sem versionar executáveis/classes/JAR. Hash original/coletado e decodificação/sanitização explícitos, nomes longos compactados sem mover originais. Mailbox corrompida e sua cópia textual retêm bytes/hash e marcador, sem certificado. Perfil negativo conserva checkout/checkpoint da interrupção para revisão, sem processo deixado vivo ou promoção de estado.

Auditoria final de leitura:150 recibos íntegros,149 nomes de Job ausentes;1 recibo proposital de outra sessão **sem certificado**,1 checksum propositalmente inválido preservado. Zero processos associados e zero API containers de preparo ativos. Auditoria não emitiu término e não transforma desconhecido em quiescente.

Sem clean/reset destrutivo, limpeza geral de target, banco real, Railway/Vercel, CI remota, push, merge ou deploy. Limites: Windows/mesma sessão/criadores cooperativos; aplicação Linux no Docker deste Windows não certifica supervisor Linux nativo, daemon/SQL/WMI universal ou performance de produção. [Sequência reproduzível](COMANDOS.md) e[encaminhamento restrito](ENCAMINHAMENTO.md). Nenhuma tarefa maior encerrada ou gate dispensado.
