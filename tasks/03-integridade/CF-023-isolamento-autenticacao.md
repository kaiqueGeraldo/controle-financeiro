# CF-023 — Verificar isolamento por usuário e sessão

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: xhigh
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-002](../00-fundacao/CF-002-ambiente-backend.md), [CF-008](../01-datas-integracao/CF-008-erros-e-contratos.md), [CF-017](../03-integridade/CF-017-migracoes.md)
- Origem: T-003, T-009; investigação multiusuário

## Problema e resultado esperado

Autenticação na UI não comprova autorização em cada referência de conta, cartão, meta e investimento. Testar acesso indevido com dois usuários sintéticos.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/infra/security/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/controller/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`
- `controle-financeiro-frontend/src/actions/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Montar matriz rota/método/referência com usuário proprietário, outro usuário e não autenticado.
2. Testar leitura, mutação, reorder, exportação, vínculos e cache; revisar expiração, logout e recuperação sem comunicação real.
3. Corrigir achados concretos com regressão de endpoint e política uniforme de erro.

## Aceite e testes adversariais

- [ ] UUID de B não pode ser lido/alterado/vinculado por A; não há efeito parcial após tentativa.
- [ ] Logout/troca de conta não reaproveita cache financeiro; token inválido/expirado produz resposta consistente.
- [ ] Erros/logs/respostas não expõem segredo ou dados financeiros do outro usuário; asserts verificam estado do banco.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Declarar vulnerabilidade sem reprodução, fazer pentest em terceiros ou enviar e-mails reais.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-023/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.


## Saneamento do marco em 30/09/2026

Os novos comandos e cobertura tiveram ownership/usuários sintéticos distintos no saneamento CF-016–021. Isso não executa a auditoria completa de autenticação, sessão, BFF e superfícies desta tarefa; estado preservado.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.
