# CF-028 — entrega documental para revisão independente

Data do cliente: 09/10/2026. Especificação canônica:
[SPEC-001](../../../docs/sdd/specs/001-onboarding.md). Nenhum endpoint, serviço,
migração, tela ou teste de produto implementado. CF-029 e demais sucessoras não
executadas. Estado final: `em_revisao`, sem autoaprovação.

## Base e preservação

Nota de saneamento em 10/10/2026: [R28-01/02](../saneamento-CF-028-R28/README.md)
atualiza o schema do Summary em examples.json e seus gerador/verificador. Os números
E01 e contentHash permanecem; reviewHash muda pelo novo DTO. Logs validation-*.json
abaixo são históricos da entrega anterior. A nova execução fica na pasta de
saneamento; parecer e provas independentes originais não foram reescritos.

HEAD inicial e base informada idênticos:
`c6a7c3ef3b563e9a432f80166aa4982a25180cd5`, branch inicial `main`, staging vazio.
`git merge-base --is-ancestor c6a7c3ef3b563e9a432f80166aa4982a25180cd5 HEAD`
retornou0; intervalo posterior vazio. Único delta preexistente: `README.md` raiz,
SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Mantido fora do staging/commits; verificador confere bytes pelo hash.
Branch de entrega: `codex/cf-028-contrato-onboarding`.

Aplicadas instruções AGENTS da conversa; busca por AGENTS.md na árvore e nos
ancestrais não encontrou outro arquivo aplicável. Lidos tasks/README, EXECUCAO,
POLITICA-DE-TESTES, CF-028–032, SDD/README, SPEC-001/002/004 e contratos pertinentes.
O primeiro comando de inventário excedeu limite de saída; leituras seguintes
foram dirigidas. Dois globs literais no rg foram rejeitados no Windows; buscas
posteriores em diretórios/arquivos explícitos forneceram os trechos necessários.

## Dependências e pareceres consumidos

| Origem | Capacidade e aceite | Limite preservado |
|---|---|---|
| CF-016 | FIN-01–08/NG-01; oráculos e [matriz de aceite](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md) | Especificação não certifica runtime |
| CF-018 | Abertura/saldos/transferências/rollback aceitos na mesma matriz | Não autoriza sobrescrita legada |
| CF-019 | [Liberação independente em06c1a51](../revisao-CF-025-CF-027-RV24/README.md), J/C | Dívida/parcelas/abertura só para especificação; em_revisao/RVA-03 conservados |
| CF-020 | Reservas/custo/NG-01/unknown e encerramentos RVA-01/02 aceitos na matriz | Adaptações onboarding ainda necessárias |
| CF-023 | Ownership/401/404/geração de sessão aceitos; [contrato](../CF-023/CONTRATO.md) | JWT stateless, não revogação global |
| CF-024/027 | [DEC-10](../CF-024/CONTRATO.md), porta FinancialIntents e [parecer](../revisao-CF-025-CF-027-RV24/README.md) | Não implementam finalização onboarding; não criar dependência artificial para especificar |
| RD58 | [Parecer09/10](../revalidacao-RD58/README.md), base0c068d9 | CF-005/006 concluídas no escopo, adoção real CF-017/P01/P02 separada |
| RV24-01/CF-009 | [Precisão](../revalidacao-RVR24-01-precisao/README.md) e [fechamento por propriedades](../revalidacao-RVR24-01-propriedades/README.md) | FIN-06/NG-01 exatos; resposta inválida não prova rollback; aceite não migra todos os DTOs |

`git diff --name-only 06c1a51..HEAD -- .../service/CreditCardService.java .../domain/card`
vazio: capacidade financeira de abertura não recebeu delta após a liberação.
RD58 e revisões mais recentes foram lidos para evitar promover snapshots antigos
a estados atuais. CF-017/019 e marco frontend não são tratados como aprovados integralmente.

## Confronto estático

Inspecionados AuthService (carteira automática), Account/AccountService/CreateAccountDTO,
CreditCardService.recordOpeningPosition/CardOpeningPosition/CreateCardDTO/controller,
Investment/CreateInvestmentDTO/InvestmentService, Goal/CreateGoalDTO/GoalService,
SetGoalAllocationDTO, FinancialIntents e frontend src/types/index.ts.
Busca por onboarding no código não encontrou jornada/API. Diferenças e donos
constam exclusivamente na matriz da SPEC-001, evitando regras concorrentes aqui.

Decisão material consultada: prazo original de meta já ativa. Documentação temporal
deixava admissibilidade hoje/passado em aberto; @FutureInProductZone atual não foi
tomado como autoridade. Usuário respondeu **aceitar prazo original e indicar atraso**.
DEC-ONB-01 registrada na canônica. Protocolos/limites restantes são decisões técnicas
da especificação, sujeitos à revisão, não atribuídos ao usuário.

## Validação reproduzível

Arquivos exclusivamente documentais:

- `build-examples.mjs`: produz payload completo E01 e exemplos de prepare/complete/GET,
  com expected financeiro literal; nenhum helper/API de produto.
- `examples.json`: dados sintéticos, entradas/respostas e variantes inválidas.
- `verify.mjs`: reconcilia entradas com expected literal usando BigInt; checa capacidade,
  parcela corrente/futura, componentes, progresso, prazo, mapping/identidade de recibo,
  precisão/NG-01, calendário, links/JSON e preservação do README.
- `validation-*.json`: outputs das execuções; valores não são capturados do produto.

Comandos, a partir da raiz:

```powershell
node tasks/evidencias/CF-028/build-examples.mjs
$env:TZ='America/Sao_Paulo'
node tasks/evidencias/CF-028/verify.mjs
$env:TZ='UTC'
node tasks/evidencias/CF-028/verify.mjs
$env:TZ='Pacific/Kiritimati'
node tasks/evidencias/CF-028/verify.mjs
git diff --check
```

Calendário do verificador usa inteiros gregorianos, não conversão de instante.
Execução em três TZ atesta independência documental, não browser/JVM.
Cinco contraprovas em cópias em memória: somar reservas ao patrimônio, duplicar
competência corrente, exceder reserva, trocar decimal por Number, aceitar29/02/2027.
Cada uma lançou erro; nenhuma mutação de produto/arquivos de fixture.
Resultado final: nove grupos aprovados em cada TZ, cinco corrupções rejeitadas.
Hash de conteúdo/revisão também recalculado por serialização independente do gerador.
`git diff --check` aprovado. Node v24.18.0; sem instalação de dependências.

Ocorrências de edição: duas tentativas de escrita longa não alteraram a canônica
(patch com alvo repetido e limite de linha do launcher Windows206). Escrita refeita
em patches menores. Patches intermediários com contexto inexistente foram recusados
integralmente, depois reaplicados corretamente. Criação de branch precisou escalada
de sandbox para `.git`; autorizada automaticamente. Nenhum desses eventos é falha
de validação financeira. Primeira execução do verificador8/8; adicionada checagem
de hash, execuções finais9/9. Nenhum expected foi relaxado.

Escopo do validador é intencionalmente limitado: não é implementação completa de
JSON Schema nem de protocolo, não prova locks/HTTP/SQL/atomicidade/isolamento em
execução. Cenários concorrentes/usuário legado permanecem contratos e critérios
futuros na canônica, não testes fictícios aprovados. Sem instalar dependências.

## Encaminhamento

Revisão independente deve usar base `c6a7c3e` e commits desta branch; examinar
SPEC-001 e recalcular entradas/expected, sem usar conclusão do executor como prova.
Conferir desconhecidos, fontes alteradas, precisão, calendário, todos os caminhos
de replay/conflito e matriz de diferenças de runtime. CF-028 fica em_revisao;
nenhuma decisão essencial não respondida foi escondida. Próximo passo após sua
revisão: fechamento dirigido frontend CF-010–015, sem iniciar onboarding.
Sem clean/push/deploy/migração/banco real/notificações ou revisão independente nesta execução.
