# Consolidação documental CF-001–CF-026

Atualização posterior: [reconciliação CF-001–CF-027 de 03/10/2026](RECONCILIACAO-CF-001-CF-027.md),
base `a8c3724`. CF-026/027 já implementadas e aguardando revisão; RV24-02 concluída
independentemente; RV24-01 conserva resíduos em revalidação. O texto abaixo é
o snapshot histórico, não a situação corrente dessas entregas.

Snapshot de **01/10/2026, America/Sao_Paulo**, sobre
`c7f7ffc9b91d028d1dba441affa81403984ffd53` (`main`). Não é nova auditoria técnica,
revisão independente da CF-025 ou execução da CF-026. O estado vigente é sempre
o arquivo individual; [MATRIZ.md](MATRIZ.md) registra este instante e
[PENDENCIAS.md](PENDENCIAS.md) reúne obrigações sem duplicar achados.

**CF-026 apta a retomar localmente no escopo de lint e tipagem.** Única mudança
de estado: `bloqueada` → `pronta`. CF-009/015 não foram concluídas para isso.
Nenhuma outra tarefa foi iniciada e nenhuma publicação foi liberada.

## Base e método

HEAD coincide com a base informada. Staging inicial vazio; somente `README.md`
da raiz já estava modificado. SHA-256 preservado:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Nenhum AGENTS.md adicional foi localizado nos ancestrais ou em tasks; aplicadas
as instruções fornecidas pelo usuário. Catálogo, rastreabilidade, execução,
política de testes, CF-001–026, derivadas e pareceres foram confrontados.

Foram lidos os resultados e limites dos pareceres, os encerramentos por critério,
as bases Git, o diff posterior à liberação e o JSON bruto da baseline. Não se
tomaram relatos/checklists como aceite autossuficiente. As provas anteriores
são atribuídas às respectivas execuções; não são testes novos desta consolidação.
Ancestralidade comprova integração, nunca aprovação. Uma revisão posterior
substitui uma conclusão anterior somente no recorte examinado.

## Conclusões por bloco

**00 — Fundação:** CF-001/002/003 mantêm conclusão sustentada pela revisão
CF-001–009. Critérios/oráculos, PostgreSQL descartável e harness foram aceitos
nos seus escopos. Nenhum indício concreto encontrado exige reabri-los.

**01 — Datas e integração:** CF-004 permanece concluída como contrato.
P03/PUT, P04/relógios e P05/diaProduto receberam saneamento e revalidação
independente CF-015. P01/P02 têm implementação e provas sintéticas, com adoção
real ainda aberta na derivada CF-017. CF-005–008 permanecem em revisão conforme
os pareceres: falta decisão final por critério que delimite o aceite local e a
adoção, não uma nova correção presumida de P03/P04/P05. D16-T01 foi validado
pela revisão CF-017. R01/R02 e R03/RV01 da CF-015 foram encerrados nos seus casos;
RV24-01 é um achado posterior concreto do contrato de mutação/reconciliação,
mantendo CF-009 aberta. Ele não reabre o pagamento R03/RV01.

**02 — Frontend:** R04–R09/R11/R12 e os casos de R01/R02 foram revalidados;
R10 corrigiu os recortes de geometria examinados. CF-010–015 continuam em
revisão pelos aceites/lacunas identificados na matriz. Zoom nativo 200% não foi
verificado: não é defeito comprovado e também não está aprovado. A matriz
visual/privacidade não foi integralmente certificada. Pagamento R03/RV01 passou
em revisão dirigida; RVA-03 é uma intermitência posterior de causa inconclusiva.
F-018 tem seu critério de agregado aceito em CF-021, sem concluir a CF-012.
RJ-022-01 e RV24-01 afetam consumidores de hábitos/criação, preservando donos e
distinção entre observação inconclusiva e defeito confirmado.

**03 — Integridade:** CF-016/018/020/021/023/024 mantêm conclusão nos escopos
explicitamente aceitos. A consolidação independente CF-022/023 já cruzou cada
critério de CF-018/020/021; RVA-01/02 encerraram as bordas residuais sem apagar
histórico desconhecido. CF-017 conserva RV17-01/02 e adoção real; CF-019 conserva
RVA-03; CF-022 conserva RJ-022-01 e H24-01. CF-024 aprovou DEC-10 backend e
invalidação normal após commit; não aprovou todos os clientes sem chave,
exclusão completa nem cache distribuído. RV24-01/02 permanecem nas derivadas.
CF-025 tem implementação e autotestes em `65ec14e`/`04cad8d`, sem revisão
independente: permanece `em_revisao`.

## Decisão de dependências da CF-026

A [revalidação residual](../revalidacao-CF-016-CF-021-residuais/README.md),
intervalo `e927aea..0099185`, diz explicitamente: “Manutenção de lint em CF-026
pode continuar dentro de seu recorte, preservando a pendência de aceite
visual/zoom da CF-015.” A revalidação anterior do marco também delimitava essa
capacidade. Portanto, a exigência histórica de concluir integralmente CF-009/015
em `c7f7ffc` ignorava uma liberação independente aplicável.

| Evidência posterior | Garantia ou risco relevante | Efeito sobre a liberação |
|---|---|---|
| Revisão CF-022/023, base `9ff1aec` | Sessão/ownership aceitos; backend de hábitos aprovado; RJ-022-01 sem causa | Não revoga manutenção local. Alterações em consumidores exigem testes de sessão e hábitos; não aprovar a jornada semanal por associação. |
| Revisão CF-024, base `f225657`, produto `dbf828e` | Protocolo opcional/AFTER_COMMIT aprovados; RV24-01/02 e H24-01 abertos | RV24-01 impede aceite da criação com resultado desconhecido; RV24-02 impede exclusão completa. Nenhum deles exige bloquear todo lint. |
| CF-025, produto `65ec14e`, entrega `04cad8d` | `Habit.specificDays` EAGER→LAZY; validação do executor | Não altera frontend nem contrato de lint; não é aceite independente ou encerramento de H24-01/RJ-022-01. |
| Preparação CF-026, `04cad8d`→`c7f7ffc` | Diagnóstico estático e typecheck; bloqueio pelos estados | Não identifica nova quebra contratual. Bloqueio documental superado, baseline preservada. |

Diff `0099185..c7f7ffc` em frontend/src: somente `authActions.ts`, novo
`sessionBoundary.ts`, `userContext.tsx` e `useAuth.ts`, relacionados à CF-023.
O diff foi lido e seu aceite independente confrontado. Há também testes de
sessão e instrumentação de revisão fora do produto. Nenhum dos 26 arquivos
com ocorrências na baseline mudou nesse intervalo. Isso não certifica ausência
de impacto indireto: sessão, hábitos e contratos financeiros continuam exigindo
os testes pertinentes a cada lote.

### Baseline e lotes futuros

[JSON bruto](../CF-026/lint-inicial.json) e [resumo](../CF-026/lint-resumo.json):
234 arquivos inspecionados, 26 com ocorrências, **23 erros e 21 avisos**:
19 `no-explicit-any`, 4 `no-unescaped-entities`, 20 `no-unused-vars` e
1 `exhaustive-deps`. Typecheck aprovado na preparação. Dados conferidos por
agregação do JSON, sem nova execução de lint/typecheck/build ou suítes.
O [inventário por arquivo](BASELINE.md) é derivado dessa evidência histórica.

| Lote possível | Sobreposição concreta | Condições de execução futura |
|---|---|---|
| Texto JSX e bindings sem uso | `depositGoalModal`, `habitsScreen` e arquivos do inventário | Preservar texto/efeitos das expressões; não remover chamada com efeito por binding ocioso. Não depende de zoom aprovado. |
| DTOs, erros e callbacks tipados | Formulários, managers, planejamento, hábitos, auth e reorder | Usar contratos reais e narrowing; testar consumidores, erros e rejeições. O `any` é dívida estática, não prova isolada de defeito funcional. |
| Hook compartilhado | `useOptimisticMutation.ts:49`, cleanup de `activeKeysRef` | Preservar geração, sessão, locks imediatos, rollback por entidade e descarte de callbacks antigos; testar sucesso/erro tardio, A→B→A e unmount. Não aplicar sugestão automática sem validar semântica. |
| Formulários/consumidores de hábitos | `newHabitModal`, `habitItem`, `habitDetails`, `habitsScreen`, `reorderModal` | Preservar diaProduto/DEC-08, ownership, ordem/locks e contrato de lista. RJ-022-01/H24-01 continuam abertos; falha nova requer classificação dirigida. |
| Consumidores financeiros relacionados | Managers/metas/cartões e eventual expansão justificada para criação/pagamento | `newTransactionModal`/`operationModal` de RV24-01 e `payInvoiceModal`/`useCards` de RVA-03 não têm ocorrência na baseline. Não ampliar o lote para corrigir esses defeitos silenciosamente; se necessário ao lote, registrar dependência funcional específica e preservar lotes independentes. |

Não foi identificado um lote de lint cuja execução esteja concretamente impedida
pelos pareceres posteriores. Isso não promete ausência de impedimentos futuros.
As guardas acima exigem análise e teste na execução, não funcionam como dispensa.
`tests/component/async-state.test.tsx` contém dois avisos na baseline, embora o
escopo produtivo de CF-026 destaque src; eventual edição precisa de justificativa
de caminho no arquivo canônico e preservação integral de assertions/oráculos.

Na retomada: reconferir base/diffs; medir; corrigir em lotes; testar consumidores
e efeitos/cleanup; rodar typecheck, build e lint; não usar casts cegos, ignores
ou exclusões. Escalar defeitos funcionais com rastreabilidade, mantendo regras
financeiras e fronteiras de domínio. Nenhum desses passos foi executado aqui.

## Sequência e gates

O caminho local CF-026 usa a liberação acima, sem esperar conclusão artificial
de CF-009/015. A revisão independente CF-025 pode avaliar a entrega existente.
As verificações dirigidas de RV24-01, RV24-02, RVA-03, RJ-022-01/H24-01, zoom e
aceites residuais têm responsáveis/condições em PENDENCIAS. Esta consolidação
não inicia nenhuma delas e não modifica dependências do catálogo.

Homologação integrada sem ressalvas e publicação continuam sem liberação:
gates de frontend/mutações, migrações/restore/adoção, CF-025/026 e trabalhos
CF-027/028–032/033–036 conservam suas exigências próprias. Planejar ou verificar
um recorte descartável não autoriza tocar o banco existente. CF-032/034 não
recebem CF-026 satisfeita enquanto ela estiver apenas pronta.

Trade-off documental: separar capacidade de estado integral evita congelar
trabalho independente, mas exige manter base/recorte/limites rastreáveis para
evitar usar uma aprovação estreita como garantia geral. Não mudou arquitetura,
Big-O, query ou concorrência. CF-025 reporta leitura do reorder O(N)→O(1), mas
UPDATEs/round trips totais e memória continuam O(N); desempenho de produção
não está certificado. Preservar locks/ownership é condição de qualquer evolução.

## Fontes e validação

As fontes encadeadas e bases estão em MATRIZ; achados abertos e encerramentos
específicos em PENDENCIAS. Os relatórios históricos não foram reescritos; a
evidência CF-026 recebeu somente nota de superação. Regras de dependência foram
explicitadas em tasks/README e EXECUCAO; notas canônicas corrigem leituras
desatualizadas sem aprovar novos critérios.

Validação exclusivamente documental registrada em [VALIDACAO.md](VALIDACAO.md):
links/caminhos, IDs, estados, grafo de dependências, bases/ancestralidade,
baseline, diff/staging e preservação. Nenhuma suíte de aplicação, nova auditoria,
alteração de produto/testes/migrações/configuração, push ou deploy.
