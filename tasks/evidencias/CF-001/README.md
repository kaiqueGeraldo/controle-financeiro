# Evidência CF-001

- Estado: concluída em 07/09/2026 (America/Sao_Paulo), restrita à entrega de critérios, oracles, roteiro e revisão de cobertura.
- Executor: Codex, sessão atual. Recomendação da tarefa: GPT-6 Astra/xhigh; configuração efetiva de modelo/esforço não verificável pelos comandos do repositório. Nenhum modelo foi reconfigurado via Markdown.
- Base: `main`, HEAD `169d7be4c7d3db97d4c318ff3f99d9de3a808067`, com alterações locais preexistentes. [base-inicial.json](base-inicial.json) registra status e SHA-256 de 389 arquivos versionados/não ignorados presentes antes da primeira edição. Não foi criado commit/branch.
- Runtime: Windows 10.0.26200.0, PowerShell 7.6.5, Node 24.18.0; npm indisponível por launcher avariado. [runtime.json](runtime.json). Runner de helpers com TZ explícito São Paulo/UTC/Kiritimati; nenhum browser/viewport executado; seed das novas fixtures `cf001-v1`.
- Dependências: CF-001 não depende de outra tarefa; specs e patch inicial já estavam neste checkout. Nenhuma outra tarefa foi executada ou teve estado alterado.

## Entregáveis e critérios

| Aceite | Entrega / fonte independente | Validação |
|---|---|---|
| F-001 a F-017 ligados a tarefa e critério, sem inventar resultados de hipóteses | [SPEC-003](../../../docs/sdd/specs/003-criterios-oracles.md): 39 AC-TIME/AC-UI/AC-FIN, 17 linhas F individuais, fontes e nove decisões pendentes | Leitura crítica + validador de referências/IDs/tarefas aprovado |
| Meia-noite, mês curto, fuso divergente, reload, 4xx/5xx e texto longo com expected | [Fixtures literais](../../../controle-financeiro-frontend/tests/oracles/cf001.json) e [guia](../../../controle-financeiro-frontend/tests/oracles/README.md): dois usuários, calendário, saldos reconciliados e apresentação | Conferência manual por SPEC-001/002/política, centavos exatos e calendário independente; sem importar código da aplicação |
| Revisão crítica dos testes atuais | [revisao-testes.md](revisao-testes.md) | Inspeção de cinco testes frontend, runner, contextLoads e CI; runner executado em três fusos |
| Evidências/limitações e não enfraquecimento | Este registro; [roteiro e classificação](../../../docs/sdd/specs/003-roteiro-exploratorio.md), com 15 roteiros planejados por tela/estado | Conferência de hashes no fechamento; sem mudança de testes antigos, código de produto, package/lockfile ou CI |

## Falha anterior e validação

A CF-001 não implementa correção de regra. Portanto, não há vermelho/verde causal novo de produto. Falhas históricas do patch não são atribuídas a esta execução. Mutações/restauração do código corrigido pertencem a CF-005/015/033, explicitadas na revisão.

| Comando (raiz do repositório) | Resultado real | Evidência / significado |
|---|---|---|
| `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git diff --stat`, `git diff --no-ext-diff -- ...` | Base main com patch existente; diff inspecionado | Snapshot SHA-256 antes de editar; preservação verificada no fechamento |
| `rg --files -g AGENTS.md ...` | Nenhum AGENTS.md em arquivo encontrado (exit 1, busca sem resultados) | Instruções AGENTS fornecidas na conversa aplicadas; não é falha da tarefa |
| `npm --prefix controle-financeiro-frontend test` | **Falhou, exit 1**: npm-cli.js ausente | [Log original](testes-existentes.txt). Ambiente, não defeito detectado pelo teste |
| `node controle-financeiro-frontend/scripts/test.mjs` | **Aprovado, exit 0**: 5 testes × 3 fusos = 15; zero falhas/skips | [Log Node](testes-existentes-node.txt). Mesmas assertions/runner; aviso de tipo de módulo preservado |
| `node controle-financeiro-frontend/tests/oracles/validate.mjs` | **Aprovado, exit 0**: 39 critérios, 17 achados, 31 cenários, dois usuários; reconciliação e 18 combinações instante/fuso | [Log](validacao-oracles.txt). Verifica artefatos, não regra/contrato/persistência da aplicação; repetido após edição de links e esclarecimento de pré-condições das fixtures |

O validador só lê arquivos, checa referências, identidades e cálculos sintéticos exatos/offsets. Não instala framework nem muda o comando npm. Sua aprovação não supre teste de produto. Esperados são literais no JSON; nenhuma função da aplicação é chamada para gerá-los.

## Preservação e reprodução

Snapshot capturado com `git ls-files --cached --others --exclude-standard`, leitura SHA-256 por arquivo, HEAD/branch/status. Para conferir preservação a partir da raiz:

```powershell
$baseline = Get-Content tasks/evidencias/CF-001/base-inicial.json -Raw | ConvertFrom-Json
$allowed = 'tasks/00-fundacao/CF-001-criterios-e-oracles.md'
$unexpected = @($baseline.files | Where-Object {
    $_.path -ne $allowed -and (
        -not (Test-Path -LiteralPath $_.path -PathType Leaf) -or
        (Get-FileHash -LiteralPath $_.path -Algorithm SHA256).Hash -ne $_.sha256
    )
})
if ($unexpected.Count -gt 0) { throw 'Alteração preexistente modificada; revisar antes de continuar.' }
```

Esse comando é uma comparação com a base desta tarefa, não autorização para restaurar arquivos. Mudanças futuras legítimas podem naturalmente mudar hashes. [preservacao.json](preservacao.json) confirma 388 dos 389 arquivos iniciais inalterados: somente o arquivo CF-001 foi atualizado como autorizado, sem exclusões ou alteração inesperada. [entrega-sha256.json](entrega-sha256.json) registra os hashes finais dos artefatos desta tarefa (exceto o próprio manifesto) para identificar a revisão local entregue, já que HEAD sozinho não contém o patch inicial.

## Revisão e limitações

- Revisão crítica pelo executor, sem execução independente do revisor sugerido. CF-015/033 mantêm os gates de revisão do produto; nenhum resultado de revisão independente é alegado aqui.
- Nenhuma captura, trace, integração, E2E, build, typecheck, lint ou execução remota nesta tarefa. Os roteiros têm estado planejado, não aprovado. Wrapper/Java 21/PostgreSQL continuam sob CF-002; harness e launcher npm sob CF-003.
- DEC-01 a DEC-09 registram regras/contratos ausentes, com donos: fuso/página aberta, origem de timestamp legado, fechamento, relatórios, marcador neutro, privacidade, taxas/precisão/replay, janela de hábitos e referências inacessíveis. Bloqueiam somente aprovação do comportamento dependente, não a definição honesta de critérios CF-001.
- N+1, concorrência e defeitos visuais não foram reproduzidos; expected de segurança/integridade não é acusação de vulnerabilidade existente. Não foi importado dado real, enviado e-mail, acessado banco remoto ou feito deploy.
- Fixtures pequenas facilitam reconciliação, mas não demonstram desempenho. Dataset crescente/p95/EXPLAIN pertence a CF-025; barreiras/conexões independentes e cache após commit a CF-024. Nenhum SLA, lock global, cache distribuído ou regra financeira nova foi introduzido.

## Dependências e sequência

Ao concluir CF-001, **CF-004** passa a ter sua única dependência satisfeita **nesta base local**. **CF-002 e CF-003** já estavam prontas e seguem executáveis, sem depender de CF-001. **CF-016** ainda precisa de CF-004; as demais respeitam o catálogo. Os estados dessas tarefas não são alterados por CF-001.

Antes de iniciar em outra branch/worktree, integrar deliberadamente o patch inicial e esta entrega: checkout apenas do HEAD acima não contém os arquivos não commitados. Nenhuma dependência foi declarada integrada em outro checkout, e nenhuma tarefa seguinte foi iniciada.
