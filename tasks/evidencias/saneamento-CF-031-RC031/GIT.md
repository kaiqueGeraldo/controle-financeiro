# Git e preservação — saneamento RC031

Branch mantida `codex/cf031-onboarding-frontend`, sem upstream. HEAD inicial
`e1f5048a0d9c2ab1c98f192ba5476328dc5113d4`, exatamente o informado. Revisão
780542b/e1f5048 e implementação anterior preservadas. Nenhum commit posterior
inesperado na abertura; staging vazio, README raiz modificado e diretórios
`.cf22/`, `.cf22r/`, `.cf22s/` não rastreados. Único worktree usado, original.

## Lote local

1. `78ea4be274f6aee20578af03e47998d3b8f4d290` — RC031-01: coerência dos livres
   no snapshot e nove testes dirigidos.
2. `d5df92bab56cff64f360b9a04a893aaf5840e6df` — RC031-02: contrato integral
   de reservas/variantes e controles estruturais. Ajustes finais de tipos
   integrados no próprio commit local recém-criado, nunca publicado.
3. `34be81137c15ed932c29612e000f2a1a8c3c178a` —
   `test(cf031): prove receipt remediation and scope session diagnostics`:
   harness/observadores, controle de recuperação e complementos estruturais,
   provas brutas, hashes e contraprovas. Não é correção presumida de T01/T02.
4. O commit que introduz este documento, assunto
   `docs(cf031): hand off RC031 remediation for independent revalidation`,
   registra causas/limites/estados e encaminhamento. Hash no histórico, sem
   reescrever o documento para incluir o próprio hash.

Intervalo de saneamento: `e1f5048..codex/cf031-onboarding-frontend`.
Para contexto de toda a CF031: `6d819aa..codex/cf031-onboarding-frontend`.
Staging nominal/seletivo e diffs inspecionados; nenhum README raiz/runtime
ou mudança alheia incluído. Produto backend/migrations/UserProvider/Modal/API
compartilhada e parser JSON não mudam. Java só aceita config opcional de teste,
mantendo assertions e default originais. Não há correção adicional de sessão.

Fontes624 do candidato final no manifesto `candidate-source-sha256.json`, SHA256
`6AC10102A261FF1507C1E48B0FDDD064C299502F373F6640E8D5E7CFD89C6173`.
Rodada12/12 usa produto final. Após ela, somente o wrapper de evidência ganhou
assertions de950 visível; seleção mobile de quatro jornadas verifica a adição,
sem repetir toda a matriz. Não somar conjuntos sobrepostos nem chamar essa
adição de correção de produto. Checks de produto não repetidos por documentação.

## Preservação e limites de publicação

README raiz SHA256 inicial e conferências finais:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Conteúdo encontrado preservado diretamente no working tree, sem restauração
automática, mudança de branch ou stash. Fora de todos os commits deste lote.

548 arquivos de provas CF031/revisão inventariados antes do produto e conferidos
sem mudanças;4123 arquivos do inventário prévio de runtimes sem ausências/deltas.
Hashes java/javac iguais aos anteriores. Ver `proofs-before-sha256.json` e
`preservation-final.json`; conferência após complemento em arquivo próprio.
Nenhum clean, reset destrutivo, exclusão de branch ou limpeza geral de target.
Relatórios Java de cada rodada copiados antes da seguinte. Artefatos normais
de build/teste são gerados; runtimes e evidências históricas não são descartados.

Contraprovas somente em cópia isolada,209 arquivos restaurados byte a byte;
cópia e logs preservados. Probes e script de navegador originais intactos por
hash. Scan textual dos novos logs/JSON/XML/Markdown foi executado após o runner
fechar e não encontrou JWT compacto; tentativa anterior esbarrou em dois logs
ainda abertos e não é tratada como conferência completa.
Sem cookies/JWT/traces/vídeos gravados; somente fixtures sintéticas.

Não houve fetch/push/merge/deploy, acesso a banco real ou ativação de serviços.
Remoto e main não foram alterados nesta execução. DEC-ONB-03, aceites anteriores,
zoom CF010/015, CF032 não liberada e adoção real CF017/P01/P02 preservados.
CF031 segue em_revisao, sem encerramento independente dos achados por este executor.

Diff-check de fonte/documentos/scripts autorais é conferido separadamente;
logs/snapshots brutos podem guardar espaços finais. Não reformatar prova para
fabricar um diff-check integral limpo.
