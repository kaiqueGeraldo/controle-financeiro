# Evidência CF-023 — isolamento por usuário e sessão

Entrega local validada em 30/09/2026; **em_revisao**, aguardando execução
independente. Base `0219a57`, branch `main`, staging inicial vazio. Única alteração
alheia: README raiz, preservado byte a byte (SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`) e excluído dos
commits. Não houve push/deploy, banco real, comunicação de e-mail ou pentest em
terceiros. Recomendações de modelo do Markdown não alteram a sessão: executor
Codex baseado em GPT-6 da sessão atual; esforço efetivo não exposto.

Código/contrato/testes no commit local
`1b93704f72b9a255075c09d08ea0e97f218f1721`. O commit seguinte registra estas
evidências e o checkpoint, sem alterar a aplicação testada.

Dependências CF-002/008/017 estão integradas e foram liberadas **para execução
local descartável** pela [revalidação dirigida anterior](../revalidacao-CF-016-CF-021-residuais/README.md).
Seus estados/gates de adoção real não foram alterados. Fontes dos expected:
CF-023, AC-FIN-005, AC-UI-004/008 e SPEC-001/002; [decisão DEC-09 e oracles](CONTRATO.md)
fixados antes da primeira correção, [matriz rota/método/referência](MATRIZ.md).

Windows/PowerShell; JDK21.0.12.1 local; Spring Boot4.0.2; Maven wrapper3.9.12;
Testcontainers2.0.3/PostgreSQL16-alpine no Docker Desktop. Schema exclusivo
`cf023_<uuid>` com Flyway V1–V12 e Hibernate validate, sem migração nova. Contexto
de teste geral existente continua separado. Node24.18.0, Next16.1.6,
Playwright1.63.0/Chromium local; browser Brasília, 1440×900, escuro, privacidade
desligada. Clock explícito `2026-09-30T15:00:00Z`, JVM UTC, namespace sintético e
UUIDs novos por caso; truncate somente no schema descartável após cada teste.
Mocks somente Clock e fronteiras externas e-mail/cotação; segurança, serializador,
controllers, serviços, ORM, Flyway e PostgreSQL são reais. Componentes/BFF usam
HTTP/cookies controlados e não são apresentados como integração de banco.

## Resultado entregue e prova causal

| Critério / achado | Antes | Correção / depois |
|---|---|---|
| Identidade JWT / P0 reproduzido | JWT de A autenticava B após e-mail de A ser liberado e assumido por B;401 esperado/200 observado no caso separado | UUID assinado e e-mail emitido precisam corresponder ao mesmo registro;401 e nenhuma leitura de B |
| Header de autenticação / P1 | JWT cru sem Bearer aceitava200 | Somente esquema Bearer, sem diferenciação de caixa, com um token; Basic/cru/extra401 |
| Serialização de perfil / P1 | PUT perfil devolvia `password` pelo getter de UserDetails, com hash sintético; uma falha em3 probes | PUT perfil e PATCH preferências devolvem UserResponseDTO; senha/authorities/código não serializados |
| Referência inacessível / P1 | 18 dos casos iniciais retornavam400 em vez de404 | Ownership lança ResourceNotFoundException por ponto causal, sem classificar mensagem por texto; alheio/ausente têm mesmo status/message/error/fields |
| Reordenação / P1 | Mixed reorder aceito204; contas alteradas parcialmente; cartões/hábitos/planejamento/itens também reproduzidos nos6 probes separados | Todos os IDs e parent são validados em consulta por owner antes da mutação; rollback integral,400 para duplicado/null e controle próprio204 |
| Export / P1 | Conta alheia/inexistente falhava404 no serviço de cobertura, mas export convertia em400 | Repropaga404; workbook legítimo A/B contém só EXPORT-A10/EXPORT-B70; sem planilha de sucesso para erro |
| Mensagem de reembolso / P2 | Alheio404 `Item não encontrado`, ausente404 `Compra de item não encontrada` | Mensagem uniforme; reembolso de compra após excluir item permanece vinculado ao owner |
| Logout entre abas / P1 reproduzido | Cookie apagado e API401, mas segunda aba ainda exibia a contaA após5s | Sinal BroadcastChannel sem payload sensível; limpar perfil/invalidação antes da troca; outra aba limpa e relê B; UI/API/reload/SQL confirmados |
| Expiração/recuperação/erros | Comportamentos existentes não foram presumidos corretos |320 chamadas privadas401; limite exato24h/10min, código A não altera B, consumo único,3 tentativas persistidas, double de e-mail, assertions sobre logs sem segredo |

Primeiro run válido:35 testes,20 falhas,0 erros/skips. O caso de header falhou
antes de alcançar reciclagem de e-mail; por isso a identidade foi separada e
reexecutada. Os6 probes separados falharam6/6 pela regra, não pelo ambiente.
A primeira implementação aprovou40/40; depois os novos probes encontraram
serialização, mensagem de refund e export. [Comandos e resultados completos](EXECUCOES.md)
conservam os vermelhos, inclusive erros de harness distintos de defeito.

## Gates finais

- Backend completo: **345/345**, zero falhas/erros/skips; verify e JAR. Inclui
  **71 testes CF-023**, com50 casos parametrizados alheio/ausente e snapshot SQL,
 320 requests de autenticação, reorders, receipts, XLSX, recuperação e controles.
- Componentes frontend: **157/157** em36 arquivos; quatro novos casos CF-023,
  consumidores de sessão/401/403, BFF e callbacks tardios existentes incluídos.
- Unitários temporais:6 por fuso, **18 execuções** em Brasília/UTC/UTC+14.
- Typecheck, lint focado e build Next aprovados. Primeiro build falhou por
  rede/fontes Google; a execução com acesso às fontes passou, sem mudar layout.
- Browser: **uma jornada integrada** A/logout/B/reload/404/logout/A/reload,
  duas abas, banco após reload e balances1000/2300 via SQL. Capturas
  [B](browser/after/owner-b.png) e [A novamente](browser/after/owner-a-restored.png)
  inspecionadas: perfil/conta/saldo correspondem ao owner e não aparece conta
  alheia. É verificação de isolamento em contas; não auditoria visual de toda UI.
- Mutação isolada: predicado de ownership neutralizado mantendo SQL válido;
  **4/4 testes de reorder detectaram alterações SQL/status**,0 erros/skips.
  [Diff](mutation.diff), [restauração/hash](mutation-state.json), script e log
  permitem reproduzir. Nunca foi inserida na árvore/runtime compartilhados.

Aplicação testada identificada pelos [hashes de fontes/JAR](source-sha256.txt).
São hashes dos bytes de trabalho Windows; o [checkpoint](checkpoint.json)
confere fontes com o commit acima e fornece SHA normalizado LF para fontes/logs,
permitindo verificação depois da conversão CRLF/LF de checkout.
Logs publicados foram sanitizados depois das assertions; [manifesto](evidence-sha256.json)
conserva SHA anterior/publicado. JWT/códigos/senhas sintéticos do auto-dump MockMvc
não ficam nas evidências. A sanitização não oculta campos financeiros/assertions
nos testes nem altera os resultados esperado/observado; as assertions sobre
logs de recuperação foram executadas antes da sanitização.
Alguns diagnósticos Java preservam caracteres substituídos pela codificação de
saída do Windows; contagens, status e assertions permanecem registrados. Não se
reconstruiu texto de diagnóstico para fazê-lo parecer uma nova execução.

## Custos, trade-offs e limites

Reorder usa memória/validação O(n), consulta em lote por owner e parent e ordenação
de lock por UUID (ordenação no banco potencial O(n log n)); depois dirty checking
produz até n UPDATEs. Evita uma busca por ID e navegação N+1 pelo parent na
validação. Entidades ainda podem carregar associações eager do modelo legado;
não se promete um número absoluto de SQLs sem medição. Lock pessimista e
Propagation.MANDATORY preservam atomicidade, mas ordens grandes retêm locks
mais tempo; cargas/limites/concorrência ampla permanecem em CF-024/025.
Paths JPQL são constantes internas, não entrada do cliente. A helper concentra
somente ordenação/ownership, mantendo regras financeiras nos respectivos serviços.

JWT continua stateless: cookie/logout limpa a sessão do navegador; JWT copiado
continua válido até expirar24h. Reset de senha não revoga tokens já emitidos.
Não se introduziu tabela de sessão/revogação sem requisito; esse trade-off precisa
ser considerado antes de produção. Mudança de e-mail invalida o token emitido
com o endereço anterior; fluxo existente de perfil já solicita novo login.
BroadcastChannel foi validado no Chromium local; browsers sem essa API não
recebem invalidação imediata entre abas. Não se certificou background suspension,
outros navegadores, CSRF/carga/brute force/timing, concorrência de recuperação,
todos os casos de exclusão completa de usuário ou toda combinação de domínio.
O inventário401 não equivale a testar todas as permutações de owner e payload;
a [matriz](MATRIZ.md) delimita os ramos sem novo probe independente nesta sessão.
Cacheable financeiro não está ativo na base: provou-se isolamento de leituras
alternadas/BFF/estado React; não se inventou prova de um cache financeiro futuro.
Intenções de reconciliação em sessionStorage permanecem particionadas por owner;
durabilidade, perda de storage e recuperação ampla são CF-024.

O único teste preexistente alterado foi a assertion de meta alheia de CF-022:
BusinessRuleException400 passa a ResourceNotFoundException404 com mensagem
exata, conforme DEC-09. Assertions de dinheiro, data futura, tipo próprio
monetário e ausência de efeitos permanecem. A falha da primeira suíte345 está
preservada e é adaptação de contrato, não remoção de teste para obter verde.

CF-023 está pronta para revisão independente. **Nenhuma tarefa seguinte foi
integralmente liberada**: CF-024/028/029/032 mantêm as demais dependências e o
aceite independente de CF-023. Não foram iniciadas ou alteradas outras tarefas.
Produção continua sujeita a CF-017 e aos gates próprios de release.
