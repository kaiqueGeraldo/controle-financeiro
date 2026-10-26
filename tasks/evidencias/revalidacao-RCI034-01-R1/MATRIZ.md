# Critério → evidência → decisão

| Critério | Evidência nova | Resultado / limite |
|---|---|---|
| JSON escapado com prefixo | Oito casos originais; stdout fragmentado do runner; prefixos distintos/sufixo, múltiplos valores, chave Unicode | Senha ausente do público e durável; campos legítimos e JSON interno preservados |
| Aspa incompleta | Original; simples/dupla em EOF, LF e CRLF; stdout real do runner | Erro constante, coletores 1, nenhum destino final; não há fallback unquoted |
| Formatos já protegidos | JSON, Bearer opaco, Cookie/continuação, caixa, aspas/barras e repetição | Controles mantidos, sem reabrir aceite por hipótese |
| Diagnóstico e idempotência | Comparações exatas de valores, JSON.parse do resultado interno, segunda sanitização | Diagnóstico útil; canonização documentada; entradas aceitas exercitadas idempotentes |
| Duas camadas serializadas | encoding-1, encoding-2, encoding-3 | 1 e 2 protegidas; terceira com estrutura rejeitada pelos dois coletores |
| 64 níveis estruturais | structure-64 e structure-65 | Documento com 64 níveis visitados aceito; 65 recusado. Valor sensível inteiro pode ser omitido sem percorrê-lo |
| 16 MiB UTF-8 | size-exact, size-over, size-utf8-over e size-output-over | Exato protegido; +1 byte ASCII/UTF-8 rejeitado; saída acima do limite também rejeitada |
| Bruto local | Hash antes/depois de coleta e comparação com bruto original | Retido localmente; não é publicável nem sanitizado retroativamente |
| Console | stdout/stderr dos CLIs runner, public e durável capturados | Nenhuma sentinela nos cenários executados; console real do Actions não examinado |
| Arquivo sanitizado | Todos os arquivos dos destinos finais inventariados e pesquisados | Busca de sentinela, escapes relevantes e máscara; não se aceita máscara sozinha |
| Diagnósticos/manifests | result.error e package-manifest sintéticos; collection e resumos derivados | Não reintroduzem sentinela; hashes bruto/sanitizado distintos |
| Coleta falha / reuso | Recusas com destino novo; segunda coleta sobre destino existente | Sem final parcial; saída antiga preservada, mas comando 1 a desqualifica como resultado novo |
| Elegibilidade upload | Inspeção de ci.yml, unchanged | Diagnóstico somente public/ com collect.outcome success; pacote com success e manifesto sanitizado. Não equivale a upload remoto executado |
| Subprocesso / relatório / JAR | Assertions originais reexecutadas, cópia do JAR | 23→runner 1; relatório ausente→1; JAR adulterado→1 sem artifact; restaurado por hash |
| Mutação causal | Sanitizador base 418a648 só na cópia | Exatamente dois contratos falham; assertion de senha vermelha; restauração faz os mesmos oito passarem |
| Cancelamento Windows | Hash/diff dos arquivos e aceite anterior | Preservado; não repetido sem impacto do delta |
| Isolamento/E2E financeiro/pacote | Aceites anteriores, código de produto inalterado | Evidência histórica reaproveitada no alcance aceito; nenhuma execução financeira nova alegada |
| CF-034 local / integral | Critérios acima + histórico não afetado | Local aprovado; integral em_revisao, sem liberação automática de uso/publicação |

Classificação: nenhum defeito reproduzido remanescente neste delta. Ausência de
garantia universal não mantém R1 aberto. Ctrl+C, Actions/Linux, containers após
aborto e produção são verificações não executadas/limites explícitos, não defeitos
inferidos. A inspeção estática do upload não certifica sua execução efetiva.
