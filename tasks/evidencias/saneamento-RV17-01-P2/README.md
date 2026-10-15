# RV17-01/P2 — validade operacional do preflight

15/10/2026. **Candidato documental aguardando revalidação independente**, sem
autoencerramento. Corrige somente a regra de reutilização do resultado entre
preflight e baseline; não reabre código RV17-01, RV17-02 ou fundação V1–V14.

## Base e preservação

Branch de entrada/entrega: `codex/cf017-preflight-restore`.
HEAD inicial: `ef08950059ef0366ca48172cad48e5ee3a6906e8`, igual à base informada;
`git merge-base --is-ancestor ef08950 HEAD` exit 0 e `git log ef08950..HEAD`
sem commits na entrada. Staging vazio; única alteração anterior: ` M README.md`.
SHA-256 desse README raiz:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Fora do staging e do commit; conteúdo preservado.

Aplicadas instruções AGENTS da conversa; nenhum AGENTS.md adicional encontrado
nos ancestrais do workspace ou nas árvores tasks/backend. Lidos EXECUCAO,
POLITICA-DE-TESTES, tarefas CF-017/P01/P02, parecer vigente, runbook, matriz e
encaminhamento anteriores. Inspecionados LegacyPreflight, DatabaseVerificationCli,
PgSchemaInventory, catalog.sql e encadeamento LegacyMigrationTestInitializer.
Busca inicial de testes usou pasta infra/migration inexistente; corrigida para
src/test/java/com/controlefinanceiro/api/migration, sem inferir ausência de wrapper.

## Critério, lacuna e delta

O [parecer vigente](../reconferencia-CF-017/README.md), seção “Parecer e achado
aberto”, exige somente saneamento do runbook e revalidação documental dirigida.
A prova anterior `previousPassDoesNotAuthorizeChangedSchema` continua sendo a
evidência causal; não foi reexecutada nem apresentada como prova nova.

Antes: freeze explícito para captura/dump, sem regra suficiente de validade até
baseline. Depois: [runbook, seção Validade do preflight até a baseline](../CF-017/ROLLOUT-LEGADO.md#validade-do-preflight-até-a-baseline--rv17-01p2)
vincula aprovação à identidade/geração do alvo, database/schema, inventário,
artefato/configuração e continuidade comprovada da janela; inclui sequência em
oito passos, matriz A–I, eventos adicionais e registro mínimo por tentativa.

O CLI valida database esperado, schema acessível e PostgreSQL 16; lê catálogo em
transação read-only e retorna 0/2/3. Não verifica identidade de instância/geração,
não captura trilha contínua de alterações nem executa baseline. O initializer
encadeado é de teste. Esses limites exigem coordenação/exclusividade operacional
e evidência externa ao CLI; não há garantia atômica preflight→baseline. Não foi
implementado lock, wrapper, auditoria ou infraestrutura nova. Se os controles não
puderem ser estabelecidos/demonstrados no ambiente, a operação deve parar.

Trade-off: janela coordenada evita ampliar infraestrutura para este resíduo, mas
depende de controle de todos os executores e tem custo de indisponibilidade dos
writers quando os gates de dados exigem freeze. Repetir um SELECT ou confiar no
lock posterior do Flyway não substitui esse controle. Nenhuma alteração de queries,
complexidade ou comportamento do produto foi necessária.

## Validação documental realizada

Confronto manual de cada decisão A–I com a regra e o código, sem banco:

| Cenário | Resultado esperado da leitura do procedimento |
|---|---|
| A: alvo/versões/controles mantidos | Somente baseline autorizada pode avançar; gates seguintes separados. |
| B: DDL posterior | Invalidar e repetir, inclusive mudança potencialmente compatível. |
| C: retomada sem continuidade comprovada | Restabelecer controle e repetir; hora recente não basta. |
| D: outro alvo com relatório anterior | Rejeitar relatório; identificar/autorizar novo escopo e verificar. |
| E: restore/substituição | Nova geração requer identificação e nova verificação. |
| F: inventário/ferramenta/configuração relevante | Nova verificação com versões aprovadas e registradas. |
| G: DML | Sem invalidação estrutural automática; analisar efeitos em history/sequences e respeitar freeze/backup/migração. |
| H: estrutura sem controle | Parar; sem possibilidade de controle, abortar janela. |
| I: requer revisão | Parar para revisão; exit 2 jamais aprova baseline. |

Também conferidos: histórico Flyway alterado, erro/saída incompleta, evidência
ausente, concorrência desconhecida e baseline incerta. Sucesso da baseline muda
o fluxo para gerenciado; não se exige preflight legado aprovado após criar history.

Comandos preexistentes do runbook conferidos estaticamente contra argumentos do
CLI (`preflight schema expectedDatabase`) e códigos de saída. Não há novo comando
de baseline nem comando operacional executado. Build, 75 testes e backup/restore
**não repetidos**: são aceites anteriores, não prova desta alteração documental.
Conferência do diff, links locais, estados e whitespace; staging explícito somente
dos cinco documentos deste delta, com inspeção de `git diff --cached` antes do commit.
Nenhum teste que procure frases foi criado ou apresentado como evidência operacional.

O runbook corrigiu a frase antiga que negava prontidão da CF-029: o parecer atual
já a permite exclusivamente local/descartável. Encaminhamento antigo foi marcado
como histórico, preservando seu conteúdo e apontando este recorte atual.
Parecer independente não foi editado nem teve o P2 encerrado pelo executor.

## Encaminhamento ao mesmo revisor

Revisar somente `ef08950..codex/cf017-preflight-restore` no commit documental
informado na entrega, incluindo a seção de validade do runbook e notas vinculadas.
Solicitação preparada, sem envio a outro chat: conferir o delta operacional,
os cenários A–I e eventos de invalidação; decidir sobre encerramento **somente do
resíduo P2 de RV17-01**. Não solicitar nova revisão integral de migrações/integridade
nem nova execução das suítes/restore sem achado concreto nesse delta.

Preservar código RV17-01 aprovado, RV17-02 encerrado localmente e V1–V14 aprovada.
CF-017/P01/P02 continuam em_revisao; CF-029 apta somente local/descartável e não
executada. Inventário, compatibilidade, backup/restore, proveniência e coordenação
reais continuam pendentes, com preparação/autorização próprias. Sem banco real,
Railway, push, deploy, alterações de produto/migrações ou reescrita de histórico.
