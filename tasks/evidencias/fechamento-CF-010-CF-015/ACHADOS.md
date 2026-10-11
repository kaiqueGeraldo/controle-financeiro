# Achados e encaminhamentos

Base de todos os achados novos: `62ca236`, sem correções de produto nesta revisão. Caminhos abaixo relativos a `controle-financeiro-frontend/`.

## RF15-01 — P2 — acessibilidade — CF-014

Critério: ação de criar hábito identificável em mobile/teclado. Local: `src/screens/private/habits/habitsScreen.tsx:59–64`. Em 360px, abrir Hábitos vazio e procurar botão “Novo Hábito”. O texto fica `hidden sm:inline`, sem nome alternativo no botão. Esperado: nome acessível em qualquer breakpoint; observado: apenas ícone + e botão sem nome na árvore. A primeira execução não chegou a criar hábito nem ao toggle semanal. Evidência: `first-failures/habits-mobile-unnamed.png`, `habits-context.md`, `browser/playwright.log`. Impacto: usuários de tecnologia assistiva não identificam a ação; não é falha de persistência.

Encerrar com nome acessível, criação por teclado em 360px e foco/retorno confirmados. O preparo desktop da fixture semanal não aprova essa ação mobile.

## RF15-02 — P1 — privacidade visual — CF-012

Critério: ocultar valores monetários consistentemente nas superfícies de contas. Local: `src/screens/private/accounts/accountsScreen.tsx:95–96`. Criar conta com 1234.56, arquivá-la, ativar `privacyMode`, abrir Contas em 360px. Esperado: ocultação visual também no resumo e linha arquivada; observado: R$ 1.234,56 legível nos dois locais, enquanto valores ativos são mascarados. Evidências: `browser/targeted/C-private-archived.png` inspecionada e JSON (cor branca, opacity1, filter none), SQL `persisted.txt`, probe vermelho. A assertion de transparência acompanha o mecanismo atual, mas o defeito é estabelecido pela imagem e texto visível, não por uma exigência de implementação específica.

Impacto: contradiz a preferência explícita “Ocultar valores monetários na interface”. Não é alegação de confidencialidade de rede/DOM ou quebra de autorização. Encerrar ocultando ambas as superfícies, com preferência persistida/reload e valores ativos/arquivados em claro/escuro; continuar mostrando valor correto quando privacidade desligada.

## RF15-03 — P2 — acessibilidade — CF-012

Critério: detalhe operável por teclado, Escape e foco coerente. Local: `src/components/screens/extract/transactionDetails.tsx:101–125`. Criar receita1300, abrir detalhe em 768px, Tab, Escape. Esperado: fechar e devolver foco ao disparador; observado: heading do detalhe continua presente, zero elementos role=dialog e botão focado sem nome. O formulário customizado não utiliza o mecanismo de foco compartilhado. Evidências: `browser/targeted/C-detail-after-escape.png`, `C-detail-focus.json`, falha esperada em `playwright.log`. Não se afirmou fuga de foco nem falha de retorno já medida: o fechamento não ocorreu, portanto retorno ficou sem verificação.

Encerrar com semântica de diálogo, nome de fechamento, foco inicial/containment, Escape e retorno em navegador. Preferir reutilizar o hook existente, observando risco de interação com formulários/animações; não criar uma segunda infraestrutura global de modais.

## RF15-04 — P1 — datas e estado financeiro apresentado — CF-013

Critério: mesma competência e datas coerentes entre API/resumo/detalhe. Local: `src/components/screens/cards/invoiceDetails.tsx:87–109` e `130–136`. Contrato: SPEC004 DEC-03, linhas137–146, competência do fechamento e vencimento nominal posterior. Relógio15/01/2027; cartão fechamento31/vencimento5; compra120 em15/01. Esperado: competência janeiro, fechamento31/01, vencimento05/02 e ação sem indicação de atraso. API real confirma dueDate=2027-02-05/status OPEN. Após reload UI mostra FECHA31DEDEZ, VENCE05DEJAN e “Pagar Atrasada”.

Evidências: `browser/final-corrected/D-invoice-dates.json`, PNG inspecionada, `playwright.log` com três assertions vermelhas, `persisted.txt`. Primeira tentativa `browser/final` parou em parse de resposta sem corpo e não é prova de produto; foi preservada.

Impacto: informa atraso inexistente e datas de outra competência, induzindo decisão financeira incorreta; não há evidência de débito indevido. Encerrar consumindo data contratual da API e alinhando fechamento/atraso sem duplicar política financeira na UI; testar fechamento31, fevereiro, virada de ano e reload. Usar campo backend existente reduz divergência em O(1); se fechamento não vier no contrato, explicitar derivação compartilhada ou ampliar DTO com teste, sem redesenhar cálculo de dívida.

## Investigações históricas, sem novo ID de defeito

**RVA-03 / CF-013:** original pós-commit200, débito120/pagável0 com spinner persistente; cópia posterior parou antes do clique, sem POST, portanto não prova a mesma causa. Nesta revisão uma sequência20→120 usou listeners passivos de clique/rede e backend/PostgreSQL reais. Ambos passaram, um POST de pagamento por caso, saldos980/880, sem efeito duplicado. JSON de120 tem paidAmount120/payable0/status OPEN. A captura logo após reload está carregando; não é prova visual de PAID. Evidência `browser/targeted/D-passive-*`, `D-after-payment-*`, `persisted.txt`. Causa permanece inconclusiva, nenhum timeout/retry foi aumentado. Próximo experimento: na reprodução original, correlacionar instante do POST/commit com término de pending e desmontagem de diálogo, sem mudar handlers, fixture ou relógio; interromper após uma sequência. Se não reproduzir, manter incerteza explícita no critério de recuperação pós-pagamento, sem reabrir R03/RV01.

**RJ-022-01 / CF-014, origem CF-022:** ocorrência histórica semanal sem POST não foi causalmente esclarecida. Nova fixture criada em desktop para superar RF15-01, clique semanal em360, POST toggle200 com date2027-01-15; reload marca Feito Hoje, meta0→1, desmarcação/reload volta0. Rede e leituras reais em `browser/second`; SQL final da meta0. Não foi coletada tabela de hábito por SQL, portanto essa persistência se apoia em GET/reload real, não em inspeção direta dessa tabela. Próximo experimento apenas se necessário à reprodução histórica: mesma fixture original, correlacionar hit target/disabled/evento e presença de POST em uma tentativa; encaminhar além dessa fronteira a CF-022.

**H24-01 / CF-022:** timeout de scheduler independente. Nenhuma prova desta revisão o atribui a locks, ambiente ou toggle de UI. Não bloqueia telas independentes. Sem nova execução de scheduler.

## Verificações faltantes e divergência documental

- Zoom nativo200: limitação exata e alternativas examinadas em OCORRENCIAS. Não é defeito demonstrado; afeta CF-010 e aceite integrado.
- CF-013: estado visual PAID não é coberto por adiantamento que permanece OPEN; completar fixture fechada/paga e captura estável após reload.
- CF-014: faltam provas atuais suficientes de modal longo por módulo e meta concluída/vencendo hoje na UI; componente/histórico financeiro não substituem essa verificação. Detalhes em MATRIZ.
- Notas antigas ainda mencionam RV24-01/02 e RD58 abertos. São snapshots históricos superados pelos aceites existentes na base; notas atuais nos arquivos canônicos evitam tratá-los como bloqueantes.

Não foram abertas melhorias estéticas nem revisão de performance geral. A lista de100 comprova navegação e saldo, não complexidade de query nem ausência de N+1. Aproveitar os aceites de agregados evita refazer auditoria backend sem delta relevante; a contrapartida é manter explícito o limite de carga/performance desta revisão.
