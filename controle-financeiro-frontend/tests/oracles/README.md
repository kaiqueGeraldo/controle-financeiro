# Oracles CF-001

[cf001.json](cf001.json) contém somente dados sintéticos e expected literais derivados da [SPEC-003](../../../docs/sdd/specs/003-criterios-oracles.md). Não importa helpers, não consulta API/banco, não inicializa a aplicação e não representa DTOs definitivos. Casos `D-*` são temporais, `F-*` financeiros, `V-*` visuais e `H-*` de HTTP. Cada caso referencia critérios e fonte. Cenários somente documentais ou dependentes de decisão permanecem na matriz; não adicionar um expected exato inventado para completar JSON.

## Consumo pelas próximas tarefas

1. CF-002/003 devem preparar adapters para fixtures. Usar `cf001-v1` com namespace externo por execução/teste (banco/schema ou remapeamento determinístico dos IDs), mantendo A e B distintos. UUIDs literais só podem ser usados diretamente em ambiente exclusivo. Nunca compartilhar banco mutável entre suítes.
2. Criar autenticação sintética local para A/B via harness; os e-mails `example.invalid` não autorizam envio real. Não há senha, token ou conta remota neste arquivo. Fonte de investimento não depende de cotação externa; provedor de e-mail/cotação deve ser um double de fronteira.
3. As entidades descrevem a posição F-OPEN de A e a sentinela F-USER-B. Nomes de conta são iguais de propósito: selecionar por identidade/proprietário, não por nome. F-ZERO/F-NEGATIVE são variantes isoladas de B, não eventos acumulados sobre `42.17`. Cada teste começa em estado conhecido e limpa somente seu namespace.
4. F-PAY/F-PENDING partem da posição persistida F-OPEN em ambientes separados. F-ALLOC/F-REPLAY/F-ROLLBACK partem de rascunhos com os valores de F-OPEN, antes de aplicar a posição real; F-DRAFT já tem snapshot versão 3 salvo no servidor (não prescreve incremento de versão de um PUT). Carteira padrão do registro preexistente deve ser preservada. Contar apenas entidades/efeitos novos da confirmação.
5. Relógio congelado: usar o instante literal de D-CLOCK e o fuso da linha. `localNow` de D-DEADLINE descreve componentes locais naquele fuso, não um timestamp legado para converter arbitrariamente. JVM UTC/browser São Paulo e UTC+14 são cenários de integração futuros. Não usar o relógio real para decidir se o prazo já passou.
6. Os testes do produto devem comparar a resposta real com os literais; não importar cálculo/serializer da aplicação para gerar o expected. Dinheiro em strings de escala 2; não converter para float para calcular totais. O adapter legado de number deve ser verificado pelo contrato CF-008/016.
7. `V-LONG.manyRowsRecipe` produz 100 registros determinísticos numerados 1–100, IDs distintos no namespace e descrições com o prefixo; não cria dívida/renda por si só. Paginação e totais financeiros requerem dataset da tarefa dona. Nos casos HTTP, body/status são entradas ou propriedades esperadas, não mocks globais. Serialização/controller reais nas suítes de contrato; nada de interceptar sucesso interno no E2E financeiro.
8. Campos `pending*Decision` e `contractRatificationTask` limitam o que pode ser afirmado. Nenhum `skip` oculta a pendência: a evidência da tarefa dependente deve mantê-la aberta até a decisão. Em especial, marcador neutro, fuso do produto, fechamento, replay de operações existentes e contrato proposto de onboarding não se tornam aprovados por este JSON.

## Validação dos artefatos

Da raiz do repositório, com Node 24:

```powershell
node controle-financeiro-frontend/tests/oracles/validate.mjs
node controle-financeiro-frontend/scripts/test.mjs
```

O primeiro comando verifica rastreabilidade F-001–017, critérios únicos, tarefas existentes, referências locais e consistência das fixtures (identidades, fontes, centavos e calendário). É uma verificação do material de especificação, **não teste de domínio/API/UI nem gate financeiro**. Não calcula ou grava expected. O segundo é o runner de testes de helpers já existente, em três processos/fusos. `npm test` continua apontando apenas para esse runner; não foi alterado nesta tarefa.

O validador não substitui leitura crítica de regra, inspeção visual ou execução integrada. CF-003 decide como incorporar novas suítes ao harness e CF-034 ao CI, sem alterar `package.json`/lockfile nesta tarefa.
