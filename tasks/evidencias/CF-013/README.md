# Evidência CF-013 — Cartões, faturas e planejamento

- Estado real e data: implementação concluída e enviada para revisão em 13/09/2026; aceite visual/integrado pendente.
- Modelo/esforço usados: GPT-5 / esforço padrão do executor.
- Commit/base e identificação do diff local testado: `main`, HEAD `1ced2f027fa46ab265b211829375581880cbb07b`, com patch local preexistente preservado. Este lote altera apenas `payInvoiceModal.tsx`, `creditCardItem.tsx`, `invoiceDetails.tsx`, `tests/component/cards-planning-audit.test.tsx` e o registro desta tarefa.
- Runtime, sistema, navegador, viewport, timezone e seed: Windows, Node local do projeto, Vitest/jsdom, `America/Sao_Paulo`, seed `cf001-v1`, relógio controlado `2026-09-08T02:59:59.000Z`. Não houve navegador real nem viewport capturado.
- Dependências integradas: código das CF-005, CF-008 e CF-010 está nesta base. O usuário confirmou tarefas anteriores finalizadas; CF-005/008 ainda têm estado documental `em_revisao`.

## Critérios e resultado esperado independente

| Critério | Oracle/regra | Teste/comando | Resultado |
|---|---|---|---|
| Competência não recua; seleção e releitura não aceitam resposta antiga | Janeiro/31 → fevereiro/01; a resposta A/setembro não pode substituir B/outubro | `temporal-navigation.test.tsx`, `async-state.test.tsx` | Aprovado: 5 cenários de navegação e 2 de fatura assíncrona na suíte de componentes. |
| Fatura aberta, fechada e paga apresenta status/ação compatíveis | Fixture literal setembro/2026: fecha 30 de agosto, vence 10 de setembro; aberta permite adiantar, fechada permite pagar, paga desabilita pagamento | `cards-planning-audit.test.tsx` | Aprovado: 3 cenários de status. Não foi inventado estado `PARTIAL`: o contrato atual expõe `OPEN`, `CLOSED`, `PAID`; parcial é validado pelo valor enviado e precisa de decisão em CF-019 para representação adicional. |
| Lista longa não esconde pagamento no mobile | 80 lançamentos sintéticos; botão está no rodapé `shrink-0`, fora do contêiner de rolagem | `cards-planning-audit.test.tsx` | Aprovado. |
| Pagamento parcial só fecha após confirmação/releitura; falha desconhecida mantém entrada | Pagamento de R$ 400,00 para fatura de R$ 1.200,00; callback de releitura pendente. `ApiError(504, requiresReconciliation)` não é sucesso | `cards-planning-audit.test.tsx` | Aprovado: o modal permanece aberto até a releitura e erro apresenta orientação para recarregar, mantendo R$ 400,00. |
| Planejamento conserva edição e data literal diante de erro | PUT de item sintético com `2027-01-30`; 400 conserva campos e alerta | `planning-edit.test.tsx` | Aprovado: 3 cenários existentes, executados novamente. |

## Falha anterior

O teste focal inicial encontrou controles sem associação `label`/campo e cartão sem ação acessível. O defeito de fechamento prematuro foi demonstrado por mutação isolada: substituir `await onSuccess()` por `onSuccess()` fez `pagamento parcial aguarda a releitura antes de fechar o formulário` falhar em `expect(onClose).not.toHaveBeenCalled()`, pois `onClose` foi chamado uma vez antes da resolução. A alteração temporária foi restaurada com `apply_patch`; a execução focal posterior aprovou 7/7.

## Correção e validação

- `CreditCardItem` passou a ser um `button` nomeado, preservando privacidade com `disabled` e tornando toda a superfície acionável por teclado.
- O detalhe da fatura passou a ser diálogo nomeado, com rótulos nos navegadores de competência/fechamento e contrato tipado para fatura, categorias e edição de transação; não houve mudança de regra de fechamento/vencimento.
- O pagamento aguarda `onSuccess` (a releitura disparada por `refreshAll`) antes de fechar. Erros que exigem reconciliação exibem instrução explícita e conservam formulário.
- `node .\\node_modules\\vitest\\vitest.mjs run --config tests\\component\\vitest.config.mts tests\\component\\cards-planning-audit.test.tsx` — 7/7 aprovados.
- `node .\\node_modules\\vitest\\vitest.mjs run --config tests\\component\\vitest.config.mts` — 19 arquivos, 102/102 aprovados. Há um `console` esperado no cenário sintético de logout da CF-011; não houve falha.
- `node .\\node_modules\\typescript\\bin\\tsc --noEmit` — aprovado.
- `node .\\node_modules\\eslint\\bin\\eslint.js src\\components\\forms\\payInvoiceModal.tsx src\\components\\screens\\cards\\creditCardItem.tsx src\\components\\screens\\cards\\invoiceDetails.tsx tests\\component\\cards-planning-audit.test.tsx` — aprovado.
- `git diff --check` — aprovado.
- `node .\\node_modules\\next\\dist\\bin\\next build` — bloqueado antes da compilação por indisponibilidade de rede ao buscar Geist/Geist Mono em `fonts.googleapis.com`; também emite aviso preexistente de `middleware` depreciado.

## Verificação adversarial

A mutação descrita em **Falha anterior** foi executada somente no arquivo local, falhou pela regra correta e foi restaurada. As fixtures não usam helpers de produção para determinar o esperado: valores, competência, status e posição do botão são literais. A execução com relógio controlado evita que o resultado “aberta” dependa do dia do host.

## Revisão e pendências

- P1: executar inspeção visual em navegador nas matrizes 360×800, 768×1024 e 1440×900, claro/escuro e privacidade ligada/desligada; não foi gerada captura porque o build/dev não inicia com as fontes remotas indisponíveis.
- P1: executar E2E com BFF, Spring e PostgreSQL descartáveis, comprovando persistência após reload. O teste de componente prova que o modal espera a fronteira de releitura, mas não substitui a confirmação integrada.
- P2: CF-019 continua dona de decidir fechamento/vencimento bancário e de representar pagamento parcial; o frontend não recalcula nem cria status fictício.
- P2: estados documentais de CF-005/008 precisam ser conciliados pelos responsáveis. A revisão independente é CF-015 quando todas as dependências estiverem concluídas.

Conclusão limitada: o patch atende às regressões de componente cobertas e não declara ausência de defeitos visuais, financeiros ou integrados.
