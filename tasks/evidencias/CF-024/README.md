# Evidência CF-024 — gate de dependências

> Gate histórico abaixo registrado em `9ff1aec`. A revisão independente conjunta
> posterior aprovou CF-023 e as dependências no recorte necessário:
> **CF-024 apta a iniciar localmente**, estado `pronta`, sem implementação.
> [Decisão, relação causal com RVA-03 e condições](../revisao-CF-022-CF-023/README.md).
> O bloqueio anterior e seu preflight permanecem preservados; publicação continua
> bloqueada pelos gates próprios.

Estado real em 30/09/2026: **bloqueada antes da implementação**. Preparação
documental somente, sobre `a21ecdbf59304e54460456ad528f20ebbec1482f`, branch
`main`, Windows/PowerShell. Executor Codex baseado em GPT-6 da sessão; esforço
efetivo não exposto. Sem runtime de aplicação, navegador, banco ou seed nesta
execução. Recomendações de modelo da tarefa não alteram a sessão.

Leitura prévia de tasks/README.md, EXECUCAO.md, POLITICA-DE-TESTES.md, CF-024,
suas quatro dependências e evidências de liberação, SDD/README.md, ADR-004/005,
AC-FIN-003/005/010, SPEC-004 e T-009. Nenhum AGENTS.md adicional foi encontrado
na busca de arquivos do repositório; instruções fornecidas pelo usuário aplicadas.

## Dependências e motivo do bloqueio

| Dependência | Commit de produto integrado | Estado oficial na base |
|---|---|---|
| CF-018 | `4203f18` | em_revisao |
| CF-019 | `fb43e62` | em_revisao |
| CF-020 | `d11359e` | em_revisao |
| CF-023 | `1b93704` | em_revisao; exige aceite independente antes de CF-024 |

Integração comprovada por `git merge-base --is-ancestor <commit> <base>`:
exit 0 nos quatro casos. SHA completos, hashes dos documentos e estado inicial
em [preflight.json](preflight.json). Ancestralidade comprova presença na base,
não revisão independente ou aceite.

A [entrega CF-023](../../03-integridade/CF-023-isolamento-autenticacao.md)
registra expressamente: **“Liberada somente a revisão independente de CF-023.”**
Em seguida exige as demais dependências e o aceite independente para CF-024.
O [relatório CF-023](../CF-023/README.md) confirma esse gate, e a
[revalidação anterior](../revalidacao-CF-016-CF-021-residuais/README.md)
não libera integralmente CF-024. Na base inspecionada não há parecer posterior
que satisfaça esse requisito. Não se deduziu bloqueio apenas de `em_revisao`:
há entregas anteriores que autorizam recortes locais nesse estado; aqui falta
a liberação exigida explicitamente pela dependência mais recente.

Respeitar esse gate evita validar a matriz transversal sobre um contrato de
isolamento ainda sem aceite independente. O custo é adiar a execução financeira;
não justifica refatoração especulativa, lock global ou aceitação automática dos
testes anteriores. Revisar outra tarefa violaria o escopo solicitado.

RVA-03 continua inconclusivo e delimitado à interação/recuperação do pagamento.
Não demonstra saldo perdido, débito duplicado ou bloqueio financeiro geral, nem
foi usado como causa para impedir esta tarefa.

## Critérios e resultados esperados pela especificação

| Critério | Oracle independente / camada necessária | Resultado desta sessão |
|---|---|---|
| Efeito econômico único | AC-FIN-003/010: conta 1000, dívida 200; dois pagamentos da mesma operação deixam conta 800 e dívida 0, com um débito | Não executado |
| Writers sobre mesma fonte | CF-024 e FIN-05/07: pagamento, transferência, venda e aporte com conexões separadas/barreiras; consultar banco após ambos | Não executado |
| Conflito/recuperação | AC-UI-005, ADR-004 e DEC-07: conflito recuperável sem sucesso fictício; detalhar recibo/transporte antes das assertions | Não executado; protocolo transversal não decidido nesta sessão |
| Cache/eventos | ADR-004 e AC-FIN-010: rollback conserva estado anterior; commit permite leitura persistida; evento de cache após commit | Não executado |
| Detecção de regressão | POLITICA-DE-TESTES: mutação isolada da proteção crítica deve falhar por integridade, com restauração comprovada | Não executado |

Não houve reprodução, correção, teste vermelho/verde, mutação ou revisão
independente de CF-024. Nenhum teste/assertion/snapshot foi alterado. Resultados
históricos de outras tarefas não são apresentados como validação desta execução.
Custos de queries, concorrência, ordem de locks e risco de deadlock permanecem
por medir; não se afirma complexidade ou desempenho da solução não executada.

## Verificações e preservação

Comandos de preparação, executados na raiz:

```powershell
git status --porcelain=v1
git diff --cached --stat
git diff -- README.md
git rev-parse HEAD
git branch --show-current
git merge-base --is-ancestor 4203f18 a21ecdb
git merge-base --is-ancestor fb43e62 a21ecdb
git merge-base --is-ancestor d11359e a21ecdb
git merge-base --is-ancestor 1b93704 a21ecdb
Get-FileHash README.md -Algorithm SHA256
```

Única mudança inicial alheia: README raiz; staging vazio. SHA256 preservado:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Entrega desta sessão limitada ao estado de CF-024 e esta pasta de evidências,
com staging explícito e inspeção do diff antes do commit documental local.
Validação de fechamento: JSON legível, quatro ancestrais integrados, dependências
inalteradas pelos hashes, README preservado, diff sem erros de whitespace e
staging restrito aos três arquivos. Não houve execução de suítes de aplicação
porque nenhum produto/teste foi modificado e o gate impede iniciar CF-024.

## Retomada e tarefas liberadas

Integrar revisão independente de CF-023 e registrar liberação do recorte local
de CF-024 considerando CF-018/019/020. Depois reconferir HEAD, alterações locais
e gates, definir o protocolo pendente pela especificação e executar a matriz
PostgreSQL/barreiras/rollback/cache e mutações exigidas pela tarefa.

**Nenhuma tarefa sucessora foi liberada nesta sessão.** CF-025/027/030/032
dependem de CF-024 e mantêm seus próprios gates. A revisão independente de
CF-023 já estava liberada anteriormente; não foi executada ou ampliada aqui.
Estados das dependências preservados. Sem banco real, e-mail real, push ou deploy.
