# Hashes históricos — análise dirigida CF034

Entrada `79ce089`; produto `e1a01b6`; nova base documental integrada `272001f`.
Não houve nova auditoria financeira nem reescrita de provas/manifests históricos.

[Script reproduzível](audit-history.mjs), [67 comparações completas](historical-hashes.json).
Fonte: `CF015-zoom-gate-CF034/historico-eol.json`, que preserva os SHA256 originais
de `revalidacao-CF033-01/preservation-final.json` e os bytes observados depois.

| Grupo | Resultado demonstrado | Limite |
|---|---|---|
| 67 arquivos observados | SHA256 bruto atual coincide com a observação anterior em todos; sem nova mudança nesta entrada | Não afirma o momento da diferença frente ao manifesto antigo |
| 10 fontes/documentos/scripts | Transformação registrada CRLF→LF dos bytes atuais reproduz exatamente o SHA256 original | Demonstra equivalência dessa transformação; não demonstra quem/quando alterou terminações |
| 57 relatórios (51 XML, 6 TXT) | Nem bytes atuais, nem sua uniformização LF ou CRLF reproduzem os SHA256 originais | Representação bruta original **não reconstruída**, mecanismo causal histórico não comprovado; não atribuir automaticamente a checkout/sanitização/geração |
| Todos os 67 | `git hash-object --path` coincide com os blobs em d059bc9, e1a01b6 e79ce089; `cat-file blob` e SHA256 dos bytes normalizados observados também coincidem nos67 | Prova igualdade do conteúdo versionado aprovado, não identidade com os bytes antigos indisponíveis |

As três bases têm objetos idênticos para cada caminho. Não foi detectada alteração
substantiva posterior do conteúdo versionado nesses arquivos. É possível usar
os relatórios aprovados como **histórico versionado**, mantendo seus limites;
não certificamos a correspondência bruta das57 entradas com o manifesto antigo
nem afirmamos equivalência semântica retrospectiva de bytes que não possuímos.
Uma transformação simples não explica todas as diferenças. Provar o mecanismo
exigiria recuperar os bytes originais anteriores à publicação/normalização;
sem esses bytes a incerteza permanece explicitamente delimitada.

Nenhum dos57 é fonte de produto ou dependência do novo pacote. A CF034 não usa
esses relatórios como testes de seu JAR: a nova exportação registra todos os inputs
relevantes, lockfile/POM, comandos, resultados novos e SHA256 do próprio pacote.
Não há impedimento demonstrado à rastreabilidade dessa execução nova; isso não
torna verde o manifesto antigo. Mudança nova nos fontes/objetos ou divergência
do manifesto corrente deve reprovar o gate, e não ser normalizada silenciosamente.
