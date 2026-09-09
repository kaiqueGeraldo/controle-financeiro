# SPEC-001 — Entrevista inicial e posição de abertura

Status: especificação inicial; detalhamento e implementação nas tarefas CF-028 a CF-032, após integridade CF-016/018/019/020 e migrações CF-017. Os IDs T citados neste documento referem-se aos épicos históricos; ver [rastreabilidade](../../../tasks/RASTREABILIDADE.md). Decisões de produto confirmadas em 07/09/2026: consolidar finanças primeiro; metas vinculadas a contas/investimentos; incluir fatura atual e parcelas pendentes.

## Resultado esperado

Após criar a conta, o usuário responde a uma entrevista ramificada, revisa os dados e encontra suas contas, compromissos, investimentos e metas prontos. Não precisa preencher módulos separados nem fornecer transações passadas. Pode salvar, sair e retomar. Usuários existentes continuam acessando o app sem reinicialização forçada.

## Jornada e dados

| Etapa | Perguntas e dados | Regras |
|---|---|---|
| Contexto | Nome preferido, moeda BRL na primeira versão, fuso, data-base e objetivo principal | Explicar que os valores representam a situação na data-base, não entradas do mês |
| Contas | Possui contas bancárias/carteira? Nome, tipo, saldo na data-base, cor opcional | Permitir saldo zero e negativo em conta; reutilizar a carteira padrão criada no registro; não duplicar carteira física |
| Cartões | Possui cartão? Nome, últimos quatro dígitos, bandeira, limite, fechamento e vencimento | Não pedir número completo/CVV; respeitar dias 1–31 e regra para meses curtos |
| Dívidas no cartão | Fatura em aberto, competência, vencimento, quanto já está pago e compromissos futuros | Informar saldo ainda a pagar; explicar o que entra na fatura corrente para evitar duplicar a parcela atual |
| Parcelas | Identificação opcional, valor de cada parcela pendente, primeira competência pendente e quantidade restante | Não gerar parcelas pagas. Permitir ajuste da última parcela para centavos. A parcela corrente entra uma única vez |
| Investimentos | Possui investimentos? Tipo, instituição/conta de custódia, identificador, quantidade, custo total ou preço médio, valor atual e data da avaliação | Renda fixa pode usar saldo aplicado e atual. Cotação externa é opcional e posterior ao cadastro, sem bloquear conclusão |
| Metas | Título, tipo, alvo, prazo, unidade para numéricas, progresso já realizado | Numéricas recebem quantidade inicial; monetárias recebem alocação sobre fontes já cadastradas |
| Destinação das metas | Qual parte de qual conta/investimento financia cada meta? | Soma alocada não supera a parcela disponível da fonte; mesma origem não aumenta patrimônio duas vezes |
| Previsões | Receitas/despesas recorrentes e contas a receber atuais, opcional | Criar compromissos/previsões, não transações realizadas. Não exigir para concluir |
| Revisão | Lista editável, saldos de abertura, investimentos, dívida, patrimônio e valores destinados a metas | Mostrar inconsistências por etapa/campo. Confirmar apenas com referências válidas |

Ramificação: “não tenho investimentos/cartões/metas” pula os detalhes; “preencher depois” preserva o rascunho. Evitar uma única tela extensa. Hábitos existentes continuam disponíveis após a entrevista; novos módulos de vida ficam fora do escopo.

## Invariantes

1. Abertura de conta não é renda; posição de investimento não é compra debitada de uma conta atual.
2. Patrimônio = ativos efetivos - passivos. Progresso de meta monetária é destinação de ativo, nunca um novo ativo.
3. Exemplo sintético: conta 1.000, investimento 500, dívida 200, meta com 300 destinados da conta → patrimônio 1.300 e 700 livres nessa conta. Não 1.600.
4. Pagamento posterior de uma dívida de abertura reduz caixa e passivo uma vez; relatórios distinguem fluxo de caixa de despesa por compra. Não contabilizar novamente a compra histórica.
5. Quantidades, limites, saldo inicial, custo e preço têm significado distinto. Rendimento anterior à data-base não vira receita do período atual.
6. Alterar uma fonte no rascunho revalida as metas vinculadas antes da conclusão.
7. Dados de outro usuário não podem ser vinculados, mesmo com UUID válido.
8. Operação concluída não pode ser aplicada novamente. Edição posterior usa os fluxos regulares ou ajuste rastreável, nunca replay do onboarding.
9. Sem informação histórica, períodos anteriores à data-base mostram indisponibilidade de posição, não um zero inventado.

## Contrato de API proposto

Endpoints novos, ainda não implementados:

- `GET /onboarding`: status, versão, etapa atual, data-base e rascunho autenticado.
- `PUT /onboarding/draft`: versão esperada e snapshot do rascunho com IDs temporários estáveis; validações por campo. Não cria saldos nos módulos reais.
- `POST /onboarding/complete`: versão esperada e chave de idempotência. Finaliza em uma transação local, resolve referências temporárias e retorna IDs criados e resumo.

Valores monetários dos novos DTOs: strings decimais canônicas, por exemplo `"1000.00"`. Datas civis: `"2026-09-07"`. IDs temporários só resolvem dentro do rascunho daquele usuário. Limitar quantidade de itens/tamanho do payload com mensagem clara; não deixar importação ilimitada em uma transação.

Estados persistidos: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`. Pular é explícito e pode ser retomado se não finalizado. Contas legadas com dados devem receber uma jornada de complemento, sem aplicação automática de novos saldos sobre os antigos.

Erros: 400 com caminhos de campos inválidos; 401 não autenticado; 404 para referência inexistente/inacessível conforme política uniforme; 409 para versão divergente ou conclusão concorrente diferente. Repetição com mesma chave e mesmo conteúdo retorna resultado anterior. Chave reutilizada com conteúdo diferente retorna 409.

## Persistência e migração

Propor sessão por usuário, versão, payload validado e marca de conclusão; registro de idempotência e mapeamento das entidades criadas. Posições iniciais e alocações precisam de entidades/regras próprias definidas em T-004, com migração versionada em T-005.

Não gravar rascunhos financeiros em localStorage. Persistir no servidor autenticado; limpar cache em logout. Não registrar payload financeiro completo em logs. Não enviar e-mail/cotação dentro da transação de finalização.

## Aceite

- Perfil sem nenhum patrimônio conclui sem formulários obrigatórios desnecessários.
- Perfil com duas contas, renda fixa, ação, meta numérica parcialmente concluída e meta monetária vinculada mostra posições corretas.
- Cartão com fatura atual e três parcelas futuras reconcilia limite comprometido; nenhuma parcela paga é recriada.
- Queda de rede e reenvio após commit não duplicam contas, posição, dívida ou metas.
- Duas abas finalizando simultaneamente produzem uma única conclusão.
- Falha no último item desfaz toda a confirmação; o rascunho continua disponível para correção.
- Recarregar/voltar etapa mantém respostas; mudar conta invalida alocação incompatível.
- Dados de outro usuário são rejeitados; sessão expirada preserva o rascunho do proprietário.
- Usuário legado mantém seus dados e acesso; aplicação de abertura não ocorre automaticamente.
- Desktop e celular permitem concluir usando teclado, com foco em erro, rótulos e resumo final legíveis.

## Fora de escopo

Importar histórico da planilha, Open Finance, extratos automáticos, recomendações de investimento, múltiplas moedas, cobrança de assinatura SaaS e módulos novos de Roda da Vida/Presentes. SaaS nesta entrega significa acesso autenticado com isolamento entre usuários, não implantação de billing.
