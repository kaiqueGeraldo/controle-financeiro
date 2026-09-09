# Paridade funcional com a planilha

Leitura estrutural em 07/09/2026, sem importação ou alteração. Os intervalos identificam a referência; nenhum valor pessoal é necessário ao produto.

| Origem | Capacidade observada | Implementação localizada | Lacuna / validação |
|---|---|---|---|
| Contas, B7:F7 e blocos mensais | Item, valor, pago e planejamento de desembolsos | Planejamento, contas, transações | Conciliar previsto, reservado e efetivamente pago; confirmar recorrência e parcelamentos fora do cartão |
| Contas a Receber, B7:G7; B24:G24 | Recebíveis por data, valor e quitação | Transações INCOME e isPaid | Não há domínio específico de recebíveis identificado; validar baixa e previsão sem inflar saldo realizado |
| Controle Anual, B6:G6 e repetições | Entradas, saídas, categoria, saldo diário e acumulado | Extrato, dashboard e resumo anual | Verificar saldo acumulado sobre histórico completo e filtros, não apenas a página carregada |
| Cartão de Crédito, B7:F7 e blocos seguintes | Compras, assinaturas e totais mensais | Cartões, faturas, parcelamentos, categorias | Testar fechamento, vencimento, pagamento parcial, parcelas futuras e dívida inicial |
| Resumo Anual, B4:K11; B15:K22 | Entradas/saídas, cartões, cofrinhos, total investido e valor atual | AnnualSummaryService e annual-summary | API atual expõe valor atual agregado; falta explicitar custo investido versus valor de mercado e referência histórica |
| Metas, B5:L5; P3:Y3; P13:Y13 | Meta final, atual, progresso, status e checklist com preço estimado/pago | Metas monetárias/numéricas e checklist | Progresso inicial não aceito pelo CreateGoalDTO; evitar aporte fictício e duplicação de patrimônio |
| Metas, C14:L37 | Desafio de aportes e acumulado | Histórico de metas/aportes | Desafio específico não encontrado; manter fora da primeira versão, salvo necessidade futura |
| Roda da Vida, B4:G16 | Avaliação por área e comparação com objetivo | Sem módulo dedicado identificado | Fase posterior, conforme prioridade confirmada |
| Presentes, B4:G7 | Ideias por pessoa e preço estimado | Checklist de metas pode cobrir parte | Módulo dedicado adiado |
| Planilha1, A1:M9 | Cálculos auxiliares de conciliação | Sem correspondência obrigatória | Não converter aba auxiliar automaticamente em feature |

## Limites da comparação

Existência de uma tela ou serviço não comprova equivalência de regras nem qualidade visual. Esta matriz inspeciona estrutura e rótulos; não recalcula fórmulas nem certifica a precisão financeira da planilha. Os valores da aplicação precisam de testes com exemplos sintéticos próprios.

O onboarding solicitado é uma evolução da aplicação: não implica recriar o histórico da planilha. Deve cadastrar uma posição inicial com data de referência e origem explícita.
