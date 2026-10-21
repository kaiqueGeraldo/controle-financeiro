# CF-031 — Construir entrevista inicial e revisão final

- Estado: pronta (somente implementação e revisão locais/descartáveis; DEC-ONB-03)
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

- [ ] Perfil vazio e completo concluem por teclado/mobile; reload retoma exatamente respostas persistidas.
- [ ] Trocar fonte invalida alocação incompatível e não permite dupla contagem na revisão.
- [ ] 503/401/409 preservam rascunho e permitem recuperação; duplo clique/retry usa a mesma confirmação, sem falso sucesso.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Importação de histórico, novos módulos de vida, billing ou número completo de cartão.

## Modelo e revisão

O escopo exige implementação e validação de comportamento entre camadas; priorizar investigação causal e testes proporcionais. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-031/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

