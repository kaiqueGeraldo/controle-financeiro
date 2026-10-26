# Saneamento dirigido CF-034 — RCI034-01 / RCI034-L01

Entrega exclusivamente local sob DEC-CI-04, entrada `8d58207dff108066e2385eabde31330a3f79e38f`, branch `codex/cf034-ci-local`. CF034 permanece **em_revisao**. Correções e provas aguardam outra execução de revalidação independente; nenhum achado foi autoencerrado.

RCI034-01: política única para JSON e texto, coleta obrigatória antes de liberar arquivos, bloqueio de upload se a coleta falhar e brutos exclusivamente no runtime. RCI034-L01: protocolo de pedido por UUID e supervisão Windows com Job Object/pipe privada; cancelamento ativo encerra a árvore, impede novo gate e termina com status cancelled/exit130. O cenário original de morte abrupta do pai também foi exercitado, separadamente.

- [Fluxo, formatos e limites da sanitização](SANITIZACAO.md).
- [Contrato, mecanismo e limites de cancelamento](CANCELAMENTO.md).
- [Comandos, provas, falhas e contraprovas](PROVAS.md).
- [Hashes dos probes antes de editar](baseline-inputs.json), [probes originais reproduzidos](before-probes.json), [cancelamento original reproduzido](before-cancellation.json).
- [Rodada dirigida final](proofs.json), [suplemento de coleta/estado terminal/YAML](supplement.json). Rodadas e falhas anteriores são preservadas, sem somar reruns como casos novos.
- [Preservação e hashes finais](preservation-final.json), [inputs efetivamente exercitados e versões](execution-trace.json).

Não foi produzido pacote novo: o JAR anterior continua sendo da fonte **a5ad7a6**, rodada11, SHA256 `28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8`. Seus 810 inputs/relatórios permanecem no runtime original. Scripts de CI/coleta agora diferem: esse binário não foi compilado nem validado por estes scripts corrigidos. A contraprova de adulteração usa cópia, restaura seus bytes e não é compilação. Nenhuma reprodução binária alegada.

Os 57 históricos sem reconstrução continuam fora da sustentação do pacote da11; nenhum manifesto histórico foi reescrito. A cadeia independente anteriormente aceita permanece no seu alcance. As seis jornadas reais e gates de produto anteriores não foram repetidos nem invalidados por associação.

Pendentes: revalidação dirigida local, Actions/Linux (inclusive cancelamento, eventos, permissões, needs/if, checks e uploads), matriz ampliada, artifacts/pacote/imagem remotos e aceite integral CF034. A prova sintética de processos/porta não certifica descarte de containers do daemon Docker após aborto. Zoom nativo200%/CF010/015 em_revisao, adoção CF017/P01/P02, DEC-ONB-03 e sucessoras conservam seus limites.

README raiz preexistente fora dos commits; SHA256 inicial/final histórico `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`. Os 3.165 caminhos foram reconferidos: alterações autorizadas de código/estado são explicitadas, arquivos e manifestações históricas preservados. Runtimes novos somente CF-034/s01…s08. Sem push, merge, fetch, CI remota, deploy, banco, email/notificação, clean/reset ou limpeza de target.

Commits locais de implementação: `2b28e18` (sanitização/coleta) e `fa144e1` (cancelamento e probes). O commit documental posterior somente acrescenta evidências/estado. Intervalo para revalidação: `8d58207..HEAD` desta branch; hashes completos são obtidos no Git e o HEAD final é informado na entrega. A conferência final dos3.165 caminhos encontrou3.161 idênticos e quatro alterações autorizadas de código (runner, coletor público, workflow e coletor durável); nenhum ausente. As duas atualizações de estado ficam fora desse inventário antigo e estão delimitadas pelo diff.
