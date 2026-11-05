# Preservação e encaminhamento

O snapshot inicial verificou 1.087 arquivos rastreados no candidato. A conferência final preservou os bytes de todos eles; esta revisão adiciona somente a própria pasta. Sem alteração de implementação, consumidores, requisito, gate, timeout/retry ou arquivos históricos.

- Principal: branch codex/saneamento-cpa01-selecao-testes, HEAD c16e6545488c8f13efda4dab9efa8aa896fcddaa; única alteração preexistente M README.md.
- Publicação limpa: branch codex/publicacao-limpa-ci, HEAD 1c4173f2e9a8bd459a9f2ecd4acf2d803245be88; limpa.
- Worktree revisada: branch codex/saneamento-pr3-expanded, inicialmente limpa em 0dbb67cc607e1f5b1b9881a24e039a0939facd46. Os dois commits locais desta pasta avançam HEAD; conferir REGISTRO-FINAL.md e recibo Git privado.
- README principal: 6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca.
- README worktree: e7d3458fbd8ac227520be27996ce23c73e8c3be2086d8cfbd51ad59568f4cee0.
- 97 protegidos: 97 hashes exatos preservados.
- Manifest36: 36 registros preservados conforme hashes vigentes autorizados; sete originais arquivados conferidos pelos hashes before.
- Manifest1053: SHA 08e3a7dfdf1921a1113cecb8d4c77939714ede66446d0d0956594ef3eabce0ad; 1.051 arquivos sem diferença e dois deltas autorizados do candidato (helper e config). Ambos os originais continuam arquivados e verificados. Não se exige que esses dois arquivos coincidam com a implementação antiga.
- Snapshot de 1.067 arquivos antes do saneamento v2: 1.065 preservados; os mesmos dois deltas autorizados.
- Cinco probes originais: SHA conferido contra snapshot inicial e cópias byte a byte em originais/.
- Fontes executadas: 849 arquivos da cópia preparados por manifesto e novamente verificados. As mutações ficaram numa cópia separada e foram restauradas.
- Nenhuma worktree movida, .r3 recriada, limpeza de target, git clean, reset, remoção de runtime/migration/pacote histórico ou modificação de README alheio.

resources-final.json registra nenhum processo associado ao runtime/PIDs dos wrappers, nenhuma escuta nas portas 3107/3113 e nenhum contêiner em execução. A verificação foi somente leitura, sem encerramento forçado ou limpeza geral. Runtimes e evidências permanecem preservados.

## Estado atual e próximo lote

Esta decisão sucede os pareceres históricos que mantinham RR3-01 aberto por atribuição; não reescreve a história nem reaprecia os demais saneamentos. RR3-01/P2 encerrado no contrato comprovado. Não há correção de implementação proposta como condição residual.

Continuam pendentes zoom nativo (capacidade C, dois cenários não executados), AC-UI-001/CF010/CF015 e a certificação expanded integral. Próximo passo concreto é obter ferramenta/capacidade de zoom nativo e executar os dois cenários existentes; depois reconciliar os demais gates na matriz, sem tratar esses testes locais como CI remota ou aceite de merge. Nenhuma nova tentativa de zoom foi feita.

O resultado remoto histórico de 927 testes (921 passes, cinco falhas, um erro, zero skip), HEAD 1c4173f2e9a8bd459a9f2ecd4acf2d803245be88 e run 40873511911 permanece histórico. Não foi consultada nem executada nova CI remota e não se afirma que esse seja o estado remoto mais recente.

Sem push, atualização da PR, merge, hospedagem, deploy ou banco real.
