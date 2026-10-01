# CF-027 — Organizar fronteiras do backend incrementalmente

- Estado: pronta
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


## Saneamento do marco em 30/09/2026

Serviços de metas/cartões/investimentos/transações coordenam atomicidade do marco com política de fonte e locks documentados. Reorganização ampla de domínios, extração de módulos e contrato transversal permanecem nesta tarefa futura; saneamento não equivale à sua conclusão.

[Matriz, checkpoints e limitações](../evidencias/saneamento-CF-016-CF-021/README.md). Marco aguardando revisão independente; autotestes não são aceite. Sem banco real, Railway, email real, push ou deploy.

## Prontidão local delimitada — 01/10/2026

**CF-027 apta a iniciar localmente**, apenas na fronteira de identidade/recibos
duráveis de criação entre TransactionService/InvestmentService/controller e a
implementação PostgreSQL/JSON hoje em FinancialIntentService. Ver
[parecer independente, dependências e testes obrigatórios](../evidencias/revalidacao-RV24-01-RV24-02/README.md).
Estado `pronta`: nenhuma interface, módulo, movimento de pacote ou refatoração
desta tarefa foi implementada pela revisão.

Motivo concreto: investimento depende de protocolo/recibo hospedado no domínio
de transações; consumidores conhecem implementação de persistência/lock/JSON.
O primeiro lote deve explicitar contrato de aplicação e encapsular a implementação,
com teste de dependência que detecte acesso indevido ao repositório/EntityManager
do protocolo. Somente mover pastas não satisfaz o aceite.

Preservar DEC-10: chave opcional, namespaces, owner/kind/fingerprint/canonicalização,
snapshot/DTO/status HTTP/recuperação, MANDATORY, efeito+recibo no mesmo commit,
ordem intenção→fontes, constraints e AFTER_COMMIT. Preservar CF-02430, contratos
HTTP, consumidores/rollback/mutações pertinentes e jornadas com SQL/reload.
Não introduzir REQUIRES_NEW, retry cego, alteração de schema ou cache de leitura.

CF-018/020 têm aceite próprio; CF-019 oferece backend pagamento/intenção/recibo
aprovado, mas mantém RVA-03; CF-022 oferece backend DEC-08 aprovado, mas mantém
RJ-022-01/H24-01. Hábitos/scheduler e pagamento não serão reorganizados neste lote.
CF-024 aprovou protocolo/atomicidade no seu recorte. RV24-02 foi encerrado;
RV24-01 conserva RVR24-01/02 e H-RV24-01. Esses resíduos de consumidor/execução
não exigem mudar a fronteira backend escolhida, mas permanecem na origem.
CF-026 aguarda revisão e não é dependência desta tarefa.

Reavaliar a liberação se houver mudança de DTO/API/schema/fingerprint/retenção,
transação/ordem de locks/regras financeiras, ou se o lote alcançar UI/reconciliação,
pagamentos, UserService/limpeza/email, scheduler/hábitos/metas. Outras fronteiras
exigem recorte independente fundamentado. Sem liberação de produção; RV17-01/02,
adoção real, zoom200% e demais gates de publicação permanecem.
