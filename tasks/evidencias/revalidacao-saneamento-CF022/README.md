# Revalidação independente do saneamento CF-022 — 18/10/2026

**Saneamento aprovado. Critério 4 aceito; CF-022 concluida.** Os critérios1–3
mantêm seus aceites anteriores, sem regressão concreta identificada no delta.
Não foi necessária alteração de produto ou nova correção do harness nesta revisão.

Candidato imutável: `eb41301..5e2fae5355ad2c745b955b66d676b6c479edf8e1`, commits
`b8bc945`, `c4cd0da`, `9cade4e`, `5e2fae5`. Branch `codex/cf022-investigacao`;
HEAD inicial coincide, staging vazio. Nenhuma mudança posterior alheia encontrada.

| Decisão | Fundamentação |
|---|---|
| RJ-022-01: correção atual aceita | Helper Date-only realmente usado antes da navegação; antigo falha por substituir clocks, candidato passa; quatro jornadas reais com calendário, pintura, interação, reload e SQL |
| H24-01: isolamento aceito | Contexto/schema por método impede herança de fixtures; quatro ordens passam; retirar isolamento reproduz501 herdados. Conexões/workers e encerramento de pools/scheduler observados |
| Critério4 atendido | Provas sensíveis, assertions/prazos mantidos, falhas explicadas e preservadas, reprodução e limites documentados |
| CF-022 concluida | Critério4 agora aceito, critérios1–3 já sustentados e preservados; nenhum impedimento funcional novo |

[Matriz de aceite](MATRIZ.md) · [Diagnóstico](DIAGNOSTICO.md) ·
[Falhas e limites](FALHAS-E-LIMITES.md) · [Comandos/resultados](EXECUCOES.md) ·
[Verificação de fontes e preservação](verification.json).

## Validação e alcance

- 31 casos Java aprovados:27 originais e4 ordens/repetição com observação adicional.
  Quatro schemas únicos; quatro contextos/pools fechados e executores terminados.
- Mutação sem isolamento:2 casos,1 falha causal esperada (0 esperado,501 herdados).
- Relógio:1 teste Node candidato aprovado; controle antigo falha por clocks não
  nativos. Navegação/reload em dois fusos e contexto limpo sem vazamento.
- Quatro jornadas UI→BFF→Spring→PostgreSQL, um orquestradorJava aprovado, com
  meta0→1→0 e SQL final:4 hábitos streak0,4 logsPENDING04/01/2027,4 metas0,
  GoalHistory0. Doze observações de pintura, clocks nativos, zero animação negativa.
- Sintaxe/ESLint dos três CJS sem erros; compilaçãoJava/release21 aprovada.
  Sem TS/TSX alterado: não foi necessário tsc/build global de produção.

Inspecionadas as capturas novas SP semanal marcado (1/2 e Feito Hoje) e Kiritimati
semanal desfeito (0/2 e Avançar Progresso), com estilos carregados. Demais imagens
têm assertions automatizadas, não inspeção visual manual exaustiva ou zoom200%.
2→1006→2 é evidência anterior conferida; não foi repetido esse estresse nesta rodada.
Não somar observações, callbacks, mutantes ou reexecuções como novos casos funcionais.

## Ocorrências históricas

RJ-022-01 e H24-01 históricos permanecem **inconclusivos e não bloqueantes**.
Não foram encerrados por uma repetição verde: os mecanismos atuais de harness/
fixtures têm correção e contraprovas próprias, e os critérios funcionais possuem
evidências independentes. A falta de dados retroativos não invalida essas provas.

Não se atribui o timeout30s/zeroPOST original ao Date-only por associação. Não se
atribui o timeout10s original à coleçãoEAGER ou às501 fixtures sem inventário da
ocorrência. O timeout residual do saneamento foi deliberadamente induzido por
volume dentro de um método e não é explicado pela compilação da home. Preparação
dev aquecida não certifica startup frio, SLA, carga ou produção.

Reabrir se Date-only gerar clocks divergentes/ação bloqueada ou zeroPOST no
caminho preparado; se fixture nominal isolada expirar ou herdar dados; se retry
duplicar efeito ou SQL/calendário violar contrato. Na primeira ocorrência, colher
calllog/DOM/rede/SQL (browser) ou início/fim do callback, schema, PG/PIDs/locks/pool
e dump (scheduler). Não repetir até verde nem exigir reprodução histórica impossível.

## Preservação e continuidade

3792 arquivos históricos intactos, inclusive .cf22/.cf22s e provas anteriores;
README raiz conserva o hash informado e fica fora dos commits. Runtime novo
.cf22r também não é versionado. Produto/checkout sem delta contra o candidato;
launcher da cópia restaurado por hash. Falha própria de comparaçãoCRLF preservada
com script inicial/log; somente o verificador foi corrigido, sem mudar os testes.

CF029 conserva prontidão **exclusivamente local/descartável**, sem execução.
RVA03 encerrada; CF019/013 concluídas e aceitesCF011/012/014 preservados.
Zoom nativo200% deCF010/015 e adoção realCF017/P01/P02 continuam pendentes.
Nenhuma dependência nova, alteração de banco real, push, merge ou deploy.

Próxima etapa, em execução posterior autorizada: publicar e integrar o lote
aprovado após conferir o intervalo efetivo e preservar mudanças alheias; então
iniciar CF029 em nova branch a partir da base integrada, somente local/descartável.
Esta revisão não executa nenhuma dessas ações.
