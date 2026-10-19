# Parecer independente CF-029 — 19/10/2026

**Não aprovada integralmente. CF-029 permanece em_revisao por RC029-01 (P2).**
Reserva para meta NUMERIC é persistida/retomada sem issue de incompatibilidade.
Não houve efeito financeiro indevido nem quebra de isolamento demonstrada.
[Reprodução, impacto e condição de encerramento](ACHADOS.md).

## Candidato e preservação

Branch `codex/cf029-onboarding`; HEAD de entrada e candidato
`5bac46ee65cfbf4dade0705b7a430a15731be832`; base
`dd554d188976144ccf00e00f9b20242196f70d90`. Commits68b5511/0b651c8/5bac46e
examinados como intervalo completo. Sem commits posteriores na entrada, staging
vazio. Novos commits desta revisão contêm somente provas/parecer/estado.

README raiz preexistente fora do staging e dos commits, SHA256 inicial/final
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
.cf22/.cf22r/.cf22s e demais runtimes/evidências preexistentes não foram editados
ou removidos. Cópia própria de mutações na pasta de visualizações; sem clean,
reset, limpeza de target, push, merge, exclusão de branch, deploy ou banco real.
Instruções AGENTS da conversa aplicadas; busca no repositório e ancestrais não
encontrou outro AGENTS aplicável. Skill Tech Lead & Arquiteto aplicada.

## Decisão por critério

| Critério CF-029 | Parecer |
|---|---|
| Salvar sem alterar conta/fatura/investimento/saldo |Atendido nos caminhos executados, incluindo ciclo SAVE/PAUSE/RESUME/DISCARD e comparação SQL de tabelas |
| Versão antiga/conflito sem perder respostas |Atendido: primeira criação/atualização, disputas determinísticas de ações, recuperação e ausência de gravação parcial |
| Isolamento, retomada e erros por campo |Ownership/401/404/retomada sustentados; diagnóstico de inconsistência semântica incompleto por RC029-01 |
| Evidências/limitações/testes sensíveis |Atendido como disciplina de revisão;3 contraprovas causais restauradas, falhas preservadas; não sana o defeito de produto |
| Trabalho2: validar campos/referências/status/schema |Precisão, limites, estados e V15 sustentados no recorte; tipo da meta em reserva pendente |

Migração nova e upgradeV14, reexecução, Hibernate validate, rollback de exclusão,
preservação de outro owner e corrida save/delete verificados. Sem N+1 identificado
nos caminhos novos; custo O(B+N), referências em lote e serialização por owner
são trade-offs aceitáveis neste escopo. [Análise técnica](ANALISE.md).

## Evidência e limitações

53 controles originais passaram. Rodada independente22:20 passaram,1 defeito e1
erro de fixture do revisor. Fixture corrigida com igualdade integral preservada:
1 rollback +3 bordas financeiras passaram. Controle efetivo UTC+14:12/12.
Mutantes versão/owner/precisão:3 falhas causais,0 erros de infraestrutura,
restauração por hash3/3 e controle restaurado3/3 aprovado.
[Execuções e comandos](EXECUCOES.md).

Não somar seleções repetidas. Inventário histórico confirma176/53/53; falta commit
imutável por rodada histórica e o startup redefine timezoneSP. Essas limitações
foram explicitadas e substituídas por verificações dirigidas no candidato final.
Manifestos do executor conferidos22 fontes/96 evidências. Não há promessa de
ausência universal de falhas, desempenho, browser/BFF ou certificação de produção.

## Saneamento e dependências

Próximo passo: corrigir somente RC029-01, completando issues por tipo de meta
resolvida no rascunho, com tempId/alias/id e consultas em lote; preservar dados
parciais, valores e ausência de efeitos. Manter o teste vermelho como regressão
e submeter o lote a revalidação independente. Não implementar CF030/031/032.

- CF-030: depende de CF018/019/020/024/029. As quatro primeiras conservam
  conclusão canônica; CF029 não recebeu aceite nem liberação parcial nesta revisão.
  Portanto não está liberada para iniciar por este parecer.
- CF-031: conserva CF015/028/029/030. CF028 documental concluída; CF015 ainda
  depende de zoom200%, além de CF029/030 pendentes. Não liberada.
- CF-032: conserva CF021/022/023/024/026/031; CF031 não atendida. Não liberada.

Tarefas sucessoras continuam propostas, sem execução. CF010/015 zoom200% e
CF017/P01/P02 adoção real permanecem separados. Nenhum aceite anterior reaberto.
Validação autoritativa de evidência, SummaryAmount, preparação, aplicação, recibos
e coordenação de writers continuam CF030: sua ausência não foi usada como achado
contra CF029. Aprovação futura local tampouco autorizará banco real ou deploy.

## Registro Git da revisão

Provas e probes: commit local `82b8ee4` (inclui teste que reproduz RC029-01).
Parecer e estados: commit documental subsequente nesta mesma branch, sem produto.
O candidato funcional permanece5bac46e; commits da revisão não o saneiam.
Staging conferido explicitamente, README raiz excluído. Estado final/HEAD exato
informados na entrega da revisão; nenhum commit foi publicado.
