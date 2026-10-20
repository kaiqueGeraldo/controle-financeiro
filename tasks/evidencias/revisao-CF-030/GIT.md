# Candidato, commits e preservação

- Branch: `codex/cf030-aplicacao-onboarding`.
- Base: `5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`.
- Candidato de produto: `89760e64a73b6268d8cf34745cf41d6b00dcd781`.
- Commit local de provas: `76580e18a9dd803ed2d970b56059c6a09061363c`.
- Parecer e estados: commit imediatamente seguinte, que adiciona este arquivo;
  seu identificador é informado na resposta final e consultável pelo histórico.

Na entrada, staging vazio; README.md raiz modificado e .cf22/.cf22r/.cf22s
não rastreados. Nenhuma alteração posterior de produto integrava o candidato.
O primeiro commit contém somente três classes de probes, dois runners e
evidências novas. O segundo contém parecer/matrizes e os estados da CF-030 e do
índice de tarefas. Staging explícito, com caminhos conferidos antes de cada commit.

O diff dos testes/runners não apresenta problemas de whitespace. Logs e XMLs
preservam espaços finais e linhas vazias emitidas pelas ferramentas, apontados
por git diff --check; não foram reformatados para esconder a saída original.

README raiz fora dos commits, hash inicial e reconferido antes do fechamento:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
4123 arquivos dos runtimes comparados sem diferença; fonte da cópia isolada
restaurada e conferida por hash. Ver preservation.json e mutation-restoration.json.
JDK reutilizado; nenhuma limpeza geral de target, reset, exclusão de runtime,
push, merge, deploy ou alteração de banco real. Código de produto preservado.

A conferência posterior aos dois commits deve mostrar staging vazio e somente
o README raiz e os três diretórios preexistentes fora dos commits. O resultado
efetivo dessa conferência acompanha os hashes na resposta final.
