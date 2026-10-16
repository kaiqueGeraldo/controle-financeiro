# Causalidade e limites históricos

## Contrato e configuração efetiva

O diff ad1d6f8 altera apenas `start(goal-card-*)` no teste de saneamento:
`page.clock.setFixedTime` vira `setCivilDateOnly`. Nenhuma assertion, timeout,
retry, configuração de animação ou fonte de produto mudou no intervalo candidato.
Os quatro probes ae965aa são coletores: seu resultado verde não afirma quatro
fechamentos corretos. A classificação exige ler JSON, WAAPI, SQL e imagem.

No Playwright instalado 1.63.0, `coreBundle.js`, `Clock.setFixedTime` chama
`_installIfNeeded`; a fonte injetada instala Date, timers, performance, rAF e
demais APIs do Clock. O log de instalação é reaplicado nas navegações, conservando
ticks. A timeline nativa do novo documento tem outra origem. Motion 12.33.0,
`frameloop/sync-time.mjs`, usa frame timestamp/performance.now; os arquivos
`NativeAnimationExtended.mjs` e `NativeAnimation.mjs` transferem esse início para
`animation.startTime`. Antes do início futuro, a saída permanece no primeiro
keyframe e AnimatePresence retém os filhos até a conclusão.

O helper Date-only usa Proxy de Date em addInitScript, instalado antes do cadastro
e das navegações, portanto antes da montagem dos componentes. `new Date()` e
Date.now fixos; construtores com argumentos, parse e UTC preservados. Não substitui
timers/performance/rAF/timeline. Referência: 15/01/2027 12:00Z = 09:00 São Paulo,
competência janeiro, fechamento20/vencimento28. Backend fixo no mesmo dia com
fração .123456; BFF autenticação compatível. Não se promete fidelidade de toda API
Intl sem argumento nem testes de passagem de dia, expiração ou avanço de timers.

## Fluxo confrontado

`PayInvoiceModal.handleSubmit`: intenção imutável em storage → POST → confirmed →
await onSuccess → verificação da geração → limpar intenção → onClose → finally.
`useCards.refreshAll` aguarda leituras e rejeita lote substituído/obsoleto; o
callback da tela retorna essa Promise. O primeiro hook de PayInvoiceModal é
isLoading. O observador percorre a raiz **stateNode.current**, não o alternate
preso ao nó DOM. isOpen=false/isLoading=false com storage limpo separa a saída
React concluída de uma reconciliação pendente nesta reprodução. Não mede spans
internos do handler; os passos internos são inferidos do fluxo e estado comprometido.

A consulta do recibo pelo runner não prova consumo pelo app; o estado React é
necessário. SQL posterior por conexão independente prova persistência do efeito,
não o instante exato do commit. Correlacionar por operationId, cartão, usuário,
recibo e bankTransactionId; não subtrair relógio do runner do relógio do browser.

## Equivalência e atribuição

Trace original reaberto nesta revisão por `inspect-original.ps1`, somente leitura.
O POST do cartão49a7567c-1e98-436e-a20d-d9fc5cdd769c retorna200 em132,445ms:
operação785387bd-b62f-4904-8bc1-28228da40998,
recibo846cedb6-9e6c-47b0-9b6b-fb33b590859f,
débito3e9acf5e-fb53-4d7e-91cf-d632fb26b100, valor120. Nove reads posteriores200,
SQL880/0 e imagem com spinner/controles desabilitados. Snapshot terminal
opacity1/scale0.8 é compatível com saída retida; não prova React fechado no passado.

Mesma preparação: conta1000/cartão1000/meta1000, item120 comprado em uma parcela
pela UI após reload, navegação para cartões, janeiro, adiantamento120. O caso20
usa outro usuário, não é pagamento anterior na mesma dívida. Os cinco blobs de
pagamento/modal/useCards/coordenador/reconciliação são iguais entre3d64e7a e18c7150,
reconferidos em source-comparison.json. Mudanças posteriores no serviço de cartão
são ownership/reorder e closingDate no DTO; não saneamento de saída do pagamento.

Exposição controlada antes da navegação:25s no probe, contra17,808509s entre
instalação e navegação no trace original (relógio do runner). Não são exposições
numericamente idênticas, nem reprodução integral do runtime histórico. A condição
relevante é origem acumulada suficiente para ultrapassar expect15s. Original20
pode passar ou falhar conforme duração de preparação; não usar seu verde como
controle causal. Date-only conserva data e relógios monotônicos nativos, isolando
a variável. Data nativa pura mudaria a competência frente ao backend2027; não
acrescenta poder discriminante necessário nesta matriz.

Conclusão retrospectiva deve permanecer inferência sustentada. Original não
gravou React/WAAPI; não há como demonstrar seu onClose retroativamente. Isso não
exige manter a investigação indefinidamente se mecanismo próprio, compatibilidade
e controle forem suficientes. CF014 é precedente de origem temporal, com outro
elemento/sintoma (entrada invisível); não transfere seu aceite para este caso.

## Experimentos distintos e trade-offs

O antigo experimento0099185/.r3 parou antes do POST por portal/página sem estilos,
com1000/120 e zero recibos. As repetições115748ae e closure-62b8079c passaram sem
isolar causa. A preparação inválida run-01 desta revisão também não é RVA-03:
zero card_payments. Seu scanner CSS encontrou0 arquivos por `.rv3/.gitignore=*`;
trocar apenas essa exclusão recuperou322 arquivos/5582 candidatos, incluindo
flex/fixed. Evidência em isolation-scanner.json. Produto permaneceu intacto.

Date-only é correção pequena e adequada a jornadas de data civil fixa; perde a
capacidade de controlar passagem de tempo, que não é requisito deste recorte.
Evita desativar animações ou prolongar timeout. Não afeta erros HTTP, loading ou
recuperação reais: esses estados continuam governados pelo produto, com aceites
R03/RV01 preservados. Não há motivo demonstrado para refatorar domínio ou locks.
Observador Fiber custa O(n) por amostra e depende da build React de desenvolvimento;
não deve virar contrato de produto. As jornadas históricas sem Fiber complementam
esse limite. Nenhuma nova query/N+1, contenção ou mudança de Big-O de produto.
