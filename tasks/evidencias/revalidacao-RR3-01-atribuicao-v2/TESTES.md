# Execução reproduzível, hashes e contraprovas

Runtime exclusivo: C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/revalidacao-rr3-01-v2-01. Um novo replay deve usar outro sufixo, pois os diretórios/recibos são criados sem sobrescrever a prova anterior.

preservar.mjs initial registra HEAD/branch/estado, READMEs, 97 protegidos, 36 registros, sete originais e manifest1053. executar.mjs prepare copia fontes rastreadas e dependências instaladas em s/f. Os únicos ajustes em fontes copiadas são caminhos físicos Java de controle-financeiro-frontend para f. prepared.json registra cada hash e adaptação; fechar-recursos confirmou os 849 arquivos copiados sem outras alterações. Não há .env, cache anterior ou banco real.

Sequência usada, com os caminhos dos scripts relativos somente para leitura do roteiro:

- preservar.mjs initial <runtime>
- executar.mjs prepare <runtime>
- provar.mjs originais <runtime>
- provar.mjs controles <runtime>
- provar.mjs checks <runtime>
- provas-originais.mjs prepare-live <runtime> (script histórico preservado)
- executar.mjs run <runtime> live IndependentRR3LiveProbe MilestoneRemediationBrowserTest, com REVALIDATE_GREP=SAN-E2-visual|Independent live reason
- independentes-v2.mjs <runtime> novos-final
- contraprovar.mjs <runtime>
- medir-custo.mjs <runtime> (script do saneamento preservado)
- highlight-revelacao.mjs <runtime>
- fechar-recursos.mjs <runtime>
- preservar.mjs final <runtime>
- consolidar.mjs <runtime>

Os grupos originais executaram os scripts nas posições históricas, sem alterar bytes ou assertions. originais/ arquiva cópias byte a byte; RESULTADOS.json.originalProbes registra SHA completo, comparado ao snapshot inicial. Os imports do helper recebem os três módulos necessários na cópia isolada; essa infraestrutura não modifica os probes.

42 controles: configuração original com timeout 15.000 ms, workers=1, retries=0; reporter JSON e log preservados. Tipagem: tsc --noEmit --incremental false --project tsconfig.json. Lint: cinco arquivos do delta, --max-warnings=0. CI: os quatro arquivos ci/required/suites/sanitize.test.mjs, 32 contratos. Sem suites financeiras completas sem impacto.

Os dois wrappers usam Maven offline, JDK preservado 21.0.12.1+1, banco PostgreSQL descartável e frontend local. O grep foi delimitado aos casos afetados; ambos os XMLs têm tests=1, failures=0, errors=0, skipped=0. Cada relatório Playwright tem expected=1, unexpected/flaky/skipped=0. Cadastro/sessão não falharam nesta execução; as falhas históricas anteriores permanecem nos próprios runtimes, sem reclassificação.

## Contraprovas e restauração

Apenas contraprovas/s/f recebeu mutações. O observador anterior veio do blob imutável da base 7f7f4ec6: SHA 34e8ba89d7c0ae88feff74f18637a648df00e18a9f09e93e0dd4395c813cfb86. O original físico arquivado tem SHA 52bf34a08d93ee8a8ecc61805e8b2c97cf58a2555b2b417532e80cd752349dae; a diferença é exclusivamente CRLF/LF, conferida por comparação. Não se normalizaram nem sobrescreveram os originais.

O helper candidato foi restaurado para d79c3cf488a03ad7364ad9a79b0116ee610dbd191155a36aa8533cbd0543bd57. O módulo text-paint.mjs foi restaurado após cada mutação para 5527fcba9bef9376d467359e662b1662b8e8c8892d77114b199ec3611fa20d6e. As verificações ocorrem em finally e antes dos controles seguintes. complete.json/restorations.json registram etapas e hashes.

A mutação de silhueta desliga somente o teste de proximidade espacial: o caso retangular falha na assertion de 55 pixels externos, sem problema incidental. A de direção desliga somente a comparação de distância de cor: o probe de um único pixel elimina a ambiguidade de uma imagem retangular que também seria recusada pela silhueta. Com direção desligada, os demais critérios raster dessa fixture aceitam contribuição ausente em A. O controle corrigido exige wrongDirectionPixels=1, unmatchedCorePixels=1 e glyphPixels=[0]. Falha causal e restauração comprovadas; não há mutação na worktree.

Os logs/resultados do primeiro ensaio do harness novo foram conservados e identificados na matriz. Não representam falhas do produto nem contam como testes adicionais. Os 258 recibos/artefatos brutos listados em RESULTADOS.json têm tamanho e SHA; imagens, logs privados, XMLs, instalações e fontes de execução permanecem fora do Git.
