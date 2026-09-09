# Modelos sugeridos por responsabilidade

Recomendações em 07/09/2026. Os IDs abaixo estão no catálogo disponível desta sessão. A divisão por tarefa e os níveis de esforço são julgamento de engenharia para este repositório, não benchmark ou garantia de desempenho.

| Modelo | ID | Uso neste plano | Esforço inicial |
|---|---|---|---|
| GPT-6 Astra | gpt-6-astra | Regras ambíguas, contratos temporais/financeiros, desenho de onboarding e revisão crítica de marcos | xhigh; high na liberação delimitada |
| GPT-5.6 Sol | gpt-5.6-sol | Implementação de serviços, testes integrados, concorrência, migrations e E2E | high; xhigh em dinheiro/idempotência |
| GPT-5.6 Terra | gpt-5.6-terra | Correções visuais delimitadas, componentes comuns e dívida de lint frontend | high, elevando para Sol se surgir acoplamento inesperado |
| GPT-5.6 Luna | gpt-5.6-luna | Opcional para índice, links, documentação mecânica e organização de evidências já validadas | medium |

Não atribuí a Luna uma correção principal desta rodada: os riscos em análise envolvem dados financeiros, relógio ou UI com comportamento. Isso é uma escolha conservadora para o escopo, não afirmação de incapacidade do modelo.

Usar Astra em todas as tarefas é uma opção, mas concentrá-lo em decisões/revisões e usar Sol/Terra em escopos claros tende a aproveitar melhor o orçamento. Medir retrabalho real antes de trocar qualidade por economia. Não há estimativa de preço/quota do Codex neste plano e preços de API não devem ser usados como equivalência de consumo da assinatura.

## Critério de escalonamento

Terra→Sol quando uma correção de apresentação exige redesenhar contrato, estado assíncrono compartilhado ou regra financeira. Sol→Astra quando houver conflito de invariantes, migração com origem de dados incerta ou duas hipóteses arquiteturais com impactos diferentes. A tarefa deve registrar a justificativa; aumentar esforço não substitui obter evidência.

Revisor indicado no arquivo significa outra execução dedicada, preferencialmente com contexto inicial da especificação, critério e diff. Usar o mesmo modelo em outra execução é aceitável; trocar nomes de modelo não comprova revisão independente. Os marcos CF-015 e CF-033 concentram a revisão mais ampla para evitar multiplicar trabalho sem necessidade.

## Fontes e limites

OpenAI descreve [GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra) para trabalho complexo ponta a ponta, [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol) como flagship da família, [GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) pelo equilíbrio entre inteligência e custo e [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) para volume com sensibilidade a custo. A escolha concreta para este código é uma inferência minha a partir desses perfis e dos riscos encontrados.

Configurar modelo/esforço ao iniciar a tarefa; os arquivos não mudam configurações automaticamente. Revisar disponibilidade no seletor se a conta/host mudar. Não foi solicitado migrar a aplicação para usar APIs de IA.
