# Execuções CF-016

21–22/09/2026, raiz do monorepo, Windows/PowerShell, Node v24.18.0.
Revisão de produto lida: `45e156c3189fd9893a88e6adcc0df3903983f4b9`.
O diff é exclusivamente documental e contém um verificador de artefatos isolado.
Comandos abaixo não sobem aplicação, não consultam banco nem usam rede.

## Inspeção e baseline

- `git status --short`: inicialmente somente ` M README.md`.
- `git rev-parse HEAD` e `git log -5 --oneline`: base 45e156c, incluindo saneamento
  e encerramento dirigido de R03/RV01. `git diff --cached --name-only`: vazio.
- Leitura de tasks/README, EXECUCAO, POLITICA-DE-TESTES, CF-001/004/015/016,
  CF-018/019/020/021/024, SDD e specs 001/002/003, pareceres de dependências.
- `rg --files --hidden -g AGENTS.md -g '!node_modules' -g '!.git'`: nenhum arquivo
  AGENTS.md adicional localizado; instruções AGENTS.md fornecidas pelo usuário
  aplicadas. Leituras com `Get-Content` e buscas `rg -n` embasam DIVERGENCIAS.
- Snapshot SHA-256 dos arquivos versionados/não ignorados preexistentes em
  [base-inicial.json](base-inicial.json), antes de editar CF-016.

Uma tentativa de leitura com expansão Bash `{service,repository,domain,dto}`
falhou no parser PowerShell antes de executar o comando. Repetida com caminho
PowerShell válido. Falha de ferramenta, sem efeito no repositório e sem valor
como teste vermelho financeiro. Nenhuma falha de produto foi inferida disso.

## Comandos reproduzíveis de validação

```powershell
node tasks/evidencias/CF-016/verify.mjs --adversarial
node controle-financeiro-frontend/tests/oracles/validate.mjs
node controle-financeiro-frontend/src/types/temporal-contract/validate.mjs
git diff --check -- docs/sdd tasks/03-integridade/CF-016-regras-financeiras.md
```

Matriz documental de fusos (variável restaurada ao final):

```powershell
$cf016PreviousTz = $env:TZ
try {
  foreach ($cf016Zone in @('America/Sao_Paulo', 'UTC', 'Pacific/Kiritimati')) {
    $env:TZ = $cf016Zone
    node tasks/evidencias/CF-016/verify.mjs
    if ($LASTEXITCODE -ne 0) { throw "Falha em $cf016Zone" }
  }
} finally { $env:TZ = $cf016PreviousTz }
```

Não é uma matriz E2E temporal: o verificador usa centavos, exemplos civis
documentados e arquivos locais. A execução em três processos/fusos apenas
confirma que a validação documental não muda com TZ. Casos B06/B12 de integração
permanecem explicitamente atribuídos às tarefas consumidoras.

## Resultados

| Comando/verificação | Exit / resultado | Evidência |
|---|---|---|
| Primeiro `verify.mjs --adversarial` | 1: E19 possuía22 colunas, esperado21. Removido zero excedente no CSV; valores financeiros mantidos. | [Falha inicial](validacao-inicial.log) |
| `verify.mjs --adversarial`, após ajuste do CSV | 0:49 estados reconciliados;18 bordas documentadas;15 divergências com donos; sete casos CF-001 compatíveis; seis mutações rejeitadas pela causa esperada. | [Log](validacao.log) |
| `verify.mjs` em São Paulo, UTC e Kiritimati | 0 em cada processo; mesmos resultados monetários/documentais. | [Fusos](fusos.log) |
| Verificador CF-001 | 0:39 critérios,17 achados,31 cenários,2 usuários,54 links. | [Log CF-001](cf001.log) |
| Verificador CF-004 | **1**: inventário não contém `UpdatePlanItemDTO.dueDate`. Não reexecutado como se estivesse verde; não alterado. | [Log CF-004](cf004.log) |
| Inputs CF-004 versus45e156c | `git diff --exit-code`=0; nenhum arquivo novo nesses inputs; scanner independente confirma único campo DTO ausente. | [Baseline](cf004-baseline.log) |

`git diff --check -- docs/sdd tasks/03-integridade/CF-016-regras-financeiras.md`
terminou com exit0. Git avisou sobre conversão futura LF→CRLF por configuração
local, sem erro de whitespace. Nos artefatos novos, busca por `[ \t]+$` não encontrou
whitespace final. O ensaio `git diff --no-index --check -- NUL` da nova SPEC-004
retornou1 pela existência de conteúdo diferente, sem apontar whitespace; não foi
rotulado como teste financeiro ou check verde de exit0.

A falha CF-004 ocorre na auditoria de cobertura documental após os exemplos
temporais. É lacuna preexistente, não falha de regra financeira introduzida pelo
diff CF-016. D16-T01 fica com CF-008, sem reabrir estados das dependências ou
executar CF-017. A evidência não declara aprovado o comando completo da CF-004.

As mutações são em cópias em memória, sem arquivo de produto alterado; o mesmo
verificador reaplica a validação canônica ao final. Cada rejeição é assertion
específica: abertura como renda, previsão como realizado, reserva como ativo,
pagamento como consumo, resgate inteiro como ganho, centavo na primeira parcela.

## Preservação e revisão testada

O verificador compara os hashes de todos os arquivos iniciais e admite mudanças
somente nos quatro documentos preexistentes autorizados. Isso cobre README raiz,
CF-015, tarefas futuras, produto, testes e oracles anteriores. Hashes dos arquivos
entregues constam em [manifesto-final.json](manifesto-final.json), para identificar o diff exato.
Não haverá alegação de teste isolado de commits intermediários nem de revisão
independente. Nenhum comando de stage/commit/push/deploy foi executado.
