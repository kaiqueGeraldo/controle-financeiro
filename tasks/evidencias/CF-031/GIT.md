# Git, autorização e preservação

## Publicação e integração autorizadas

Destino confirmado: `https://github.com/kaiqueGeraldo/controle-financeiro.git`.
Base anterior main/origin-main `5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`.
Lote aprovado CF030: intervalo `5b8c4e0..00179d2` (11 commits), encerrado em
`00179d21b2b9a371c3b5f327c0509cd19310352c`.
Decisão documental separada:
`6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82`.

A revisão automática inicialmente não aceitou o anexo como autorização suficiente
para push. O humano respondeu à pergunta explícita de destino/lote/fast-forward:
“Autorizo publicar a CF-030 e a decisão, e integrar em main”. Após essa autorização,
branch CF030 publicada sem force, main local atualizada e integrada por
fast-forward, main publicada. Nenhuma divergência/conflito, rebase, PR, exclusão
de branch, deploy manual ou acesso a banco real. Eventuais gatilhos automáticos
decorrentes do push foram aceitos no pedido; não foram comandados nesta entrega.

Última conferência remota por ls-remote em21/10/2026:

```text
6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82 refs/heads/main
6d819aaeeb59c39e6e3f5e96dc59c50d9a7c2b82 refs/heads/codex/cf030-aplicacao-onboarding
```

Nenhuma ref remota `codex/cf031-onboarding-frontend`. A nova branch nasceu da
main integrada em6d819aa, não tem upstream e permanece exclusivamente local.
Único worktree usado: checkout original. Nenhum checkout/branch removido.

## Commits locais para revisão

- `fc786f365eb76e29e8f148bbb6b985e88563baef`: implementação frontend,15 arquivos.
- `5496fdd0afe695a7e600b48674fc6cd570d53e9b`: sete arquivos de testes/harness.
- O commit que introduz este arquivo tem assunto
  `docs(cf031): record evidence and hand off local independent review`;
  contém provas/limitações e estado em_revisao. Seu hash é obtido no histórico
  sem reescrever o próprio documento para incluir seu hash.

Intervalo completo para revisão: `6d819aa..codex/cf031-onboarding-frontend`.
Fontes finais testadas no manifesto621 arquivos `delivery-source-sha256.json`,
SHA256 `40B65C6CC50AEFD26C3A9D57CEB917AA3504D92C2BA87FD4ED7929CB7A4C2C36`.
`delivery.json` lista exatamente quatro diferenças do manifesto histórico:
Fields/Review (índices) e harness Java/spec E2E (jornadas ampliadas/observadores).
Produto final foi validado antes dos commits; staging explícito não altera fonte.
Lint/tipos/build/testes não foram repetidos por alteração somente documental.

Não há alteração de produto backend, migration, contrato aprovado ou evidência
histórica. Provas novas estão apenas na pasta CF031. Inspeção de diff/staging
exclui README raiz e runtimes. Logs brutos preservam saída de ferramentas;
espaços finais deles não são correções de produto. Diff-check completo retorna2
nos logs/snapshots brutos; fontes e documentos/scripts autorais retornam0.
Não reformatar evidência histórica para produzir diff-check artificialmente limpo.

## Preservação

README raiz ficou diretamente no working tree durante trocas de branch; blob
versionado era igual entre branches, sem stash/restauração destrutiva.
Hash inicial/final idêntico ao informado:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Permanece modificado e fora dos commits. `.cf22/`, `.cf22r/`, `.cf22s/` continuam
preexistentes/não rastreados, sem staging. Arquivos ignorados não foram forçados.

`preservation-before.json` e `preservation-final.json`:4123 arquivos do inventário
prévio CF030, zero ausências/diferenças; java/javac ignorados mantêm seus hashes.
Não houve clean, reset destrutivo ou limpeza geral de target. Builds criam seus
artefatos normais; relatórios de cada rodada foram copiados para nomes separados.
Cópias temporárias isoladas de baseline/contraprova e falhas anteriores preservadas.
