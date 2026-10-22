# CF-031 — Construir entrevista inicial e revisão final

- Estado: em_revisao (revisão independente não aprovada: RC031-01/02 P2; DEC-ONB-03)
- Prioridade: P1
- Modelo executor: gpt-5.6-sol
- Esforço: high
- Revisor sugerido: gpt-6-astra / high
- Depende de: [CF-015](../02-frontend/CF-015-revisao-marco-frontend.md), [CF-028](../04-onboarding/CF-028-contrato-onboarding.md), [CF-029](../04-onboarding/CF-029-rascunho-backend.md), [CF-030](../04-onboarding/CF-030-finalizacao-backend.md)
- Origem: T-007; F-008

## Liberação local condicionada — 21/10/2026

[DEC-ONB-03](../../docs/sdd/decisoes/003-liberacao-local-CF-031.md), autorizada
explicitamente pelo usuário, distingue desenvolvimento local do aceite integral
CF-015. Aceites CF-028/029/030 e frontend consumidos na base00179d2; integração
do lote aprovado precede nova branch. Zoom nativo200% segue pendente em CF-010/015,
ambas em_revisao; incluir onboarding na reavaliação antes da liberação para uso.
Sem liberação automática CF-032, adoção real CF-017/P01/P02 ou deploy.

## Problema e resultado esperado

Transformar cadastros isolados numa jornada curta e ramificada que prepara o app sem esconder os valores ou o significado da abertura.

## Escopo e referências

- `controle-financeiro-frontend/src/app/`
- `controle-financeiro-frontend/src/screens/`
- `controle-financeiro-frontend/src/services/`
- `controle-financeiro-frontend/src/components/`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Implementar contexto, contas, cartões/dívidas, investimentos, metas, previsões opcionais e revisão com rascunho do servidor.
2. Permitir pular etapas aplicáveis, voltar, retomar e corrigir validação por campo; explicar valores na data-base.
3. Integrar confirmação e entrada no dashboard; manter acesso de usuário legado sem inicialização forçada.

## Aceite e testes adversariais

- [x] Perfil vazio e completo concluem por teclado/mobile; reload retoma exatamente respostas persistidas. E01 usa seed de draft por PUT real, sem provar digitação ponta a ponta de todos os campos.
- [x] Trocar fonte invalida alocação incompatível e não permite dupla contagem na revisão. Referências pendentes permanecem visíveis para correção; servidor valida a preparação e resumo distingue reservas de patrimônio.
- [x] 503/401/409 preservam rascunho e permitem recuperação; duplo clique/retry usa a mesma confirmação, sem falso sucesso. Edição ainda não salva permanece somente em memória e não é prometida após expiração/reload.
- [x] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

Marcações acima registram entrega e validação do executor, não aprovação independente.

## Fora de escopo

Importação de histórico, novos módulos de vida, billing ou número completo de cartão.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

### Parecer independente — 22/10/2026

**Não aprovada; manter em_revisao.** Candidato `0f0b619`, base `6d819aa`:
[parecer, matriz, achados e reproduções](../evidencias/revisao-CF-031/README.md).
RC031-01/P2: recibo recuperado aceita caixa livre incoerente; comprovado também
no navegador após commit real. RC031-02/P2: leitura de reservas aceita membros
herdados e estruturas antes/depois inválidas. Nenhuma correção de produto.

75 dirigidos e6 temporais aprovados; cinco contraprovas detectadas/restauradas;
lint/tipos/build aprovados. Duas rodadas reais11/12 com falhas preservadas de
loading/sessão; seleção dirigida mobile4/4 com Java1/1 e quatro checkpoints SQL.
Não declarar12/12 integralmente reproduzido. Três falhas amplas reproduzidas na
base/candidato: uma de fixture, duas inconclusivas quanto ao timer exato, sem
bloqueio adicional pelos critérios individualizados no parecer.

Sanear os doisP2 e revalidar recuperação/consumidores; investigar dirigidamente
as ocorrências reais sem aumentar timeouts. Critérios sustentados preservados.
CF032 continua proposta/não liberada; zoom nativo200% CF010/015 e adoção real
CF017/P01/P02 permanecem separados. Checkboxes e entrega abaixo são histórico
do executor, não aceite independente. Commits somente locais, sem publicação.

Implementada em21/10/2026 na branch local `codex/cf031-onboarding-frontend`, base
integrada `6d819aa`. [Entrega e evidências](../evidencias/CF-031/README.md),
[matriz](../evidencias/CF-031/MATRIZ.md) e
[encaminhamento independente](../evidencias/CF-031/REVISAO.md).
75 testes dirigidos,12 jornadas reais com SQL descartável e cinco contraprovas
detectadas; lint/typecheck/build aprovados. Suíte ampla438/441, com as mesmas
três falhas reproduzidas na base anterior. Capturas360/768/1440, teclado e
privacidade registrados; zoom nativo200% continua pendente em CF010/015.

Confirmação/recuperação pertencem ao trabalho3 desta tarefa. CF032 conserva uso
diário/exportação e cenários ampliados, sem liberação automática. O único novo
arquivo Java é harness de teste HTTP/SQL descartável, justificado pelo pedido
explícito desta execução; nenhum código de produto backend alterado.
Implementação permanece local, sem deploy manual ou banco real. Revisão
independente ainda necessária; não concluir a tarefa por esta entrega.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

