# CF-027 — Organizar fronteiras do backend incrementalmente

- Estado: proposta
- Prioridade: P2
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-018](../03-integridade/CF-018-contas-transacoes.md), [CF-019](../03-integridade/CF-019-cartoes-faturas.md), [CF-020](../03-integridade/CF-020-investimentos-metas.md), [CF-022](../03-integridade/CF-022-habitos-crons.md), [CF-024](../03-integridade/CF-024-concorrencia-cache.md)
- Origem: T-001, T-009; ADR-001

## Problema e resultado esperado

Entidades estão por domínio, mas serviços se cruzam em pacotes globais. Melhorar isolamento após testes financeiros, evitando reorganização cosmética ampla.

## Escopo e referências

- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/service/`
- `controle-financeiro-backend/src/main/java/com/controlefinanceiro/api/domain/`
- `docs/sdd/arquitetura.md`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Mapear dependências e escolher uma fronteira problemática concreta, como transações/contas ou metas/investimentos.
2. Introduzir interfaces de caso de uso/projeções e mover responsabilidades necessárias mantendo contrato externo.
3. Adicionar verificação de dependência arquitetural proporcional e documentar trade-offs; repetir outros limites só como tarefas derivadas.

## Aceite e testes adversariais

- [ ] Uma fronteira identificada tem dependências explícitas e teste detecta acoplamento proibido.
- [ ] As suítes financeiras e concorrentes preservam comportamento; nenhuma alteração escondida de schema/API.
- [ ] Documentar o que ainda permanece acoplado e por que não migrar para microsserviços agora.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Mover todas as pastas de uma vez, introduzir Kafka/microsserviços ou exigir separação artificial de toda classe.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-027/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

