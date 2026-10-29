# Revalidação independente RVPLA-04 — 27/10/2026

**RVPLA-04 encerrado no handoff demonstrado. Runner sem aceite funcional integral:**
o gate legado20s falhou por regressão de custo (RVPLA-05/P2), e o audit real
falhou por EPERM sem causa operacional completa. Contenção segura e capacidade
de concluir dentro do prazo têm pareceres separados. Nenhuma correção implementada.

Branch `codex/preparacao-local-adocao`; base `3a6e95be68678e394cd718d9d688fab1fdc428ce`;
candidato `badecb55e45eb80eec6d7dc435b9afcfe4a8106d`, intervalo `3a6e95be..badecb55`.
HEAD/ancestralidade/diff/working tree conferidos, staging inicial vazio, somente
README raiz alheio modificado. Provas no commit `32d445e32c47ca16bd840aaa7b99fe46f919150b`;
parecer/estados no commit seguinte, identificado na entrega.

| Parecer | Decisão independente |
|---|---|
| A — RVPLA-04 | **Encerrado**, Windows/mesma sessão/criadores controlados. Handoff antigo vermelho; candidato retém mutação e bloqueia complete/próximo gate; nova geração só recupera após ausência dos Jobs |
| B — probe legado | **CategoriaC: regressão de latência no contrato global20s**. Base passa; candidato excede. Diagnóstico28,181s não aprova20s; limite intacto |
| C — RVPLA-03 | Aceite específico de abandono físico preservado por handles/Jobs e complemento sensível à violação antiga. Aceite funcional de retorno do resume20s limitado por RVPLA-05; não se reabre fuga de wrapper por associação |
| D — quiescência | Contenção/bloqueio/recuperação sustentados nos cenários testados. Não é garantia universal de daemon/SQL/WMI/host Linux. Audit operacional falho não é certificado; runner integral pendente |
| E — TCP/HQL | Investigações anteriores inconclusivas, bind nativo e estouros40s preservados. Sem diagnóstico novo ou aprovação por associação |
| F — preparo/adoção real | Aceites locais anteriores preservados no alcance próprio. RVPLA-05 e audit operacional pendentes; CF017/P01/P02, CF034 integral, expanded, zoom200%, configuração e gates reais continuam abertos. Adoção/produção não liberadas |

[Achados](ACHADOS.md), [timeout](ABANDONO.md), [Jobs e consumidores](JOBS.md),
[matriz](MATRIZ.md) e [encaminhamento](ENCAMINHAMENTO.md) detalham evidências/limites.

## Resultados efetivos, sem soma de sobreposições

| Rodada | Resultado |
|---|---|
| Original de handoff | Driver com única allowlist adaptada, fontes ancestrais redirecionadas por cópia; contrato byte idêntico vermelho por efeito após complete |
| Original contra bloqueio atual | Vermelho na pré-condição inputAfter=original, pois o bloqueio mantém mutant. Inadequação como oracle positivo demonstrada, sem editar o original |
| Contraprova/corrigido | Módulos antigos: mesmo oracle vermelho. SHA restaurado; corrigido verde, fonte mutante enquanto inconclusivo, sem próximo gate; recuperação0002 complete |
| Controles existentes |43/43,0 skips:28 checkpoints/resume +10 independentes anteriores +5 CI locais. São novas execuções, não43 novos testes |
| Broker |4/4: normal, owner/broker morto, guardião morto e Job de comando retido. Terceiro de mesmo nome e outra execução legítima preservados |
| Falhas de inspeção |2/2: identidade e operação desconhecidas bloqueiam restore/complete/avanço; geração seguinte recupera |
| Antes da criação do filho |1/1 por handles/Jobs, sinal antigo após resume não pode criar filho |
| Controles adicionais |2/2: mesmo-root concorrente recusado sem interromper primeiro dono; mailbox corrompida cancela árvore, conserva mutação e recupera em geração nova |
| Legado20s original | Base exit0; candidato exit1. Close de B7,711s versus20,903s após interrupção do observer, sem timeout alterado |
| Complemento diagnóstico | Base B7,985s; candidato28,181s, safety exit0 em ambos. Aos20s o gate permanece falho; nenhuma quiescência falsa ou sobrevivência de A |
| Sensibilidade do complemento | Versão vulnerável9bed5e2: wrapper vivo, Java após resume, safety exit1 pelo motivo ORIGINAL_ABANDONMENT_VIOLATION |
| Recuperação da fixture interrompida | Geração separada, estado final failed e fonte restaurada; cópia do checkpoint/input no timeout e traces originais preservados. Não é retry verde do gate |
| Preflight realPG17 |1 assertion causal esperada,0 erros/skips; complete e834 inputs restaurados. Resume declarou reutilização verificada, uma tentativa, sem novo Maven |
| Audit/identidade | Audit falhou por EPERM substituindo mailbox, sem retry e sem certificado. Identidade divergente testada separadamente, recusada com SHA do checkpoint idêntico e nenhuma nova tentativa |

43,4/4,2/2 e1/1 repetem contratos de identidade/cleanup/resume; os adicionais
também se sobrepõem parcialmente. Diagnóstico60s não soma testes de sucesso nem
substitui20s. O original de handoff e o complemento têm papéis explicitamente
distintos. Não houve repetição de suítes financeiras, PG16/API Linux, TCP ou HQL
sem impacto/hipótese que a justificasse. Provas anteriores foram reconferidas.

## Produto e preservação

JAR p05 intacto: SHA-256
**b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b**,
produtor dos inputs `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`. Nenhum pacote/imagem
novos ou build atribuído a HEAD documental; sem reprodução binária alegada.
Maven test compilou a cópia descartável; classes de diagnóstico não são
artefatos de release. O JAR anterior não foi recompilado nesta revisão.

Backend/frontend sem diff no intervalo; queries/configuração de produto e16
migrations intactas. Delta é supervisão/observador e provas.834 inputs exportados
do candidato final restaurados;831 p05/manifests preservados. Fixtures de falhas
conservam cópias de mutações anteriores e histórico, sem promover seu status1.

Conferidos os5.854 arquivos exigidos, mais saneamento/cópias/fontes atuais:
**9.554 protegidos** inicial/final, incluindo1.834 artefatos antecedentes,29
históricos,16 migrations, JAR/manifests, checkpoints/runtimes e falhas. README
raiz SHA `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`,
fora dos commits. Sem clean/reset ou limpeza geral de target.

Nova coleta:877 artefatos, SHA original/coletado e sanitização/decodificação
explícitos. Nomes longos compactados sem mover originais; uma mailbox propositalmente
inválida tem bytes/hash declarados, não é JSON validado nem certificado. Auditoria
final de leitura:79 Jobs ausentes com owners encerrados; zero processos associados
e zero API containers rotulados ativos, sem terminação nessa auditoria.

Runtimes em revalidacao-rvpla04-20261027-01 e subdiretórios. Logs/versão1 do
observador de timeout preservam erro próprio de sintaxe antes de criar atores.
A primeira gravação do analisador de custo foi bloqueada pela pasta externa;
apenas essa gravação foi autorizada em seguida, sem repetir testes. Isso difere
do EPERM de rename observado dentro do audit, cuja causa não foi determinada.

Sem correção de implementação, DB real, Railway/Vercel, CI remota, push, merge,
deploy ou terminação de processo desconhecido. [Comandos](COMANDOS.md),
[resultados e mapa SHA](resultados.json), [plano prévio](PLANO.md).
