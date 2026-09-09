# CF-010 — Corrigir modais, layout e acessibilidade compartilhados

- Estado: proposta
- Prioridade: P1
- Modelo executor: gpt-5.6-terra
- Esforço: high
- Revisor sugerido: gpt-5.6-sol / high
- Depende de: [CF-003](../00-fundacao/CF-003-harness-frontend.md)
- Origem: T-008; F-015

## Problema e resultado esperado

Problemas de overflow, foco e botões podem se repetir em todas as telas por componentes compartilhados. Auditar esses elementos antes de corrigir telas individualmente.

## Escopo e referências

- `controle-financeiro-frontend/src/components/ui/`
- `controle-financeiro-frontend/src/components/sidebar/`
- `controle-financeiro-frontend/src/layouts/`
- `controle-financeiro-frontend/src/app/globals.css`

Caminhos de implementação relativos à raiz; infraestrutura de testes/arquivos novos devem ser criados dentro desses alvos. Ler o [SDD](../../docs/sdd/README.md), a [execução](../EXECUCAO.md) e a [política de testes](../POLITICA-DE-TESTES.md). A origem acima mantém o vínculo com o diagnóstico e os épicos anteriores.

## Trabalho

1. Reproduzir modal longo, modal aninhado quando existente, sidebar móvel, erro em formulário e teclado.
2. Corrigir scroll, foco inicial/retorno, fechamento, tamanhos e contraste com menor alteração compartilhada possível.
3. Definir fixtures de tema/privacidade/texto longo e capturas inspecionadas para as próximas tarefas.

## Aceite e testes adversariais

- [ ] Em 360px, zoom 200% e teclado, ações essenciais seguem alcançáveis; texto não sobrepõe valores/botões.
- [ ] Modal aberto mantém foco coerente; fechar devolve foco; área rolável não esconde confirmação.
- [ ] Comparar antes/depois em claro/escuro; snapshots não mascaram a geometria corrigida.
- [ ] Evidências e limitações registradas; testes não foram enfraquecidos para aceitar a implementação.

## Fora de escopo

Redesign de identidade visual ou alteração de contrato de todos os formulários sem necessidade.

## Modelo e revisão

O escopo é delimitado por componentes/telas e contratos existentes; escalar para Sol se aparecer mudança financeira ou de estado compartilhado. Os motivos e limites das recomendações estão em [modelos](../MODELOS.md). A revisão sugerida é uma execução dedicada; sua abrangência deve seguir o risco desta tarefa.

## Evidências e estado

Ainda não executada. Usar `tasks/evidencias/CF-010/README.md` com o [template](../templates/EVIDENCIA.md). Registrar critério, comando, versão/diff testado, resultado anterior/posterior, dados sintéticos, capturas/traces quando aplicáveis e riscos residuais. Evidência das correções anteriores não equivale à conclusão desta tarefa.

Atualizar este arquivo ao iniciar e finalizar. Dependências precisam estar integradas na base utilizada. Se um critério essencial não puder ser validado, manter pendência ou bloqueio explícito, sem declarar conclusão.

