# CF-030 — aplicação financeira local

Implementada e validada localmente em19–20/10/2026; **CF-030 em_revisao**.
Ainda não há aceite independente.
Branch `codex/cf030-aplicacao-onboarding`, base
`5b8c4e07c2ef49c0c19f7f1a3cd71587a6b50251`. Publicação da CF029 e integração por
fast-forward autorizadas e realizadas; main e branch CF029 conferidas remotamente
nessa base. Nenhum novo commit CF030 será publicado nesta execução.

[Matriz anterior ao produto](MATRIZ.md), [decisões e invariantes](DECISOES.md),
[execuções e falhas preservadas](EXECUCOES.md), [revisão independente](REVISAO.md).
[Git e preservação](GIT.md).

## Entrega

- Preparação durável e revisão atual, confirmação, cancelamento e recuperação
  autenticados. GET do rascunho continua devolvendo as issues do último save.
- Revalidação de ownership, referências, versão/estado, inventário, evidência,
  capacidade e hashes antes dos efeitos. Uma preparação pendente congela edição.
- Aberturas de contas, carteira explicitamente identificada, posições UNIT e
  MONETARY, cartões/faturas/parcelas/crédito, metas, reservas e previsões pendentes.
  Não cria receita, compra, aporte nem aquisição histórica fictícia.
- Projeção exata ampla com KNOWN/UNKNOWN/PARTIAL/NOT_APPLICABLE, FIN-06/NG-01 e
  união conservadora de riscos das reservas. ASSIGN/CLOSE atuais com trilha.
- Efeitos, mapping auditável, recibo FinancialIntents e COMPLETED no mesmo commit.
  Replay conserva o snapshot original; recuperação não recalcula posições.
- V16 aditiva, bancos descartáveis com Flyway e Hibernate `validate`, exclusão
  integrada e protocolo comum com writers financeiros e atualização de cotações.

Validação corrigida: **504 testes,0 falhas/erros/ignorados, Maven verify concluído**.
As quatro mutações críticas foram detectadas por assertions causais, sem erros de
ambiente/compilação. Restauração completa dos400 fontes principal/cópia conferida
por hash; controle restaurado21/21 verde. [Resultados por execução](results.json),
[prova de restauração](source-restoration-verified.json).
Os31 casos de fixtures CF022 passaram na execução anterior, não repetidos como
parte dos504. Execuções sobrepostas não são somadas como casos únicos; todas as
falhas anteriores permanecem no lote.

O ensaio de1140 tempIDs preservou os totais independentes com26 SELECTs de prepare
e22 de complete;1000 fontes existentes foram resumidas integralmente. A duração
do commit máximo variou3,55–10,60s localmente: outro writer do mesmo owner pode
receber409 por espera. O protocolo protege writers participantes, e os números
sintéticos não certificam capacidade de produção. Posições MONETARY não ganham
um novo comando cotidiano de compra/venda sem unidades neste escopo.

## Limites preservados

Nenhuma UI/BFF de entrevista (CF031), jornada de navegador CF032, deploy manual,
ativação de serviço/writer ou banco real. CF031 conserva CF015 e o zoom nativo200%
pendente, além do aceite CF030; CF032 conserva CF031 e seus outros gates.
CF017/P01/P02 continuam com adoção real pendente; a fundação local tem liberação
independente própria. Aceites CF029/RC029-01 e anteriores não são reabertos.

README raiz e runtimes preexistentes ficam fora do staging. Hash inicial do README:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Sem `git clean`, reset destrutivo, exclusão de branches ou limpeza geral de target.

O próximo passo é uma execução dedicada de revisão independente do intervalo
completo base..HEAD entregue. A implementação não se autoaprova.
