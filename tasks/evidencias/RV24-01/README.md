# RV24-01 — saneamento para revisão independente

01/10/2026, America/Sao_Paulo. Base `30211b85db5ecda23f7956ccf8471765056fc4c5`.
Estado: **em_revisao**, sem autoaprovação. CF-027 não foi executada.
README raiz preservado: SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Sem dados reais, email real, push ou deploy; sem subagentes.

## Contrato, causa e correção

Fontes: política de testes; AC-UI-005/009, FIN-07, DEC-10;
[contrato CF-024](../CF-024/CONTRATO.md), parecer e achados independentes;
consolidação CF-001–026 e escopo/dependências CF-027. CF-026 de `30211b8`
permanece em revisão: seus contratos, parser de preferências, cleanup, regras de
lint e dependências não foram substituídos.

O [probe original vermelho](original-probe-red.log) foi executado antes de alterar
produto: uma segunda submissão após ApiError502 chama create novamente (expected1,
observed2), sem operationId. A fonte original permanece intacta em
`../revisao-CF-024/probes/unknown-creation.test.tsx`. A investigação dinâmica do
formulário de investimento também produziu [expected1/observed2](investment-probe-red.log).

NewTransactionModal e operações monetárias de OperationModal passaram a usar
**o protocolo existente**, com operationId UUID no corpo e GET autenticado de
`/financial-intents/{id}`. Não há novo namespace/recibo/backend/BFF nem mudança de
opcionalidade no servidor. Antes do POST, o cliente persiste envelope local v1 com
owner, kind, identidade e corpo serializado. Retry usa esse corpo, sem reconstruir
campos/defaults da tela. Cada criação legítima posterior gera outro UUID.

O hook pequeno compartilhado e o aviso de recuperação evitam duas implementações
divergentes deste ciclo; são necessários aos dois consumidores, sem reorganização
de domínios da CF-027. Validação de JSON desconhecido fica na fronteira de storage;
o único cast do envelope sucede a validação de seus campos. Envio para os serviços
usa narrowing do comando. A skill `vercel:react-best-practices` foi aplicada na
revisão de hooks, subscriptions/cleanup, estado, fieldsets e tipos.

## Ciclo de vida decidido

| Evento | Comportamento |
|---|---|
| POST em andamento/desconhecido | Trava imediata e corpo persistido; formulário/tabs não criam intenção nova |
| Fechar/reabrir | Conserva pendência; exibe dados da operação anterior e ações de recuperação/retry |
| Reload na mesma aba | Lê envelope validado por owner/kind; preserva identidade/corpo; não reenvia automaticamente |
| GET404 | Continua pendente: ausência não prova que um writer terminou; somente retry da mesma intenção |
| GET indisponível/recibo inválido | Sem sucesso fictício nem nova chave; corpo continua recuperável |
| GET válido ou resposta válida do POST/replay | Remove envelope; atualiza consumidores; próxima intenção tem UUID novo |
| Primeiro POST rejeitado definitivamente com400/403/422 | Permite corrigir formulário com nova identidade; retry de uma intenção já desconhecida não a descarta por essa resposta |
| Storage indisponível antes do POST | Nenhum POST financeiro; leitura corrompida bloqueia sem descartar silenciosamente |
| Troca de usuário, expiração, unmount | Invalida callbacks antigos; outro owner não vê/reenvia o corpo; pendência do anterior permanece sob sua chave |
| Perda também do armazenamento/identidade | Não há recuperação automática oferecida; exige conferência do histórico. Outra aba/dispositivo sem a chave não recebe garantia inventada |

sessionStorage mantém no máximo uma pendência por owner/kind nesta aba. Não há
catálogo multi-dispositivo de intenções pendentes. Abrir outro ativo não substitui
a operação anterior; o aviso conserva o rótulo/payload original. O ajuste de
avaliação UPDATE_BALANCE mantém seu contrato anterior, sem adotar indevidamente
recibo de INVESTMENT_OPERATION; não foi certificado como criação monetária.

## Provas e execuções

| Execução | Resultado e significado |
|---|---|
| Original transação / investigação investimento | Dois vermelhos causais1/1; serviço double somente na camada de componente |
| Direcionados finais iniciais |18/18; identidade antes do POST, body exato, remount, owners, 404/503, storage e rejeição definitiva |
| Componentes finais | [193/193 em40 arquivos](components-complete.log), sem skips; inclui R03/RV01, contratos/parser/cleanup CF-026 e testes novos de unmount/recibo incompatível/resultado-array |
| Original convertido para contrato identificado | `rv24-original-contract.test.tsx` conserva expected1 para segunda submissão e ações originais. Só acrescenta principal sintético e troca observação histórica “sem chave” por exigência UUID, pois o contrato adotado agora exige emissão pelo consumidor. O original/red não foi reescrito |
| Lint final | [244 alvos,0 erros/0 avisos](lint-complete.json); configuração inalterada |
| Typecheck / build finais | [typecheck](typecheck-complete.log), [build](build-complete.log), exit0; build com fonte/configuração existentes |
| Unitários temporais | [6 casos em3 fusos,18 execuções](unit.log), zero skips |
| Browser real financeiro | [6/6](browser-verified/playwright.log), Spring runner1/1; [SQL literal](browser-verified/postgres-oracles.txt), [persistência](browser-verified/persisted.txt) e capturas |
| Pagamento original R03 | [4/4](payment-regression/playwright.log), conta900/dívida0/planejamento/reload; [SQL](payment-regression/postgres-oracles.txt). Sem alterar testes/timeouts do pagamento |
| Suítes backend afetadas | [135/135 verify/JAR](../RV24-02/affected-verify.log), incluindo CF-02430, hábitos27, migrações e consumidores. Contagens sobrepõem gates; não somar |

Browser → BFF Next → Spring real → PostgreSQL16/Testcontainers, Flyway V1–V13 e
Hibernate validate, com autenticação real, usuários únicos e email/cotação doubles.
Clock sintético Jan15/2027, navegador São Paulo, viewport1440×900. Primeiro POST
de loss/unavailable passa pelo BFF/backend e comita; route.fetch verifica a
resposta real antes de abortar somente sua entrega ao navegador. A indisponibilidade
do GET é fault double de transporte, não sucesso financeiro simulado.

Para before, um controller **somente em src/test**, ausente do JAR de produção,
habilita por principal sintético um trigger PostgreSQL que rejeita a gravação do
recibo após writes financeiros. O navegador observa500 e GET404; saldo1000 e
posição10/histórico vazio são preservados. Ao remover a falha, o mesmo corpo/UUID
funciona. Nenhuma API de produto foi criada para fault injection.

Em cada recurso/modo, recuperar/repetir deixa conta975 (despesa25) ou800 (aporte200),
um efeito; replay explícito não muda esses valores. Payload diferente recebe409;
outro owner recebe404 no GET e409 na escrita. A segunda intenção igual, emitida
pelo formulário, usa outro UUID e deixa950 ou600/posição14. SQL final confirma
dois recibos por owner A, zero por B e seis operações de investimento para três
owners de investimento. Também houve consulta/reload das telas, não apenas toast.

Capturas finais foram inspecionadas; não são golden snapshots automaticamente
aprovados. Não houve matriz visual completa mobile/zoom ou todos os tipos de
operação monetária em navegador. SELL/DIVIDEND/INTEREST/transferências conservam
testes backend/consumidores; o novo E2E monetário exercita EXPENSE e BUY.

## Falhas de harness preservadas

- `components-first.log`: fixture antiga sem owner id; acrescentado principal
  sintético e limpeza de sessionStorage por teste, sem retirar assertions.
- `components-directed.log`: matchers jest-dom indisponíveis no Vitest local;
  substituídos por assertions equivalentes de disabled/textContent.
- `build.log`: rede bloqueou fontes Google; mesmo build passou com rede autorizada.
- `browser/` e `browser-first.xml`: transações3/3; investimento falhou ao esperar
  posição14 porque seed usava nomes antigos ignorados pelo DTO (posição inicial0).
- `browser-final/`: seed corrigido para openingQuantity/Cost/Value, mas ainda
  numérico; contrato decimal-string retornou400. Corrigido somente seed para
  strings10/1000/1000. Expected financeiros não mudaram.
- `browser-verified/`: seis jornadas verdes, incluindo falha real pré-commit.
- `receipt-array-red.log`: seleção dirigida do novo cenário confirmou falso sucesso
  ao tratar array como objeto de recibo. Os dez demais casos não foram selecionados
  nessa contraprova (reporter chama isso skipped); nenhum test.skip foi introduzido
  e não se usou essa seleção como gate verde. O gate completo posterior executou
  todos193, zero skips. Parser agora recusa arrays conforme snapshot objeto CF-024.

## Comandos e limites

[EXECUCOES.ps1](EXECUCOES.ps1) contém seleções e comandos reproduzíveis; nomes de
execução browser devem ser novos. Java21.0.12.1, Maven wrapper, Node24.18.0,
Vitest4.1.11, Next16.1.6 e PostgreSQL16 existentes; sem upgrades.

Persistir/validar/serializar custa O(L) por comando; espaço O(L) por pendência,
com quantidade limitada por owner/kind. O servidor conserva os custos/locks e
armazenamento do contrato CF-024. A trava local é UX; a unicidade financeira vem
do recibo/transação PostgreSQL. Storage mantém dados financeiros locais nesta aba;
perda, manipulação, novos dispositivos, restart backend, múltiplas instâncias e
corte TCP físico não foram certificados. O descarte da resposta é lógico na
fronteira browser, com commit real, e não alegação de corte TCP.

R03/RV01 preservados. **RVA-03 não foi encerrado.** CF-026 não foi autoaprovada,
nem adicionada às dependências CF-027. Revisão independente deve invalidar estas
provas e confirmar as garantias; implementação não libera CF-027.
