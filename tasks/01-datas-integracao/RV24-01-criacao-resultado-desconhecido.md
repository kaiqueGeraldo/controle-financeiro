# RV24-01 — Reconciliar criação com resultado desconhecido antes de reenviar

- Estado: em_revisao
- Prioridade: P1
- Marco: datas/frontend/integridade
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: contratos CF-009/018/020/024 integrados; não depende de CF-025
- Origem: revisão independente CF-024, RV24-01; AC-UI-009/005 e FIN-07

## Saneamento do bruto — 04/10/2026

Estado **em_revisao** mantido. Continuação do mesmo **RVR24-01**: validação
decimal do bruto de execução no ponto comum a POST/retry/GET, preservando o
resgate monetário de NG-01 e a intenção quando o resultado é incompatível.
[Contrato, antes/depois e revalidação dirigida](../evidencias/saneamento-RVR24-01-bruto/README.md).
Entrega do executor, sem aprovação independente. RVR24-02 e RV24-02 permanecem
encerrados; H-RV24-01 inconclusivo. Critérios e dependências permanecem intactos.

## Revalidação independente — 03/10/2026, candidato 06c1a51

**em_revisao mantido. RVR24-02 encerrado; RVR24-01 permanece aberto.** [Parecer/matriz](../evidencias/revisao-CF-025-CF-027-RV24/README.md), [reprodução e encerramento](../evidencias/revisao-CF-025-CF-027-RV24/ACHADOS.md). Cinco vermelhos originais reproduzidos em cópia histórica, mesmos hashes/assertions; candidato passa seis originais e cobertura residual de storage/lifecycle. Doze jornadas novas com PostgreSQL/reload confirmam efeitos únicos e duas intenções legítimas independentes, incluindo null/array/result vazio após commit real.

Resíduo do mesmo RVR24-01: BUY2×100 com totalValue999 é confirmado e remove a intenção em POST/retry/GET. Três probes independentes vermelhos preservados; nenhum produto corrigido nesta revisão. Sucesso/erro tardios após unmount/A→B/A→B→A/expiração não disparam callbacks, e execução ativa ainda recupera/reconcilia: RVR24-02 aceito. H-RV24-01 ECONNRESET continua inconclusivo; RV24-02 e R03/RV01 preservados. Relatos abaixo mantêm o alcance histórico.

## Problema e resultado esperado

Situação em 03/10/2026: [saneamento residual do executor](../evidencias/saneamento-residual-RV24/README.md)
implementa validação de resultado e retorno explícito de lifecycle, com as cinco
provas independentes reproduzidas antes da correção. Estado em_revisao mantido:
RVR24-01/02 aguardam novo parecer independente; H-RV24-01 ECONNRESET continua
inconclusivo. Os dois critérios ainda desmarcados abaixo não recebem autoaceite.
O texto de problema a seguir descreve a origem histórica; a revisão de 40e07ef
já aceitou a correção do reenvio original sem chave.

NewTransactionModal libera nova submissão depois de ApiError502 com
requiresReconciliation=true e envia corpo sem operationId. Se a primeira
operação tiver sido confirmada, o reenvio pode repetir dinheiro. O formulário
deve preservar resultado desconhecido e reconciliar antes de criar nova intenção,
ou repetir exatamente a identidade/corpo de um protocolo durável adotado.

## Escopo e referências

`controle-financeiro-frontend/src/components/forms/newTransactionModal.tsx`,
`operationModal.tsx`, serviços/DTOs e componentes de reconciliação pertinentes.
Investimento tem risco estático relacionado a verificar dinamicamente. Ler
[achado, duas provas e limites](../evidencias/revisao-CF-024/ACHADOS.md).
Não reabrir pagamento R03/RV01 nem prometer identidade após perda de armazenamento.
Não transformar optional operationId em obrigatório no servidor sem contrato.

## Trabalho

1. Preservar a contraprova de UI e ligar o cenário ao banco descartável.
2. Escolher e documentar tratamento seguro de desconhecido, distinguindo nova
   intenção legítima de retry; considerar reload e persistência da identidade.
3. Validar transação e investimento sem interferir em mutação posterior válida.

## Aceite e testes adversariais

- [x] Probe vermelho original detecta a versão defeituosa e passa com a correção causal.
- [x] Resposta descartada depois de commit e retry/reconciliação deixam um único efeito no PostgreSQL.
- [x] Mesmo ID com payload diferente não aplica mutação; novas intenções iguais continuam permitidas.
- [ ] Resultado desconhecido não vira sucesso fictício; reload/perda de identidade têm comportamento explícito.
- [x] Resposta de ciclo/owner invalidado não aciona callbacks tardios, inclusive reconciliação de investimento.
- [x] R03/RV01 e a pendência separada RVA-03 são preservados; jornada integrada validada no escopo alterado.

## Evidência e revisão

Usar `tasks/evidencias/RV24-01/` e política de testes. Evidência inicial preservada
na revisão CF-024. Naquela revisão, tarefa apenas registrada, não implementada;
CF-032 conserva seu gate integrado e CF-025 pode iniciar localmente.

## Entrega de saneamento — 01/10/2026

Implementação sobre30211b8, para revisão independente. Checkboxes acima registram
validação do executor, não aceite independente. Dois probes causais vermelhos;
193 componentes, lint0/0, typecheck/build e seis jornadas reais com PostgreSQL,
incluindo falha de recibo antes do commit e resposta perdida após commit.
Quatro jornadas R03 originais reexecutadas; RVA-03 continua aberto.
[Causa, ciclo de vida, comandos, primeiras falhas e limites](../evidencias/RV24-01/README.md).
Identidade/corpo persistidos por owner/kind; perda do armazenamento não oferece
recuperação inventada. Backend/BFF e opcionalidade de operationId preservados.
CF-026 permanece em revisão; CF-027 não executada nem liberada por esta entrega.

## Revalidação independente — 01/10/2026

**Permanece em_revisao.** Reenvio sem chave original corrigido nos dois consumidores:
contraprovas históricas continuam vermelhas, candidato conserva UUID/corpo, seis
jornadas reais provam efeito único, replay/409/owner e nova intenção legítima.
Entretanto RVR24-01 confirma sucesso indevido com result={} no GET e200/null/array
no POST de investimento; RVR24-02 confirma onReconcile após unmount/troca de owner.
O critério de resultado desconhecido voltou a pendente e cleanup fica explícito.
[Achados e encerramento](../evidencias/revalidacao-RV24-01-RV24-02/ACHADOS.md).

193 componentes existentes/lint/typecheck/build passam, mas cinco assertions
novas falham causalmente; não são neutralizadas pelo gate verde. Prova visual
adicional:5/6, um ECONNRESET de replay preservado como H-RV24-01; caso isolado
posterior1/1 não encerra causa. R03/RV01 preservados; RVA-03 continua na CF-019.
CF-026 aguarda sua revisão. Não houve correção de produto nesta revalidação.

[Parecer independente](../evidencias/revalidacao-RV24-01-RV24-02/README.md)
libera início local da CF-027 somente para a fronteira backend de identidade/
recibos de criação, sem envolver estes consumidores ou encerrar os resíduos.
