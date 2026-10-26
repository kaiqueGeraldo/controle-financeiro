# Sanitizador e fronteiras efetivamente examinadas

## Causa e correção

Em sanitize.mjs, o caminho anterior consumia o valor inteiro de `message` sem
examinar o JSON escapado dentro dele. O caminho textual atual decodifica cada
literal JSON, aplica a mesma política na forma decodificada e reescapa quando
necessário (textRules, linhas 31–64). Chaves conservam grafia, mas são comparadas
na forma decodificada. JSON integral usa parse/visit (linhas 24–38); o valor
inteiro de uma chave sensível é substituído. Os controles confirmam que contador,
status e diagnóstico continuam utilizáveis, inclusive no JSON interno da mensagem.

Para atribuições, o scanner reconhece o início com aspa e exige fechamento
(quoteEnd, linhas 15–23; campo textual, linhas 68–81). Não há alternativa
unquoted após falha do quoted. Aspa truncada produz erro constante e coleta
recusada. Foram exercitadas aspas simples/duplas, escapes, EOF/LF/CRLF e valores
múltiplos. Isso trata a classe do defeito, não o nome/valor das sentinelas.

Os casos legítimos preservam exatamente o texto esperado; entradas JSON podem
ser reformatadas por JSON.stringify, sem alterar os campos não sensíveis que
foram conferidos. Limites e entradas ambíguas podem omitir a coleção inteira;
essa recusa é explícita e deixa o bruto privado para diagnóstico local.

## Limites e custo

| Fronteira | Resultado concreto novo |
|---|---|
| Camadas de strings | Uma e duas camadas com senha são sanitizadas; terceira contendo estrutura produz `Unsafe JSON string encoding depth` |
| Estrutura JSON visitada | 64 níveis aceitos; 65 recusados com `Unsafe JSON structure depth` |
| Entrada | 16.777.216 bytes com senha ao final são tratados; 16.777.217 bytes recusados, inclusive com UTF-8 multibyte |
| Saída | JSON de 16.777.212 bytes cuja formatação excede o teto é recusado por `Unsafe evidence size` |
| Malformação | JSON obrigatório inválido, literal inválido e escaping sem moldura falham com mensagem fixa; texto semelhante legítimo continua útil |

Esses limites não significam contar toda chave/chaveamento de texto arbitrário
como estrutura JSON: profundidade se aplica à visita da estrutura interpretada.
Um valor sensível pode ser inteiramente omitido sem examinar sua estrutura.
Strings terminais sem delimitadores não exigem mais uma decodificação; novos
delimitadores além do orçamento falham. Não se prometeu classificar segredos
arbitrários sem chave, dados cifrados ou registros irrecuperavelmente entrelaçados.

Análise do código: quoteEnd avança pelo texto e pula escapes; o loop principal
avança até o fim do token. Regex de campo tem nomes fixos e é sticky; não busca
em todos os sufixos por backtracking. Regex de escalar é ancorada. Parse, visita,
reescape e regex históricas fazem passagens por camada. Para tamanho N e limites
fixos L=2/D=64, trabalho esperado O(N), com fatores por camada, formatação e
profundidade; memória O(N) com fatores significativos para texto, árvore JSON,
pieces, cópias e representação de saída. Não há análise de query/domínio porque
o delta não toca banco ou regras financeiras.

O teto é de cada chamada pública, **não** um orçamento global de memória:
coletores fazem readFile completo antes; JSON.parse constrói a árvore antes da
checagem de profundidade de visit; saída é construída antes da checagem final.
Logo o processo pode alocar mais de 16 MiB. A garantia comprovada é recusa da
representação excedente e ausência de fallback publicável, não impossibilidade
de pressão de memória por qualquer arquivo hostil.

Provas sintéticas: entrada de 16 MiB tratada diretamente em cerca de 1,05 s;
registros densos em tokens de 1.638.442 e 3.276.842 bytes levaram cerca de 83 e
127 ms. Prazo fixo de 5 s dos dois controles densos não foi alterado. Esses
números não são benchmark, limite garantido para toda entrada nem desempenho
de produção; complementam a inspeção contra custo patológico evidente.

Trade-off: scanner tem mais código que a regex anterior, mas torna a precedência
de aspas/atribuições explícita, usa JSON.parse como decodificador e falha fechado
nos casos ambíguos. Rejeição conservadora pode reduzir diagnóstico publicável;
o bruto preservado permite investigação local. Não há justificativa de correção
adicional nesta revisão nem garantia universal inferida dos casos verdes.

## Canais e coleta

1. Runner registra stdout/stderr brutos em arquivos; não envia chunks do filho
   ao console. Foi usado emitter real fragmentado e observado o CLI inteiro.
2. Public e durável importam o sanitizador compartilhado. A leitura é por arquivo
   completo; fronteiras de chunk não são unidades de sanitização.
3. Cada transformação sucede dentro de staging privado. Rename para public ou
   runs/label só ocorre após sucesso. Falha não copia o bruto como alternativa.
4. Os casos recusados, inclusive limite de saída, deixam sem destino final.
   O staging privado pode conter partes já sanitizadas; não é elegível ao upload.
5. Coleta com destino existente falha, mantendo bytes antigos. Workflow exige
   sucesso da coleta atual para diagnóstico; pacote fica sob success normal.
   A presença de um public antigo no disco não vira aprovação nova.

Arquivos reais da execução do runner, enumerados em audit.json:

- `r1-review-01/execution/output-nested/public/`: collection.json, lint.log,
  result.json — todos lidos e pesquisados.
- `r1-review-01/execution/durable-nested/runs/runner/`: os mesmos mais control.json
  — todos lidos e pesquisados; não confundir a allowlist durável com a de upload.
- Variante quote: ambos os destinos finais ausentes.
- Em r1-review-02, cada caso lista os arquivos finais e hashes. Inclui
  package-manifest.json sintético, result.error e collection.json, além dos logs.
  Resumos browser-environment, browser-summary, browser-observations e collection
  também foram inspecionados. .env/auth-state/dump/trace sintéticos não passaram.

As buscas incluem sentinela original e representações JSON/Unicode pertinentes;
comparações positivas verificam conteúdo diagnóstico. Máscara sozinha não é
critério de aprovação. Logs do mutante **devem** conter sentinelas e não são
resultados aprovados. Brutos ficam no runtime e não são incluídos nos commits.

Erros do sanitizador examinados não incluem entrada rejeitada; catch dos coletores
emite texto fixo. Runner usa safe() para mensagens de erro, omitindo diagnóstico
se a própria sanitização falhar. Nenhum dos consoles locais capturados revelou
as sentinelas nos cenários aprovados. Console GitHub Actions real não foi examinado;
sanitizar um arquivo depois não poderia apagar algo já emitido naquele canal.

Upload foi examinado estaticamente: ci.yml seleciona public/ somente com
`always() && steps.collect.outcome == 'success'`; pacote usa `*.jar` e
`public/package-manifest.json` sob success. Nenhum upload foi realizado. Sanitização
do manifesto não é auditoria universal dos bytes do JAR.
