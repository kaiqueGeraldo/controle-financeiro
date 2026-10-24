# CF-033 — Revisão adversarial integrada

**Revisão independente concluída em24/10/2026, com ressalva CF033-01/P2 aberta.
Candidato sem aprovação irrestrita; sem liberação de uso/produção ou sucessoras.**
Os quatro critérios da execução da revisão estão sustentados por provas ou
bloqueios explícitos, conforme a [matriz final](MATRIZ.md).

Execução iniciada em 23/10/2026. Base imutável examinada:
`bfb6c61d6b68e1da112eabf420634bb5b5e9127b`, integrada/publicada em main.
Branch exclusiva `codex/cf033-revisao-integrada`; commits desta revisão ficam locais.

## Objetivo, dependências e limites prévios

Confrontar requisitos/paridade, código e eficácia dos testes; executar casos novos
de arredondamento, concorrência, sessão e fuso, e mutações de realizado, owner,
parcela e idempotência. Revisão independente do candidato: nenhuma correção de
produto autorizada dentro da análise. Expected vem de SPEC-001/002/003/004,
DEC-09/10 e oráculos literais; conclusão anterior não substitui inspeção.

Dependências integrais locais integradas: CF-025 e CF-027, aceitas em 03/10 sobre
06c1a51 ([parecer](../revisao-CF-025-CF-027-RV24/README.md)), e CF-032 aceita sobre
864a3c7 ([parecer](../revalidacao-CF-032/README.md)). 794cb5b/bfb6c61 acrescentam
provas/parecer/estados, sem novo produto. A aresta CF-027 é somente a fronteira
intenção/recibo; CF-025 certifica queries nos volumes exercitados, não SLA.

Gate de desenvolvimento CF-033 satisfeito pela integração e aceites dessas
capacidades. Gate de aceite da própria revisão depende da matriz e das provas.
Gate de uso/publicação continua impedido por zoom nativo 200% CF-010/015,
adoção real CF-017/P01/P02 e homologação/desempenho não certificados.
DEC-ONB-03 libera especificamente desenvolvimento/revisão locais CF-031; não é
dispensa geral. CF-034 e demais sucessoras não são iniciadas nesta execução.

## Plano normativo anterior à execução

[Matriz](MATRIZ.md): critérios críticos devem ter teste eficaz ou bloqueio
explícito de liberação. Seleção concentra mudanças posteriores aos aceites e
interações; não repete todas as suítes nem soma reruns como casos novos.

Provas novas em PostgreSQL descartável/Flyway: centavos e pendente na virada do
ano, resto da última parcela entre anos, ownership da coleção, replay após novo
movimento, mesma intenção disputando commit e rollback com conexão bloqueada.
Navegador real/BFF/Spring/PostgreSQL: alternância de owners no mesmo contexto e
data civil em UTC+14; relógios nativos de animação preservados.
Quatro mutações somente na cópia isolada; baseline, falha causal e restauração
por hash, sem alteração dos expected/timeouts/skips.

## Preservação e integração

Origin confirmado: https://github.com/kaiqueGeraldo/controle-financeiro.git.
Fetch atualizado; origin/main=main=331d334 antes da integração, ancestral do lote
aprovado (0 divergentes/14 commits novos). HEAD bfb6c61 corresponde ao parecer;
864a3c7..bfb6c61 sem diff de produto. Branch CF032 publicada sem force; main
atualizada e integrada por fast-forward, depois publicada. ls-remote confirmou
ambas em bfb6c61; branch CF033 não existia local/remotamente e foi criada nessa base.
Staging inicial vazio; só README raiz preexistente modificado, sem diff no lote.
Trocas de branch preservaram-no diretamente, sem stash/restauração.
SHA-256 inicial e após trocas:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

Novos runtimes exclusivamente sob `../controle-financeiro-runtimes/CF-033/`.
Históricos e target preservados; sem clean, reset, exclusão de branches, banco
real, notificações reais ou deploy manual. Logs/reports novos terão segredos
removidos pelo observador; dados exclusivamente sintéticos.

## Parecer da CF-033

**C1 — atendido como revisão, com bloqueios explícitos.** Dinheiro/parcelas,
ownership, efeito único/rollback, cobertura e apresentação temporal têm expected
normativos e provas eficazes no alcance identificado. O progresso entre contas
do mesmo owner não conserva a garantia histórica irrestrita: [CF033-01/P2](ACHADOS.md).
O guard exclusivo de BUY bloqueia writer de outra conta do mesmo owner; PIDs/locks
reais confirmam a causa. Outro owner progride e saldos ficam corretos após commit.
O parecer CF032 já documentava essa serialização como custo. Falta reconciliar
formalmente esse alcance com DEC-10 e seu teste, sem retirar guard ou assertion
silenciosamente. Bloqueado aceite irrestrito dessa garantia, não reaberta CF032.
Zoom nativo200% e adoção real continuam gates de liberação separados.

**C2 — atendido.** Quatro mutações novas (realizado, ownerId, parcela e replay)
eliminadas por uma assertion pertinente cada, zero erros/skips. Before/after e
restauração SHA256 preservados; controle restaurado7/7. Nenhum sobrevivente oculto.

**C3 — atendido como relatório crítico.** P0=0/P1=0/P2=1/P3=0 no recorte; não há
aprovação irrestrita do candidato. Cenários omitidos, falhas e limites estão
declarados; não se infere segurança de produção pela ausência de P0/P1 no recorte.
Próximo passo é saneamento delimitado da incompatibilidade CF033-01, por decisão
contratual explícita ou redesenho comprovado da coordenação; alternativas e riscos
em ACHADOS.md. Nenhuma alternativa foi implementada nesta revisão.

**C4 — atendido.** Evidências e falhas preservadas, nenhuma alteração de produto,
expected afrouxado, timeout aumentado, snapshot renovado ou skip introduzido.
Dois erros novos de fixture e ajuste do observador de EOL estão documentados.

Resultados novos:7 casos backend aprovados no baseline/restaurado,3 jornadas
reais aprovadas (sessão A→B→A, civil/segundos/XLSX e fronteira local/UTC),74
controles históricos reexecutados com73 aprovações/1 timeout investigado e1 probe
causal vermelho por CF033-01. Não somar reruns/subconjuntos/harnesses. Build,
lint dos probes novos e tipagem aprovados. [Comandos e resultados](EXECUCOES.md).

## Engenharia e alcance

Transações/recibos mantêm commit único, ownership e ordem intenção→inventário→
fontes. Exclusividade estabiliza todo inventário/evidências; custa paralelismo
por owner. Não a remover para satisfazer um teste sem revisar a regra.
Inventário usa10 consultas por relação em lote, não uma por fonte; projeção e
materialização custam O(N+R+E), E podendo chegar a fontes×pendências. Ordenação/
hash são proporcionais aos dados/bytes; escritas continuam O(N+R). A certificação
acrescenta carga de inventário; não foi medido SLA/heap/carga de produção.
O reorder CF025 conserva1 SELECT+N UPDATEs no volume histórico examinado.

SourceReservationService reutiliza a projeção de domínio no pacote onboarding;
isso reduz duplicação das regras de incerteza, mas mantém acoplamento entre
serviços de metas/investimentos e esse loader. A fronteira CF027 certifica
especificamente intenção/recibo, não modularidade universal. Eventual extração de
porta de inventário é evolução separada, sem refatoração cosmética nesta revisão.

487 fontes de produto byte a byte iguais no repositório e nas duas cópias após
as mutações. Oito provas históricas conservam conteúdo aceito e hashes brutos
desde a entrada da revisão: checkout Git do fast-forward converteu LF→CRLF pela
configuração existente; análise e verificador distinguem EOL de edição.
README inicial/final mantém exatamente o SHA256 histórico, fora dos commits.
Runtimes preservados. [Manifesto final](preservation-final.json).

CF-033 constitui o marco de revisão independente, por isso fica **concluida como
revisão com ressalva**, sem confundir esse estado com aprovação integral do
candidato. CF034/035/036 continuam propostas/não iniciadas; não foi alterada sua
implementação nem pipeline. CF034 ainda exige CF015/zoom e seus demais gates,
além da resolução da ressalva de concorrência antes de um gate irrestrito verde.
DEC-ONB-03 conserva o alcance específico. Sem banco real, deploy ou notificações.

Commits desta revisão ficam locais; publicação/integração CF032 é a única
alteração remota desta tarefa. Intervalo publicado `331d334..bfb6c61`; candidato
examinado de produto `bfb6c61`, com deltas desde os aceites históricos explicitados
na matriz. Infraestrutura/provas e parecer/estados são separados nos commits.

Commits locais da entrega: `f8101d6` (infraestrutura/probes), `4204342`
(170 artefatos de provas, inclusive vermelhos) e commit posterior deste parecer/
estados. Staging de provas inspecionado por caminho; README raiz e produto fora.
As600 linhas de diagnóstico de whitespace pertencem a logs/relatórios brutos,
preservados como emitidos; scripts e documentação passam a inspeção pertinente.
