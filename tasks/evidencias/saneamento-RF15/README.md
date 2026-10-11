# Saneamento RF15-01–04 — candidato do executor

Execução local em 11/10/2026. **Não é aprovação independente.** CF-010/012/013/014/015 permanecem `em_revisao`; CF-011 permanece concluída. Nenhum onboarding, push, deploy ou banco real foi executado.

Base `bc5532cffc15f161685c03dae199675b0829c047`, branch `codex/cf-028-contrato-onboarding`. Os commits 22b0e89 e 46189a2 são ancestrais; não existiam commits posteriores nem staging inicial. [BASE](BASE.txt), [plano anterior às alterações](PLANO.md), [parecer independente original](../fechamento-CF-010-CF-015/README.md). O único diff inicial era README.md da raiz, preservado e excluído de todos os commits: SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

## Correções, na associação original do revisor

| Achado / contrato | Causa e reprodução anterior | Correção / consumidores | Provas posteriores e limites |
|---|---|---|---|
| RF15-02, CF-012, AC-UI-003/DEC-06 | Resumo e linha arquivada formatavam 1234.56 sem PrivacyBlur. Probe C vermelho e captura antes em before-targeted; preferência ativa no backend. O wrapper comum escondia cor, mas não excluía texto da árvore acessível. | Contas arquivadas usam o wrapper existente; valor oculto recebe aria-hidden e alternativa “Valor oculto”. Lista/detalhe de extrato protegem também bruto, caixa e restante. Ajuste w-fit mantém sinal negativo junto ao valor no cartão de conta. | Original C verde; contas ativas/arquivadas, normal→privado→normal, PATCH real/reload, dois temas, árvore acessível sem valores. Componente alterna privacidade em lista/detalhe. Preferência continua useUser→PATCH /users/me/preferences→nova leitura, sem regra paralela. |
| RF15-04, CF-013, SPEC-002/DEC-03 de SPEC-004 | UI ignorava dueDate da API e derivava fechamento no mês anterior e vencimento na competência atual. Janeiro/2027: API05fev, UI31dez/05jan/Pagar Atrasada em15jan. Probe D com três assertions vermelhas em before-dates. | InvoiceDetailsDTO passa closingDate já persistido; cardService tipa ambas as datas civis; InvoiceDetails usa formatCalendarDate/isCalendarDatePast existentes, data inválida→—, atraso só com saldo pagável positivo e não PAID. | Original D verde; Clock explícito, janeiro/fevereiro comum e bissexto/dezembro, vencimento23:59:59 e dia seguinte00:00:00, OPEN zerada/PAID/parcial; três fusos, reload e mudança de competência. Backend20 testes, incluindo persistência das datas após alterar dias nominais do cartão. |
| RF15-03, CF-012, AC-UI-001 | Detalhe customizado não registrava diálogo/foco/Escape. Original C confirmou zero diálogos e heading persistente após Escape. | Integra useDialogFocus existente, sem listener permanente; somente topo da pilha responde, defaultPrevented preserva Escape de controles. Fechar durante save é ignorado; em edição cancela primeiro o rascunho pelas regras já existentes; próximo Escape fecha. Acionador do extrato ganha teclado/nome. Valor extenso recebe tamanho mobile e quebra permitida. | Original C verde, teclado real 768/360, Tab/Shift+Tab, cancelamento, retorno; componente aninhado testa camada única, controle com Escape próprio e cleanup. Ver registro visual para limites das capturas. |
| RF15-01, CF-014, AC-UI-001 | Texto do botão Novo Hábito desaparecia em360px; ícone sozinho não fornecia nome. Prova antes em before-mobile. | aria-label “Novo Hábito” e type=button; retira autoFocus concorrente do formulário e conserva acionador montado usando refreshHabits(true) aguardado. | Nome real no browser360, Enter, fechamento Escape, foco inicial/retorno, criação por teclado e reload. Primeiro pós-teste identificou perda de foco; saneada antes da execução after-surfaces. |

### Temporalidade e efeitos financeiros

Fluxo: política gerencial CF-019/YearMonth → Invoice.closingDate/dueDate LocalDate persistidos → CreditCardService → InvoiceDetailsDTO → BFF/JSON literal → CardInvoiceDetails → seleção month/year existente → helpers civis → label/atraso. Não há new Date(string civil), deslocamento de um dia, offset fixo, calendário de emissor ou recálculo com dias nominais atuais. Fechamento29–31 reduz no mês curto e vencimento é estritamente posterior, conforme DEC-03. O campo adicional é escalar já carregado: não adiciona query, N+1, migração ou escrita financeira; custo O(1) por DTO.

A competência inicial e o atraso visual usam calendário do navegador conforme política visual local da SPEC-002; datas civis não carregam fuso. Operações automáticas continuam Clock de produto America/Sao_Paulo; não se aplicou esse fuso globalmente. A UI compara novamente ao renderizar/abrir; a execução não certifica atualização espontânea da fatura deixada aberta atravessando meia-noite sem render. Os testes de fronteira explicitam instantes e datas, sem relógio real como oracle. Fatura OPEN com adiantamento total continua OPEN/zerada, não é confundida com PAID; PAID real foi obtida por Fechamento e recarregada.

### Trade-offs e escopo

PrivacyBlur é compartilhado: preserva layout flex e precisão desligado, remove anúncios monetários quando ligado. O agrupamento usa display:contents somente no modo normal; no privado mantém elemento concreto aria-hidden, pois o probe de árvore acessível expôs valores com contents permanente. O conteúdo continua no DOM/rede; preferência de apresentação não é controle de acesso nem promessa de sigilo. Tema nas capturas de contas foi aplicado explicitamente pelo harness após reload; persistência de tema conserva o aceite CF-011 anterior. A persistência de privacidade foi testada no backend real descartável.

O hook mantém busca O(n) dos controles apenas durante interação do diálogo; nenhuma infraestrutura concorrente ou timer por item foi criado. Os consumidores diretos de Modal, fatura/pagamento e recuperação foram reexercitados. Alterar todo modal customizado de CF-014 exigiria ampliar o saneamento; os resíduos delimitados estão na matriz, sem inventar novos RF15.

## Evidências e execução

- [Execuções e falhas preservadas](EXECUCOES.md), [matriz complementar e impedimentos](MATRIZ.md), [inspeção visual](VISUAL.md).
- [Zoom nativo: limitação técnica e tentativas](ZOOM.md). Aceite pendente, nenhuma aproximação certificada.
- [RVA-03: experimento separado](RVA-03.md). Continua inconclusivo causalmente.
- [Manifesto anterior](provas-originais-sha256.txt) e [conferência posterior](provas-preservadas.json): 187 arquivos íntegros, incluindo provas/relatórios independentes. Assertions, fixtures e expected originais não foram editados.
- [Encaminhamento ao mesmo revisor](ENCAMINHAMENTO.md): intervalo, commits e condições de encerramento. A documentação é um candidato para revisão, não alteração dos aceites históricos.

Três assertions originais de cards-planning-audit continuam vermelhas: fixture sem datas API espera agosto/setembro para competência setembro. Essa derivação conflita com DEC-03 e com RF15-04. Não foram excluídas, relaxadas nem atualizadas para obter verde. A decisão sobre atualização normativa da prova pertence à revisão; os cenários novos usam datas explícitas independentes da função produtiva. Portanto o gate completo de componentes **não é verde**.
