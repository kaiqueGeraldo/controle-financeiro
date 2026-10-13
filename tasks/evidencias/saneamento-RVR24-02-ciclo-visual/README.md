# Saneamento dirigido — P2 confirmado CF014, ciclo visual da operação (vínculo RVR24-02)

Executor, 13/10/2026. Base cbbf58df6d4034d8c28fd813fc3d7948f4c7da2e, branch codex/cf-028-contrato-onboarding. [Parecer independente de origem](../revalidacao-residual-RF15/ACHADOS.md). Não é aprovação independente, nem reabertura dos aceites anteriores de RVR24-02/RF15. CF011/012 continuam concluídas; CF014/015 permanecem em_revisao. Zoom, RVA-03 e ocorrência de histórico invisível seguem separados.

## Causa e sequência reproduzida

O InvestmentModalManager mantém OperationModal montado. A execução de BUY A captura onClose, que chama closeOperation e limpa a seleção global do modal. Depois do await, a validação do recibo confirma A, mas onClose não distingue o ciclo visual que iniciou a operação do ciclo atualmente aberto. Não era callback financeiro inválido: onSuccess e resolução do envelope confirmado são legítimos na mesma sessão.

Prova original, intacta: abrir ativo REVISA, informar quantidade2/preço10 e conta1000; enviar e reter entrega HTTP após route.fetch confirmar commit real; Escape na operação, Escape no detalhe; abrir detalhe/operação REVISB; liberar a resposta válida A. Antes: onClose chamado uma vez no componente e formulário B removido no browser, com detalhe B conservado. Um POST, recibo correspondente, A quantidade2/custo20, conta980, B zero, um movimento. Nenhuma duplicação demonstrada. Depois: refresh/recibo confirmados, B permanece aberto.

## Identidades e responsabilidades

| Identidade | Escopo e invalidação |
|---|---|
| Usuário/sessão | useCreationIntent conserva sua proteção original por owner, desmontagem e sinais de sessão. O consumidor também captura um escopo local para proteger UPDATE_BALANCE, que não usa recibo de criação; troca de owner, expiração/sinal de sessão ou unmount invalida callbacks locais/globais daquele escopo. |
| Entidade | asset.id identifica o investimento. Refetch de outro objeto com o mesmo ID não reinicializa o formulário. Só ID não distingue A→B→A. |
| Instância visual | Token por ciclo React comprometido de isOpen/asset.id/owner. Nasce em layout effect; cleanup o invalida. Fechamento explícito o invalida imediatamente antes de onClose. Reabertura, mesmo para A, recebe outro token; não se altera operationId. |
| Execução | Symbol local de submissão impede o finally de A de liberar o lock de B. O loading só é alterado se o token visual capturado ainda vale. |
| Intenção financeira | operationId UUID e payload congelado por useCreationIntent antes do POST. Mantidos até resultado validado; retry repete exatamente a mesma intenção; GET autenticado recupera o recibo. Nenhuma mudança no store, serviço ou backend. |

## Correção e trade-offs

Única fonte de produto alterada: operationModal.tsx. Captura sessão e instância antes de submit/recover/retry. Confirmação válida na mesma sessão continua disparando atualização global; fechamento e toast local dependem da instância vigente. Unknown/rejected continuam reconciliando na mesma sessão. Resultado desconhecido preserva UUID/payload e bloqueio já existente para novas intenções desse tipo, exibindo explicitamente “Operação anterior”; não é erro atribuído a B e não cancela o commit no servidor.

Recuperar A a partir de B resolve A e atualiza dados, sem fechar B. Recuperação iniciada no próprio A fecha normalmente se o ciclo ainda é o mesmo. Trocar sessão/desmontar conserva as regras anteriores: resultado obsoleto não resolve envelope local nem chama consumidores; recuperação posterior continua autenticada. Nenhum AbortController é usado como prova de cancelamento financeiro.

Releitura global conserva seleção/detalhe pelo código já aceito; objeto novo do mesmo ativo preserva rascunho. Cobertura inclui B em uma nova operação enquanto a reconciliação A ainda termina, verificando sua identidade e loading. UPDATE_BALANCE também percorre o mesmo submit, por isso recebe a proteção visual/de sessão, sem introduzir recibo/retry inexistente nesse contrato.

Custo adicional O(1) por execução e mudança de ciclo; tokens/escopos locais, sem query, polling ou N+1 novo. Dois listeners de sessão do consumidor têm cleanup e complementam o lifecycle financeiro existente para a avaliação sem recibo. Trade-off: pequena duplicação da assinatura de sessão para limitar a mudança ao consumidor; extrair abstração global ampliaria a regressão sem necessidade demonstrada. Não houve refatoração geral, bloqueio de navegação nem protocolo backend novo.

## Provas e resultados

BASE.json registra staging inicial vazio, README preexistente e HEAD sem posteriores; ancestralidade confirmada. original-hashes.json inventaria119 arquivos da revisão independente e seus probes. Hash do README raiz: 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.

| Execução | Resultado/alcance |
|---|---|
| component-before.log | Prova independente vermelha: onClose chamado uma vez; demais critérios preservados. |
| adversarial-before.log | 8 falhas/5 passagens nos primeiros13 casos: troca/reabertura/recuperação e loading de outra avaliação detectam causas; fluxo normal e limites de sessão já passam. Casos adicionais posteriores são regressões, não alegados como vermelhos anteriores. |
| browser-before.log | Não executou cenário: timeout120s de prontidão Next. Diagnóstico separado /auth retornou200 em servidor local com backend loopback inativo. Nenhum timeout aumentado; causa do primeiro atraso não estabelecida. |
| browser-before-ready | Prova original vermelha em expect(next.modal).toBeVisible; recibo, JSON, captura e SQL preservados. |
| components-first.log | 74 testes passaram, incluindo probe original e recuperação/lifecycle. |
| browser-after-original | Quatro provas originais passaram: hábito legítimo, investimento confirmado, resposta perdida/recuperada e resposta tardia A→B. |
| browser/after | Três jornadas novas passaram: A→B→A, unknown A recuperado a partir de B e recuperação A retida enquanto B fecha/reabre. Um POST por fixture; recibo, conta980, A2/custo20, B0, histórico único após reload. |
| components-final.log | Primeira seleção ampliada: 219/219. |
| browser/paint-observation | Observação sem operação financeira: opacidade do modal ficou0 em sete amostras e depois1; captura final mostra a camada. Não é causa demonstrada para o histórico invisível nem correção dessa investigação. |

As primeiras capturas de browser-after-original/browser/after mostram só detalhes embora os snapshots contenham operação e as assertions funcionais passem. São insuficientes para certificar pintura do formulário. O complemento exige opacidade observável1 antes da captura com o timeout de assertion existente; não remove a limitação das provas anteriores. Ver VISUAL.md e resultados finais no encaminhamento.

Lint inicial apontou warning de leitura de ref mutável no cleanup. O ciclo passou a usar token de instância invalidado diretamente no cleanup, sem suppress/ignore e sem confundir instância com entidade. A suíte final e navegador são reexecutados após esse ajuste. Fontes independentes nunca foram alteradas.

## Resultado na implementação final

- components-verified.log: 217 passagens e dois timeouts de5000ms em auth-settings-accessibility e cards-planning-audit, sem falha de assertion funcional. components-isolated.log: os dois arquivos passaram integralmente (13/13) com um worker, mesmas assertions e mesmo prazo, sem retry automático. Os 19 casos novos e a prova original passaram na rodada final. Não se apresenta a execução ampla final como219/219 verde; a execução anterior219/219 está preservada separadamente.
- browser-final.log e browser/final: sete jornadas passaram (três complementares e quatro originais: confirmado, perdido, resposta tardia e histórico/Escape/foco). Maven BUILD SUCCESS. persisted.txt acrescenta correlação UUID/recibo, movimento e lançamento bancário; cada fixture complementar conserva um POST, conta980, A2/custo20, B0 e histórico único após reload.
- static-results.json: lint, typecheck e build finais com exit0. Nenhuma mudança de produto após essas verificações.
- VISUAL.md registra todas as capturas finais inspecionadas, inclusive imagens insuficientes. Pintura integral de todas as capturas não foi demonstrada; não há encerramento da investigação visual por associação.
- Credenciais sintéticas nos logs/traces publicados são sanitizadas pelo script local, com hashes antes/depois em sanitization.json. Provas independentes são externas a essa sanitização e permanecem intactas.

## Pendências fora do saneamento

Zoom nativo200 não executado. RVA-03 inconclusivo, sem nova hipótese nem repetição de pagamentos. Opacidade/histórico invisível permanece investigação separada; nesta rodada observou-se atraso de pintura de camada, sem comprovação de causa comum com fechamento obsoleto. Sem onboarding, tarefa posterior, push, deploy, banco real ou autoaprovação.
