# Contraprovas CF-032

Somente runtime externo `20261022-controls`; quatro patches de produto temporários,
nenhum no checkout principal. Cada comando/prova tem diretório novo e PostgreSQL/
schema/owners novos. Fonte é restaurada byte a byte no finally e conferida por SHA256.

| Mutação | Controle / violação detectada | Resultado |
|---|---|---|
| owner | H passa na base; retirar filtro do AccountService expõe EXCLUSIVO B na UI A | H falha pelo dado alheio, fonte restaurada |
| duplicate-credit | H exige A1010; crédito duplicado produz1020 no SQL | H falha pela diferença monetária, fonte restaurada |
| export-value | C confere linha250.10; mutação acrescenta0.01 só no arquivo | C acusa250.11 em assertion distinta da precisão horária, fonte restaurada |
| export-date | API/SQL civil22/10; mutação escreve23/10 no arquivo | C falha pelo calendário, fonte restaurada |

Os patches/hashes estão em `*.patch.txt` e [results.json](results.json).
Quatro `detectedByInvariant=true`, nenhum erro de importação/ambiente usado como
detecção. Isso não equivale a mutation score geral nem cobre perda de persistência
por mutação própria; reload/nova sessão/SQL exercitam essa dimensão diretamente.

Base e controle restaurado selecionam C/H: **H passa, C conserva somente o achado
CF032-04 de segundos**. [Comparação](restored-comparison.json) confirma mesmos
casos/status/erros, com `equivalent=true`. O processo de cada seleção C retorna 1
porque a precisão continua pendente; o controlador global retorna 0 após verificar
detecção específica e restauração. Não se declarou 2/2 verde nem se usou a falha
preexistente para contar valor/data como detectados.

484 arquivos de produto da cópia restaurada coincidem com o checkout em
`../controls-source-restored.json`. Os subconjuntos e os dois controles se
sobrepõem às jornadas; não somar como novos cenários de produto. Todos os logs,
arquivos baixados, análises e screenshots de falha permanecem disponíveis.
