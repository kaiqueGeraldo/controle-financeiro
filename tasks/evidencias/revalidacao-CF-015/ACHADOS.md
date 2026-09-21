# Revalidação independente CF-015 — achado residual

21/09/2026. Candidato: `681102b9c23e4fb1c296d97897fc2bf8ab802f4c`.
Produto não alterado nesta revisão. `F/` = `controle-financeiro-frontend/`.

## RV01 / R03 — P1: reconciliação substituída resolve como sucesso

- Responsável: **CF-013 / CF-009**, dentro do saneamento CF-015.
- Local: `F/src/hooks/useCards.ts:221–222`; consumidor financeiro em
  `F/src/components/forms/payInvoiceModal.tsx:153–156`.
- Critério: AC-UI-006/011 e aceite CF-013 de falha recuperável. Confirmar o POST
  não confirma a atualização dos dados; nenhuma das releituras foi concluída.
- Causa: `refreshAll` cria uma geração `cards-reconciliation`, mas só propaga
  a rejeição de `completeReads` se essa geração ainda for atual. Uma segunda
  chamada invalida a primeira. A Promise da primeira então resolve com
  `undefined`, embora as leituras tenham falhado. O coordenador do modal usa
  outro escopo/lane e continua atual; por isso limpa o estado pendente e fecha.

### Reprodução determinística executada

```powershell
# Dentro de controle-financeiro-frontend
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts cf015-revalidation-overlap
```

1. Montar `useCards` e `PayInvoiceModal` reais; carregar cartão/fatura de 100.
2. Confirmar pagamento; a fronteira do serviço responde 200 uma única vez.
3. Reter a releitura da fatura. Clicar fechar e enviar Escape: ambos preservam
   o modal enquanto há reconciliação pendente (assertion aprovada).
4. Disparar o evento suportado `refreshCards`, iniciando outra releitura.
5. Rejeitar, nesta ordem, a primeira e a segunda leitura com 503.
6. Esperado: `onClose` não chamado, mensagem de pagamento confirmado com
   reconciliação pendente, recuperação somente por leitura.
7. Observado: **`onClose` chamado uma vez**. O teste falha na assertion de
   fechamento; houve exatamente um POST. Não é falha de ambiente ou de import.

Evidências: [teste](../../../controle-financeiro-frontend/tests/component/cf015-revalidation-overlap.test.tsx),
[primeira execução](reconciliacao-sobreposta.log),
[execução com fechamento/Escape](reconciliacao-sobreposta-final.log).

O evento não foi inventado como API de produto: é consumido por `useCards`
e emitido por `CardModalManager.handleCardsRefresh` após mutações. Esses
formulários permitem fechar enquanto a requisição está pendente, de modo que
callbacks tardios podem sobrepor outras operações. O teste controla a entrega
do evento; **não foi executada uma jornada E2E dessa sobreposição**. Os serviços
são mocks de fronteira: o teste comprova o defeito de coordenação/fechamento,
não débito duplicado em PostgreSQL.

Impacto: a interface pode apagar a pendência de reconciliação e fechar o modal
sem ter obtido estado atualizado. O lock/guarda PAID permanece protegido nos
testes de banco; não há demonstração de débito duplicado por este cenário.
Bloqueia encerrar R03 pelo mesmo contrato da revisão original; não depende
de implementar idempotência durável da CF-024.

Sugestão para o executor: preservar a rejeição para o chamador financeiro
quando a leitura é substituída, ou adotar resultado explícito que o modal só
considere concluído após leituras confirmadas. Compartilhar a Promise de uma
reconciliação mais nova exige encadear também suas falhas; não basta ignorar a
anterior. Manter guards contra escrita obsoleta e recuperação sem novo POST.
Não foi implementada correção de produto nesta tarefa.

Contraprova causal: em cópia temporária, propagar incondicionalmente a rejeição
nessa linha fez o mesmo teste passar. O arquivo foi restaurado e o produto
compartilhado permaneceu intacto: [log](sobreposicao-causal-isolada.log),
[hash/restauração](sobreposicao-causal-isolada.json),
[probe](overlap-causality.mjs). Isso isola o mecanismo, mas não substitui a
implementação/revisão completa que cabe ao executor.

## Observações que não viraram novos bloqueios

- `CardModalManager` ainda passa callback sem Promise/ownerId a outro
  `PayInvoiceModal`, mas a busca de consumidores não encontrou acionador de
  `openPayInvoice` fora da declaração do contexto. Não foi promovido a falha
  de jornada ativa; reavaliar se esse caminho for conectado.
- O teste concorrente Java usa duas threads/transações e barreira de início,
  mas não força ambas a alcançar um ponto interno de leitura antes da escrita.
  O vermelho histórico concorrente é conflito de constraint do planejamento,
  não prova direta de dois débitos. O vermelho sequencial comprova ausência
  da recusa PAID. O verde consulta saldo 900, uma transação e status PAID.
  Isso sustenta a proteção localizada, sem certificar toda a CF-024.
- Zoom nativo 200% permanece lacuna de verificação de AC-UI-001/CF-010, não
  defeito visual automaticamente confirmado. Viewport de 180px não o substitui.
