# Git e preservação

- Branch conferida: `codex/cf030-aplicacao-onboarding`.
- Base da revalidação: `251d6c70492e4ad57dc9ca1313dce17afab62464`.
- Candidato: `c13aecd032ca8a08276226e55a37864aa18b4873`.
- Provas independentes: `c0a49a84c0d418f15721be740f9876b7b7edf419`.
- Parecer e estados: commit imediatamente seguinte, que adiciona este arquivo;
  seu hash final é informado na resposta e identificável no histórico.

Staging inicial vazio. Fora do candidato: README.md raiz preexistente modificado
e .cf22/.cf22r/.cf22s não rastreados. Nenhum delta de produto posterior ao HEAD
informado foi encontrado. Nenhum produto foi corrigido nesta revisão.

Staging explícito: primeiro somente uma classe de provas, dois runners e saídas
da revalidação; depois somente documentos novos e estados em tasks/README.md e
tasks/04-onboarding/CF-030-finalizacao-backend.md. Diff inspecionado antes de cada
commit. Logs/XML mantêm whitespace emitido pelas ferramentas; testes/runners e
documentos passam diff --check. Não se reformatou saída histórica.

README inicial/final anterior ao commit documental:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
4123 arquivos dos runtimes comparados sem diferenças;169 evidências anteriores
intactas; java.exe/javac.exe com os hashes previamente registrados. A cópia nova
foi restaurada:413 fontes iguais ao manifesto. Original do observador preservado
é o blob `1c519176e1752d51c9a7dc19e41a94d171a96a07` da base.

Builds reutilizam o JDK e escrevem suas saídas em target; nenhuma limpeza geral,
clean, reset, exclusão de runtime/branch, push, merge ou deploy. Somente bancos
descartáveis. Após o segundo commit, conferir staging vazio e manutenção apenas
da sujeira preexistente; resultado efetivo informado na resposta final.
