# Git — lote aprovado e base da investigação

16/10/2026. Entrada: codex/cf019-rva03-investigacao, HEAD e1c63120129f202440992f29276fa4372111513a.
Único delta: README.md, SHA256 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Um worktree; staging vazio; origin https://github.com/kaiqueGeraldo/controle-financeiro.git.

Fetch inicial negado pelo sandbox ao gravar FETCH_HEAD; execução com permissão
ampliada aprovada completou exit0. Consulta remota no sandbox também falhou por
DNS; consulta posterior autorizada confirmou os dois hashes abaixo. Essas falhas
de ambiente não são divergências Git.

Após fetch: origin/main = main = 8a83c357880ad20d4adff119a60100dae20cb868.
`git rev-list --left-right --count origin/main...HEAD`: 0/5.
Intervalo aprovado, exatamente ae965aa, ad1d6f8, 18c7150, 949424a, e1c6312.
Parecer revalidacao-CF019-RVA03/README.md e diff conferidos: probes/harness,
evidências e estados aprovados, sem delta de produto ou README raiz.

Executados com sucesso, sem force/rebase/reset/stash:

```text
git fetch origin
git push -u origin codex/cf019-rva03-investigacao
git switch main
git merge --ff-only origin/main
git merge --ff-only codex/cf019-rva03-investigacao
git push origin main
git ls-remote --heads origin main codex/cf019-rva03-investigacao
git switch -c codex/cf022-investigacao
```

Resposta remota: ambas as refs em **e1c63120129f202440992f29276fa4372111513a**.
Nova branch local codex/cf022-investigacao criada dessa main integrada, sem upstream.
README pôde acompanhar as trocas e conserva o mesmo hash; não foi restaurado.
Nenhuma branch removida ou PR necessário. Sem deploy manual ou liberação de writers.
Novos commits desta investigação permanecem locais para revisão independente.

Conferência remota final repetiu os dois hashes e não retornou ref
codex/cf022-investigacao. Probes/evidências:9cc4662; preservação exata de três
fins de linha:dcf0721 (diff sem alteração substantiva,134 hashes do index
conferidos). O commit documental seguinte completa o intervalo e1c6312..HEAD
para revisão. Staging explícito limitado a esta pasta, canônico CF022 e EXECUCAO;
README raiz, raw privado e runtime não incluídos. Runtime `.cf22/` fica não
versionado e preservado; nenhum artefato ignorado foi apagado.
