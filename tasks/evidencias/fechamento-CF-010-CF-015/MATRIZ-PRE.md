# Matriz pré-execução — 10/10/2026

Base: codex/cf-028-contrato-onboarding, 62ca2366053d04cb74abf4b7442669ec223fa160. a7bc256 é ancestral; HEAD não avançou. Staging vazio. Único delta inicial README.md, SHA256 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA. Nenhuma edição de produto autorizada.

V = revalidacao-CF-015 (681102b), P = revalidacao-CF-015-RV01 (e4079a9), J = revisao-CF-022-CF-023 (9ff1aec), Q = revisao-CF-025-CF-027-RV24 (06c1a51), T = revalidacao-RD58 (0c068d9), I = revalidacao-RVR24-01-propriedades (b5e8550). Referências relativas a tasks/evidencias. Aceite CF-028 em 62ca236 exclusivamente documental.

| Etapa/tarefa/critério original | Tela/fluxo | Aceite existente/base e prova reutilizável | Deltas relevantes | Lacuna atual e verificação dirigida | Resultado inicial | Condição de encerramento |
|---|---|---|---|---|---|---|
| A/010/360px, zoom, teclado | UI comum/sidebar/formulários | V R08/R10/R12 foco/geometria | CF026 consumidores; modal comum sem nova regra | 360/768/1440, temas e zoom nativo; inspecionar capturas | Verificação faltante | Ações acessíveis, sem recorte impeditivo e zoom confirmado |
| A/010/foco, retorno, scroll | Fatura e pagamento aninhado | V R08; P preserva reconciliação | Intenções de pagamento | Confrontar fixture longa/Tab/Escape/fundo | Verificação dirigida | Confirmação alcançável e retorno correto |
| A/010/claro-escuro e evidências | Modais/layout | V capturas e mutações causais | CF026/valores decimais | Novas capturas dos consumidores alterados | Verificação faltante | Inspeção, sem mascarar valores |
| B/011/mobile/teclado/validação | Auth/configurações | V R07; J sessão | CF026 auth/hooks | Fluxo mobile recuperação; erros locais/remotos | Verificação faltante | Formulário operável e erros distinguíveis |
| B/011/preferências reload/erro | Configurações | V perfil; componentes CF011 | CF026 handlers | Salvar via BFF/PG, reload; falha sem sucesso fictício | Verificação faltante | Persistência real e erro recuperável |
| B/011/recuperação e download | Recuperação/exportação | CF008 binário; J sessão; RV24-02 exclusão aceita | Sem redesenho auth | Caixa falsa com backend real; código inválido/válido/reutilizado; download falho | Verificação faltante | Fluxo completo sem envio real; sem arquivo falso |
| C/012/datas/moeda/privacidade | Dashboard/contas/extrato lista e detalhe | V R02/R12; T temporal; J CF021 agregados | CF026, precisão decimal, criação I | Valores extensos/negativos, privacidade, detalhe/reload | Verificação faltante | Superfícies protegidas coerentes com contrato |
| C/012/erro/retry | Três telas | V e CF012 componentes de estados | CF026 providers | Reexecutar consumidores dirigidos; captura vazio/loading/erro | Verificação dirigida | Falha nunca apresentada como zero legítimo |
| C/012/filtros/páginas/totais | Extrato | J F018 encerrado | Decimal/CF026 | Lista longa; seleção coerente; não recalcular financeiro | Verificação dirigida | Total com escopo correto e navegação operável |
| D/013/competência e reload | Cartões/planejamento | T temporal; P; V R05/R06 | Pagamento/decimal/CF026 | Faturas vazia/aberta/parcial/paga, edição, mobile | Verificação faltante | Estado e mês preservados após leitura/reload |
| D/013/lista longa e erro | Fatura/modais | V R08, P recuperação | Intenção/recibo | Visual longo e erros componentes | Verificação dirigida | Ações acessíveis; erro recuperável |
| D/013/RVA-03 | Sequência pagamento20→120 | Residuais: original pós-commit, cópia posterior sem POST | Não há correção causal aceita | Uma sequência passiva UI/rede/SQL no runtime original | Investigação inconclusiva | Identificar causa; verde isolado não encerra |
| E/014/meta concluída/hoje e vazio/erro | Metas/investimentos | T RD58; J CF020/021; I criação | Temporal/decimal/CF026 | Tipos de meta, status, estados e modais | Verificação faltante | Estados contratuais e operação visual coerente |
| E/014/calendário e modais | Hábitos/metas | J backend DEC08 | CF025 LAZY; CF026 | Clique semanal correlacionado DOM/rede/PG; H24 separado | RJ-022-01 inconclusivo | Classificar ocorrência sem atribuir ao scheduler |
| E/014/nota reload/posição | Resumo anual | V R01/R04 SQL/reload; J posição; T ano inicial | Decimal/CF026/RD58 | Reutilizar nota/posição; conferir deltas e seleção | Verificação dirigida | Nota confirmada persiste; posição desconhecida explícita |
| F/015/bloqueantes/testes causais/relatório | Marco integrado | V/P/T/I mutações e jornadas reais | Deltas acima | Parecer por tarefa, achados/lacunas separados | Em revisão | Todas as obrigações essenciais comprovadas; sem CF017 como veto automático |

Fixtures: usuários example.invalid exclusivos por execução, schema PostgreSQL descartável; email/mercado falsos; sem dados reais. Casos de estado usam componentes ou falhas HTTP explícitas, nunca sucesso interno falso nas provas financeiras. Browser Chromium São Paulo, JVM UTC; provas temporais adicionais reutilizadas onde sem delta invalidante. Execução sequencial A–F, com resultados intermediários. Evidências duráveis nesta pasta, nunca target.
