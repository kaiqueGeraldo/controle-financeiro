# Git e integridade da entrega residual

Branch inicial e final: `codex/cf031-onboarding-frontend`.
Base conferida: `75ede48f07350e5b8a1e14eac45be9328f57c831`, sem commits posteriores
inesperados no início. Staging inicialmente vazio; alterações preexistentes:
README.md raiz modificado e diretórios não rastreados `.cf22/`, `.cf22r/`, `.cf22s/`.
Todos preservados e excluídos do staging desta entrega.

Correção/testes: `d338b0fb10d79e28442c0432a5e035dab31b50dc`
(`fix(cf031): consume the same own reference identity that is validated`).
Seis arquivos: model.ts, input.ts, result.ts, Fields.tsx, Review.tsx e
identity-remediation.test.tsx. Nenhum backend, schema, migration, flow ou protocolo.

Evidências e estados ficam no commit documental sucessor, com assunto
`docs(cf031): record residual identity evidence for revalidation`.
O hash desse commit é obtido pelo Git após o registro, sem inserir um hash
autorreferente no documento. Intervalo dirigido:
`75ede48f07350e5b8a1e14eac45be9328f57c831..codex/cf031-onboarding-frontend`.

Inspeção reproduzível, a partir da raiz:

```powershell
git branch --show-current
git log -2 --oneline
git diff --stat 75ede48..codex/cf031-onboarding-frontend
git diff 75ede48..codex/cf031-onboarding-frontend -- controle-financeiro-frontend/src
git status --short
git diff --cached --name-only
Get-FileHash -LiteralPath README.md -Algorithm SHA256
```

README.md raiz inicial/final:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Não restaurado, não incluído nos commits. Não houve clean, reset destrutivo,
limpeza de target, push, fetch, merge, deploy, acesso a banco real ou exclusão de
branch. Commits desta entrega são exclusivamente locais.

## Manifestos

- [initial.json](initial.json): branch/HEAD iniciais, hashes dos probes/config e
  README raiz.
- [candidate-source-sha256.json](candidate-source-sha256.json): 625 arquivos de src
  do frontend/backend; hash do manifesto
  `05BF031CC4A2206B1E76C4FA9F5F6F5AB3841ADC3AC73432B9E9461E048578BE`.
  [candidate.json](candidate.json) discrimina somente os seis deltas contra o
  manifesto anterior de 624 fontes.
- [revalidation-proofs-before.json](revalidation-proofs-before.json): 133 arquivos
  da revalidação independente; nenhum editado.
- [preservation.json](preservation.json): comparação dos 4.123 arquivos de runtimes,
  das 548 provas anteriores e dos 133 arquivos da revalidação, todos sem diferença.
  Manifestos prévios usados: `../CF-030/excluded-before-commits-sha256.json` e
  `../saneamento-CF-031-RC031/proofs-before-sha256.json`.
- [counterproof-source-sha256.json](counterproof-source-sha256.json): integridade dos
  210 arquivos da cópia isolada após restauração.
- [final-integrity.json](final-integrity.json): conferência final de todos os
  manifestos e do README raiz, sem diferenças; links Markdown locais válidos e
  nenhum JWT compacto encontrado nos artefatos textuais novos.

CF031 continua em_revisao. RC031-01 encerrado independentemente; RC031-02 saneado
localmente, sem autoencerramento. Próximo passo: revalidação independente dos
probes e consumidores descritos no [README](README.md).
