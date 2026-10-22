# Candidato, commits e preservação

Branch `codex/cf031-onboarding-frontend`; HEAD inicial/candidato
`44e8fee154a5023be1e441c42884ab4c62de47e6`; base `e1f5048`.
Nenhuma alteração posterior de produto encontrada. Staging inicial vazio.
Somente README raiz modificado e runtimes .cf22/.cf22r/.cf22s não rastreados
preexistiam. Não foram incluídos nem restaurados.

Primeiro commit desta revalidação:
`ca72da7570f2e30526a608ed3b9f79838fb67fbc` — probes, execuções, integração,
SQL, capturas, contraprovas e preservação (128 arquivos).
Pareceres e estados seguem em commits locais separados. Consultar `git log`
após esse commit para seus hashes; o HEAD final é informado na entrega.

`initial.json` e `preservation-final.json`:548 provas e4123 arquivos dos runtimes
conferidos integralmente pelos manifestos existentes, nenhuma diferença.
README SHA256 inicial/final:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Diff de produto e de provas anteriores vazio.

Também rechecados624 arquivos do manifesto de fontes do saneamento, sem diferença;
SHA256 do manifesto confirmado:
`6AC10102A261FF1507C1E48B0FDDD064C299502F373F6640E8D5E7CFD89C6173`.

Staging explícito apenas de arquivos da nova pasta, depois documentação e estados.
Inspecionados diffs dos probes e estados. `git diff --check` nos logs brutos
aponta espaços finais e linhas vazias emitidos pelas ferramentas; preservados
como evidência. Não há essas advertências nos novos fontes/documentos.
Sem clean/reset destrutivo, limpeza de target, push, merge, exclusão de branch,
deploy ou acesso a banco real.
