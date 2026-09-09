# Testes que detectam defeitos

## Fonte dos resultados esperados

O requisito, um exemplo sintético calculado independentemente ou o contrato aprovado define o resultado. Nunca importar o helper testado para calcular o próprio expected. Não copiar a fórmula da implementação para o teste. Quando duas interpretações são possíveis, documentar a decisão antes de cristalizá-la como comportamento correto.

Para cada correção, registrar a cadeia: **critério → cenário → falha pelo defeito → correção → aprovação → revisão**. Um teste vermelho por falta de import, banco indisponível ou erro de sintaxe não demonstra que detecta o bug.

CF-005 parte de código já corrigido. Exigir a falha usando a versão anterior adequada ou mutação temporária isolada, sem descartar alterações locais. Se isso não puder ser demonstrado, declarar a lacuna em vez de inventar uma execução anterior.

## Camadas e limites de mocks

| Camada | Deve verificar | Limite |
|---|---|---|
| Unitário | Calendário, arredondamento, cálculo, estado e invariantes | Mock de colaborador externo permitido; não mockar a regra sob teste |
| Componente | Digitar, clicar, erros, foco, acessibilidade e conteúdo apresentado | Mock HTTP permitido para estados visuais; não substitui contrato/API real |
| Contrato HTTP | Payload real, status, campos, tipos, 204 e binário | Serializador/controller reais; expected explícito, sem gerar ambos os lados da implementação |
| Integração | Serviço + ORM + PostgreSQL, constraints, rollback e concorrência | PostgreSQL descartável; H2 não comprova semântica PostgreSQL |
| E2E | Navegador → BFF Next → Spring → banco → reload → nova leitura | Não interceptar com sucesso falso as APIs internas do fluxo financeiro verificado |
| Funcional exploratório | Fluxos e estados não previstos, usabilidade e comparação de telas | Seguir roteiro e registrar achados; “cliquei e funcionou” não basta |
| Visual | Geometria, texto, sobreposição, responsividade e regressão | Inspecionar capturas; novo screenshot não é automaticamente o esperado |

Sugestão de ferramentas a validar em CF-002/003: testes Java/JUnit com PostgreSQL via Testcontainers ou serviço descartável; testes Node existentes preservados; React Testing Library/Vitest para componentes; Playwright para navegador. Confirmar compatibilidade com versões do projeto antes de instalar. Usar doubles determinísticos apenas nas fronteiras externas, como cotação/e-mail, nunca enviar e-mail real nos testes.

## Dados, datas e determinismo

- Fixtures sintéticas, IDs/usuários isolados por teste e seed reproduzível. Teste não depende da ordem de execução nem de saldo deixado por outro teste.
- Relógio controlado, nunca hardcode de “data futura” que passa a ser passada no ano seguinte.
- Datas civis separadas de instantes e competências. Matriz mínima: São Paulo, UTC e UTC+14; incluir JVM UTC com navegador São Paulo e relógios próximos da meia-noite.
- Casos: 23h59→00h00, 28/29 de fevereiro, dias 30/31, dezembro/janeiro, prazo hoje/ontem/amanhã. Se houver timestamps históricos com offset, testar offsets distintos e origem conhecida.
- Dinheiro com escala explícita, centavos e valores negativos quando admitidos. Oracle financeiro independente: conta 1.000 + investimento 500 − dívida 200 = patrimônio 1.300; destinar 300 da conta a uma meta não altera patrimônio.
- UI: 360×800, 768×1024, 1440×900; claro/escuro; privacidade ligada/desligada; sem dados, muitos dados, texto longo, loading e erro. Uma matriz de casos atribuídos às telas substitui a explosão cartesiana indiscriminada.

## Proibições de enfraquecimento

- Não remover assertion, substituir valor esperado pelo observado, adicionar skip/only, desabilitar regra ou aumentar tolerância para esconder regressão.
- Não mascarar datas, saldos ou status que o teste deveria verificar no snapshot.
- Não aumentar timeout/retry sem prova de latência legítima; esperar evento/estado observável em vez de sleep fixo.
- Não mockar fetch/API/serviço central em um teste rotulado E2E integrado.
- Não renovar snapshots em massa sem comparar as diferenças e associá-las a mudanças intencionais.
- Não usar percentagem de cobertura como prova de correção. Lacunas de ramos críticos exigem cenários; linhas triviais não justificam testes artificiais.

Mudança legítima de requisito pode alterar um teste: registrar a razão, atualizar a especificação e manter a evidência do comportamento anterior. Quarentena de flaky, se indispensável, exige bug rastreado, dono, prazo e risco; teste essencial em quarentena impede o gate correspondente.

## Capacidade de detectar regressões

Em CF-001 definir uma matriz critério→teste. Em cada correção demonstrar o caso falhando pelo defeito. Em CF-015/033 revisar testes e aplicar mutações específicas em cópia isolada: remover timezone, voltar a toISOString para hoje, trocar `<` por `<=`, retirar filtro isPaid, duplicar parcela, ignorar ownerId ou idempotência. As mutações devem ser eliminadas pelos testes relevantes; se sobreviverem, adicionar cenário ou justificar equivalência. Não implantar mutação em runtime compartilhado.

Não impor mutation score de 100% indiscriminado. O objetivo é detectar alterações plausíveis nos riscos identificados. Salvar resultado, diff temporário e prova de restauração da cópia.

## Aceite de uma tarefa

Critérios cobertos e limites documentados; comandos reproduzíveis; evidências antes/depois quando há bug; testes de erro/borda apropriados; nenhum mock neutralizando a regra; nenhum snapshot aceito sem inspeção. Para cenários E2E, verificar persistência após reload e consistência entre telas, não somente toast/HTTP 200. Aplicação e dependências precisam estar na revisão exata que foi testada.
