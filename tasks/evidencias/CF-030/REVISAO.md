# CF-030 — roteiro de revisão independente

Estado entregue: **em_revisao**, exclusivamente local/descartável.
Este documento é um encaminhamento do executor; não é parecer de aprovação.
Não publicar CF030, iniciar CF031/032, migrar banco real, ativar writers ou executar
deploy nesta revisão. CF029/RC029-01 e aceites anteriores continuam preservados.

## Artefato e autoridade

Branch `codex/cf030-aplicacao-onboarding`, base integrada imutável
`5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`. Revisar o intervalo completo dessa base
até o HEAD local entregue. [Git/preservação](GIT.md) registra commits e verificações.
Não incorporar o README raiz modificado anteriormente nem `.cf22/.cf22r/.cf22s`.

Ler CF030 integral, SPEC001, SPEC004/FIN06/NG01, contratos temporais, aceites
CF028/029/024/027 e liberação local CF017. A [matriz prévia](MATRIZ.md) conserva
resultados esperados; [decisões](DECISOES.md) explica mecanismo, custo e limitações.
[Execuções](EXECUCOES.md) preserva falhas e comandos. Logs não substituem inspeção
independente, e resultados de execuções sobrepostas não devem ser somados.

## Inspeção dirigida

1. Contrato HTTP fechado, ownership404/401, strings decimais exatas e UUIDs/versões;
   prepare/complete/cancel/recover e GET do draft mantendo issues do último save.
2. Mesma intenção/replay antes da versão consumida; conflito de conteúdo;
   preparação e FinancialIntents dividindo namespace sem segundo recibo.
3. Revalidação atual em prepare e complete: fontes, categorias, hashes, critérios
   de inicialização, capacidade, composição de cartão, reservas/evidência e legado.
4. Ordem real intenção→guard→users/sessão→fontes. Inspecionar TODOS os writers
   participantes e o guard de cotação; verificar a garantia frente às transações
   preexistentes. SQL administrativo fora do protocolo continua fora do certificado.
5. Commit único de efeitos, mapping, declarações/história, recibo e COMPLETED;
   eventos de invalidação apenas após commit. Confirmar rollback em falha do último
   item, recibo e listener síncrono após gravações terminais.
6. E01: contas1300, investimentos501, dívida350, patrimônio1451 e reservas550;
   cartão principal344/disponível656. Releitura SQL/serviços e pagamento posterior
   devem conservar recibo original. Aberturas não são receitas/aportes/compras.
7. Reservas incertas: E23/28/34 KNOWN400, E32 KNOWN500 no universoACCOUNT; união de
   riscos, prova vencida, ID novo, ASSIGN/CLOSE, partes parciais e dimensões mistas.
8. FIN06: máximos individuais e agregados amplos; NG01 TOTAL e PRICE; modalidade
   monetária sem unidades/custo inventado. UNKNOWN/PARTIAL/NA não devem virar zero.
9. V16 apenas nova, vazio+upgrade V15, Hibernate validate, dados antigos, constraints
   e exclusão/rollback integrado. Nenhuma adoção de banco real é parte deste lote.
10. Custo: comparar SELECTs1→1140 tempIDs e1000 fontes existentes, filtros de histórico,
    arrays/índices de incidência, orçamento operacional503 sem truncamento. Relações
    incertas podem atingirN×R; limites são operacionais, não financeiros.

## Reprodução

Usar JDK21/Docker e um clone/cópia isolado do intervalo. Nunca alterar URL do perfil
test para banco real. O runner reaproveita o JDK local indicado; em outra máquina,
adaptar localização de JDK21 e raiz isolada de contraprovas, mantendo seleção e
regras financeiras. O Prefix opcional permite nomes inéditos para contraprovas.
Executar os
comandos de [EXECUCOES](EXECUCOES.md) com nomes novos, preservando todos os resultados.
Conferir o manifesto de fontes antes/depois e as quatro contraprovas restauradas.

Solicitação ao revisor: produzir parecer com critérios sustentados, achados causais,
gravidade, testes independentes e limites. Se houver defeito, manter em_revisao e
pedir saneamento delimitado. Somente o revisor pode recomendar aceite; mesmo aceite
local não satisfaz zoom nativo200% CF010/015 nem adoção real CF017/P01/P02, e não
libera automaticamente as sucessoras.
