# Saneamento residual RCI034-01/R1 — CF-034

Entrega exclusivamente local sob DEC-CI-04, entrada `418a648ba06786f2d0d78a0ed03baf4df0dd1d6d`, branch `codex/cf034-ci-local`. **CF034 em_revisao; RCI034-01/R1 saneado localmente, aguardando revalidação independente dirigida.** Não há autoencerramento nem aceite local/integral por esta entrega.

As duas causas foram tratadas no sanitizador compartilhado: o caminho textual agora visita literais JSON de valores/mensagens, mesmo com prefixo; uma atribuição cujo valor começa com aspa deve ter fechamento verificável antes do fim da linha/arquivo, ou a coleta é recusada. Não há alternativa de valor sem aspas que possa esconder só o primeiro fragmento e liberar o sufixo.

- [Estratégia, precedência, escaping e limites](CONTRATO.md).
- [Comandos, antes/depois, contraprovas e regressões](PROVAS.md).
- [Entrada e hashes originais](baseline-inputs.json), [resultado original antes](before.json), [comando antes](before-command.json).
- [Provas após a correção, mutação e restauração](proofs.json).
- [Preservação final e rastreabilidade da execução](preservation-final.json), [auditoria local](audit.json).

Os 12 testes Node passaram, sem skips/retry. Os oito casos independentes originais passaram após a correção; antes e no mutante exatamente os dois resíduos violavam seus critérios. O contrato original de ausência de senha foi vermelho antes, verde depois e vermelho no mutante; somente seu caminho de entrada foi relocado, sem alterar a assertion. Publicação real não foi acionada: foi inspecionado o conjunto local selecionável pelos workflows e a coleção durável efetivamente gerada.

RCI034-L01 conserva o **aceite Windows/processos** da revalidação anterior: UUID, morte abrupta do runner, filho/descendente, bloqueio do próximo gate e processo alheio. Nenhum arquivo de Job Object/UUID/runner foi alterado; esses cenários não foram reabertos. Ctrl+C nativo, Actions/Linux e descarte de containers permanecem sem certificação. Workflows e coletores conservam sua política de publicação e condições, sem nova execução remota.

Nenhum pacote novo foi produzido. JAR histórico continua da fonte `a5ad7a64794abca1cc852b11cc1bf79a156dafde`, SHA256 `28b13d76da59cbfd1af7bd4df9456dd8705602f52fdcc4b868e8decc43d0e6d8`. A contraprova usa cópia e restaura seus bytes; não é compilação nem validação financeira pelos scripts novos. Manifests históricos e as57 representações brutas não reconstruídas permanecem intactos e não certificam uma execução nova.

README raiz preexistente permanece fora dos commits, SHA256 inicial/final `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`. Inventário de4.323 caminhos reconferido: alterações de implementação separadas dos históricos preservados. Runtimes novos somente CF-034/r101, r102, r103 e r104; nenhum runtime anterior alterado ou apagado.

Pendentes: revalidação dirigida de R1, CI/Actions/Linux e artifacts remotos, matriz ampliada, imagem/pacote remoto, zoom nativo200%/CF010/015, adoção real CF017/P01/P02 e aceite integral CF034. DEC-CI-04, DEC-ONB-03 e gates das sucessoras preservados. Sem push, merge, fetch, upload remoto, deploy, banco, emails/notificações reais, clean/reset ou limpeza de target.

Commit local da correção/testes: `32f4618`. O commit documental posterior acrescenta provas/estados. Intervalo de revalidação: `418a648..HEAD` desta branch. Conferência final:4.321 dos4.323 caminhos idênticos, duas alterações autorizadas de implementação (sanitizador e seus testes), zero ausentes ou divergências sem explicação.
