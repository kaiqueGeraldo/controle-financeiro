# Matriz independente de critérios

| Critério canônico | Cenários/caminho | Regra e esperado independente | Prova e conclusão | Reexecução de saneamento |
|---|---|---|---|---|
| 1. Next BFF/Spring/PostgreSQL reais, apenas externos substituídos | A/B/C/E/E2/F/G/H/K/L/T0–2; seleção nova B/C/E/E2/G/H/K/L | Política E2E; commits financeiros reais, sem resposta interna fabricada | Sustentado: configuração, fontes, rede, SQL, schema V1–V16, downloads. E01 completo é fixture PUT via browser/BFF e confirmação UI; não declarar entrevista inteira digitada | Preservar o percurso real nas regressões afetadas |
| 2. Reload/nova sessão recuperam estado e relatório/exportação concilia | A/B/C/F/K/L; R2 | FIN01–04/08, SPEC002; posições exatas, projeções coerentes e horário preservado | Parcial: B SQL idêntico após login, G reload, C monetário correto. K diverge na projeção de limite e L perde identificação de posições; C trunca segundos. Esses defeitos impedem afirmar coerência integrada, sem refutar persistência correta | K/L/C intactos; nova sessão e consumidores relacionados |
| 3. Dois usuários usam app isolados; falhas mantêm invariantes | H/G/E2, R1 e controles de reserva | Ownership, FIN07 e SPEC001 §5/5.1; 404 cruzado, replay de efeito único, aumento incerto rejeitado | H/G sustentados; E2 obtém 204 e grava 0.01 quando deveria rejeitar. É violação da guarda financeira, não vazamento nem duplicação | E2 + fontes independentes/parciais/múltiplas pendências; H/G dirigidos se fronteiras compartilhadas mudarem |
| 4. Evidências/limites; testes sem enfraquecimento | histórico run01–10, contraprovas e revisão | Política de testes: regra antes do expected, falhas preservadas | Sustentado com ressalvas explícitas de observador. B com ticker não substitui L original; soft C/K mantém falha e permite provas independentes. Reruns não somados. Sem skips/retries/timeouts aumentados | Manter provas vermelhas e oracles; não atualizar expected para resultado errado |

## Cobertura real, sem equivalência artificial entre UI e fixture

| Jornada | Cobertura sustentada | Limite |
|---|---|---|
| Cadastro/entrevista | A registra/loga pela UI, contexto digitado/salvo/reload; E01 validado por PUT real e confirmação pela UI | Dados completos da entrevista não são digitados campo a campo; A histórico, não repetido nesta revisão |
| Receita/despesa/transferência | B UI, SQL antes/depois, taxa e pernas; reexecutado | Casos sintéticos específicos |
| Compra/pagamento | B UI; outubro selecionado explicitamente; K comparação E01 | Não extrapolar fatura corrente a principal total |
| Investimento/meta | B UI com identifier opcional declarado; E2 BFF; R1 positivo | L preserva variante sem identifier; sem nova certificação de todos writers |
| Relatório/exportação | C download e OOXML independente; H arquivos de owners distintos | Filtro por conta conserva aceite CF021, sem nova execução CF032 |
| Reload/logout/login | B SQL idêntico; A recibo histórico; K reload/R2 login | Sem restart completo de todos serviços/dispositivos |
| Legado | E complemento sem fabricar transações; E2 bloqueio indevido ausente | UNBOUNDED sintético, não migração de dados reais |
| Recebíveis | F histórico: 80→50→0, 30/50 efetivos em21/22, vencimento05/11 | Reutilizado com inspeção de script/prova e XLSX histórico; não rerun |
| Prazo/hábito | T0–2 histórico, 4→5→4, futuro400, hoje não atrasado | Três fusos/viewport são três variantes, não produto cartesiano completo |
| Falha/reenvio | G novamente: commit antes de abortar, GET, replay200, conflito409 | Sem colisões simultâneas de todas as operações |
| Dois usuários | H novamente: contextos separados, uso intercalado, UI/exports/404/SQL | Snapshot SQL não contém todas as tabelas (por exemplo cadastro do cartão); igualdade significa os campos observados, não dump integral |

## Validade do harness

PostgresTestContainerInitializer cria banco aleatório cf_test_, valida destino
descartável, schema cf032_ exclusivo por execução. Fixtures usam namespace aleatório
e owner por cenário; nenhum saldo depende da ordem. H usa dois contextos, embora
o log anexado ao page principal não capture todos os requests do segundo contexto;
assertions, exports e SQL de B complementam a prova.

Clock de domínio fixo em São Paulo; credenciais usam instante real separado.
Date-only troca Date, mantendo timers/performance/rAF/WAAPI. Pintura espera estado,
opacidade/hit-test e dois frames. Retries=0; limites120s/12s inalterados. O timeout
de15min é teto de processo, não sleep funcional. JVM UTC é imposta após startup,
pois produto define São Paulo ao iniciar; run10 e revisão registram UTC efetivo.

G usa route.fetch para alcançar servidor e lê SQL por conexão observadora antes
de route.abort. Não responde sucesso pré-programado. /legacy é fixture SQL
explicitamente separada; /snapshot e /xlsx observam dados. EmailService e
MarketDataService são as únicas substituições externas declaradas. A fronteira
de segurança do observador é exclusivamente loopback/runtime de teste.
