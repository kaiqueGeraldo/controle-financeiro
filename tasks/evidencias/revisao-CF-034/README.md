# Revisão independente CF-034 — 25/10/2026

**Recorte local não aceito nesta revisão. CF-034 permanece em_revisao.**
RCI034-01/P2 confirma sanitização insuficiente em logs elegíveis para publicação.
RCI034-L01 delimita a falta de prova de encerramento por cancelamento local.
Não se exige CI remota para julgar essas condições locais. As partes sustentadas
abaixo não são invalidadas por associação; nenhuma implementação foi corrigida.

## Candidato e autorização

DEC-CI-04: [decisão real](../../../docs/sdd/decisoes/004-liberacao-local-CF-034.md).
PROP-CF034-01: [proposta real](../CF015-zoom-gate-CF034/PROPOSTA.md).
Canônico: [CF-034-gates-ci.md](../../05-release/CF-034-gates-ci.md).
Foram lidos EXECUCAO, POLITICA-DE-TESTES, índice de tarefas, SDD e documentação
referenciada da entrega CF-034. Não foi encontrado AGENTS.md no repositório nem
nos ancestrais consultados; aplicadas as instruções AGENTS fornecidas pelo usuário.

Branch conferida: `codex/cf034-ci-local`. Entrada e candidato final examinado:
`64603a389400d31a981afba82e1e1cc4dd41c977`.
Base: `272001f7b4c39aebd18bdcd856109f9a0f6c1213`.
Intervalo contém exatamente 9fda00f, 83e84e6, 7fdbaae, 8bc4c51, 7ac7407,
a5ad7a6 e 64603a3. Na entrada, staging vazio e somente README.md modificado.
Não havia trabalho posterior ao HEAD informado. Commits desta revisão são
posteriores e exclusivamente de probes, evidências, parecer e estado documental.

README raiz encontrado com SHA-256
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
Não restaurado nem staged. A exportação original registra também documentos
modificados/não rastreados; **não era uma árvore original totalmente limpa**.
Runtimes anteriores foram somente lidos; novos probes em CF-034/rv01 e rv02.
Conferência final:3.165 arquivos inventariados sem mudança; mesmo SHA do README.
Commit local de provas: `3bcc155`. Parecer e estados ficam em commit separado.
Os15 arquivos staged de provas tinham identidade exata entre bytes e blobs.

## Parecer A–G

**A. Workflows e runner no alcance local:** sustentada a sequência compartilhada
de comandos, diretórios, seleção, fail-fast e segregação de relatórios novos.
YAML parseado e condições inspecionadas; isso não executa o workflow. Coleta
sanitizada e encerramento por cancelamento conservam as pendências especificadas.
O caminho `all` começa invalidando os recibos e roda todos os gates; o caminho
`package` é um reempacotamento permitido de gates anteriores, não uma nova rodada.

**B. Isolamento e E2E:** sustentados para a rodada 11 e as seis jornadas
A/B/G/H/K/L. PostgreSQL efêmero, namespace/schema próprios, 16 migrações reais,
Hibernate validate, browser/BFF/Spring/SQL reais, reloading e nova sessão
inspecionados. Não se estende esse aceite à matriz ampliada, zoom, ambiente
operacional ou a todas as suítes usando create-drop.

**C. Propagação de falhas:** sustentada para subprocesso não zero, relatório
obrigatório ausente, lint inválido, regressão temporal e adulteração do JAR.
Os três negativos históricos foram conferidos com suas causas e restaurações;
novos probes exercitaram o CLI real, sem Java/banco ou suíte financeira fictícia.
Cancelamento abrupto do processo pai tem limite separado RCI034-L01.

**D. Sanitização:** reprovada, RCI034-01/P2. Sentinelas mostram senha em JSON,
Bearer opaco e cookie mantidos no arquivo que o upload seleciona. Não há alegação
de vazamento real de segredo nesta revisão; nenhum segredo real foi usado.

**E. Proveniência:** aceita a rastreabilidade específica do JAR da rodada 11,
fonte a5ad7a6, 810 inputs, comandos e relatórios da mesma execução e hash
`28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8`.
Os inputs relevantes são equivalentes aos de 64603a3, que só acrescenta
documentação/evidências. Não rotular o binário como compilado de 64603a3,
nem como reprodução binária, imagem Docker ou pacote liberado para uso.

**F. Aceite local DEC-CI-04:** não concedido enquanto RCI034-01 não for saneado
e revalidado. Encerramento/cancelamento precisa de contrato local explícito e
prova dirigida conforme RCI034-L01. As aprovações parciais A/B/C/E acima permanecem.

**G. Aceite integral CF-034:** pendente. Execução Actions/Linux, efeitos reais
de eventos/needs/if/uploads/cancelamento, matriz ampliada, checks/proteção externa,
pacote remoto correspondente e imagem/uso não certificados. CF010/015 continuam
em_revisao por zoom nativo 200%; adoção CF017/P01/P02, desempenho em produção e
alcance DEC-ONB-03 preservados. Nenhuma sucessora iniciada.

## Evidência e próximo passo

- [Matriz por critério](MATRIZ.md), incluindo aceite integral e remoto ausente.
- [Achados, limites e reprodução](ACHADOS.md).
- [Workflows, runner, testes, isolamento e contraprovas](VALIDACOES.md).
- [Proveniência e hashes históricos](PROVENIENCIA.md).
- [Sanitização e encaminhamento condicionado](SANITIZACAO-E-ENCAMINHAMENTO.md).
- [Auditoria independente](audit.json), [probes](probes.json),
  [cancelamento](cancellation.json), [SQL/dependências/YAML](supplement.json).
- [Inventário inicial](preservation-before.json) e [conferência final](preservation-final.json).

Próximo passo concreto: saneamento separado de RCI034-01 e definição/prova do
cancelamento local. Depois revalidar somente o delta e seus mecanismos afetados.
A publicação revisada e execução remota controlada continuam sendo uma etapa
separada, dependente de autorização; não foram acionadas nesta revisão.

Não houve push, merge, deploy, acesso a banco real, notificação real, clean,
reset destrutivo, limpeza de target ou alteração dos manifests históricos.
