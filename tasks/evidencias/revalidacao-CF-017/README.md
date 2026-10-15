# Revisão independente do saneamento CF-017 — 15/10/2026

## Decisões

* **RV17-01: implementação do preflight aprovada; encerramento integral pendente
  exclusivamente pelo resíduo operacional P2 descrito em ACHADOS.md.** A FK
  ausente e as demais incompatibilidades exercitadas são recusadas. Não permanece
  o falso aceite P1 original no comparador. O runbook não fecha explicitamente a
  validade temporal da aprovação entre preflight, freeze e baseline.
* **RV17-02 encerrado no escopo local.** Restore real V1/V14, comparação por
  linha/campo, catálogo, sequences e history reexecutados; contraprovas sensíveis.
  Isso não conclui backup/restore do ambiente existente.
* **CF-017: fundação local V1–V14 aprovada; tarefa permanece em_revisao.** Restam
  o resíduo operacional RV17-01 e o critério original de compatibilidade/adoção
  real. Os demais três critérios originais conservam aceite local, agora reforçado
  pela execução independente. Não se declara aprovação integral do rollout.
* **P01/P02: em_revisao.** Migração aditiva local e preservação temporal aprovadas;
  inventário, backup/restore real, proveniência, writers/clientes, desempenho e
  execução autorizada do ambiente existente continuam pendentes, com seus donos.
* **CF-029 apta a iniciar exclusivamente em ambiente local/descartável**, na base
  `bcec50c`, consumindo a fundação versionada e os aceites CF-023/CF-028 abaixo.
  Estado passa a pronta nesse recorte, sem iniciar implementação/onboarding.

## Base, preservação e independência

Branch `codex/cf017-preflight-restore`; HEAD de entrada e código examinado
`bcec50c04eb3a1b134367d90ec8628928962c752`. Intervalo
`4206d881cc06bec1e8d80807dfb673d35f52937c..bcec50c`: `eb67701`, `36cf9b4`,
`bcec50c`, nessa ordem. Base ancestral confirmada; nenhum commit posterior antes
da revisão. Staging vazio; única mudança preexistente: README da raiz.
SHA256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`,
preservado e fora de todos os commits desta revisão.

Aplicadas instruções AGENTS fornecidas na conversa; buscas na árvore e ancestrais
não localizaram outro AGENTS.md. Lidos execução, política, tarefas CF-017/P01/P02,
CF-023/028/029, SPEC-001 (contrato e fronteiras), revisão original, consolidações,
relatório/matriz/encaminhamento/runbook atuais, fontes, configuração e migrações.
Não houve correção de produto, ferramenta operacional, migração ou runbook para
aprová-los nesta revisão. Somente probes/evidências e anotações de estado.

Execução em cópia de `git archive bcec50c controle-financeiro-backend`, fora da
árvore principal; caminho em `isolated-path.txt`. Os quatro probes adicionais
estão preservados em `Cf017IndependentReviewTest.java` e foram copiados somente
para essa cópia. PostgreSQL16.15 criado pelo Testcontainers, sem fallback externo.
Não foram usados banco real, push, deploy, reset, checkout, clean, merge ou rebase.
Nenhum descarte manual: os recursos de teste pertencem ao Testcontainers/Ryuk.

## Provas e fonte de verdade

`verify.log`: **71 testes, zero falhas/erros/skips; verify/repackage exit0**.
Inclui as três reproduções do achado original, 28 casos/testes de preflight,
21 de restore, banco vazio, legado, V13→V14 e consumidores temporais dirigidos.
`independent-probes.log`: **4 testes novos, zero falhas/erros/skips**, exit0.
`MATRIZ.md` discrimina o que cada prova garante; quantidade não substitui cobertura.

O inventário congelado foi produzido de V1, não da fixture nem das entidades V14.
O teste do executor usa a mesma consulta para gerar/conferir o manifesto e, sozinho,
tem risco de omissão comum. Por isso `check-manifest.ps1` deriva diretamente do
SQL versionado, sem usar `PgSchemaInventory` ou a fixture: confrontou **19 tabelas,
158 colunas (tipo, precisão/escala, null/default), 49 constraints e 11 índices
explícitos**. Inspeção do DDL confirma 18 PKs, seis uniques (24 índices associados),
25 FKs, nenhum CHECK ou sequence/identity na V1. Flags, ações e representações
foram conferidas no catálogo e nos adversariais. Nomes de constraints/índices e
ordem física de colunas não são identidade funcional. Forma SQL equivalente não
reconhecida pode parar para revisão: escolha conservadora, não autorização tácita.

A fixture manuscrita preexistente é separada da V1/manifesto, contém dados e nomes
distintos e passa no gate. Isso demonstra compatibilidade com o legado **modelado**,
não com Railway. `original-preservation.json` reconfere 18 hashes históricos:
V1–V14, fixture e três documentos da revisão original. `preservation.json` compara
blobs de migrações/configuração entre base e candidato: iguais, nenhuma V15.

O vermelho original do executor foi inspecionado junto ao código em `4206d88`:
verificador limitado a tabelas/quatro colunas e fingerprint agregado. Não afirmamos
ter recuperado o probe temporário de setembro. Os critérios FK ausente e alteração
bruta de microssegundo foram reexecutados nesta revisão contra o candidato.

## Restore, consistência e custo

Snapshots incluem todas as tabelas encontradas, incluindo vazias e history; colunas
por nome, PK textual em ordem C, ou multiconjunto completo sem PK. Tags de null e
tamanho UTF-8 evitam colisão de framing; SHA256 por campo/chave sem passagem por
float. Oracle novo com decimais literais de 38 dígitos, null, vazio, tab e newline
conferiu os hashes independentemente do encoder produtivo e fez dump/restore real.
Outro probe detectou remoção de uma duplicata null e verificou recomposição final
equivalente, preservando a tabela vazia. FK para `outro_schema.users` é rejeitada.

Reexecutadas trocas entre linhas com soma30,03 preservada, bruto, proveniência,
relacionamento, saldo, CHECK, índice, checksum Flyway, instante e sequence. Logs
identificam o arquivo/campo causal e a restauração final em destino novo. Falha
deliberada de restore produz exit1 e rollback integral do destino conflitante.
`snapshot-before/` e `snapshot-final/` guardam 34 arquivos por lado, com hashes
iguais em `snapshot-hashes.json`. São uma prova sintética, não a totalidade dos
cenários; dumps tiveram checksum/tamanho registrados e permaneceram descartáveis.

A normalização dos CHECKs foi inspecionada contra os catálogos da primeira falha
do executor: somente distribuição de cast varchar[]→text[] sobre literais enum
sem typmod. Não normaliza dados, valores monetários, nulls, precisão temporal,
predicados ou validade. Alteração de literal e NOT VALID continuam detectadas.
Equivalência lógica coberta não significa igualdade binária dos dumps; o hash do
dump identifica seu arquivo, não prova fidelidade sem restore.

Transação read-only REPEATABLE READ, UTC/ISO e fetch512; teste integrado compartilha
snapshot vivo com pg_dump, inclusive com commit posterior controlado de linhas.
Isso **não certifica sequences sob writers ativos**: nextval/DDL/jobs devem estar
congelados. CLI manual captura e fecha sessão; captura e dump separados dependem
do freeze contínuo. O runbook explicita essa condição; a expiração do preflight
é a lacuna separada do achado residual.

Preflight: catálogo O(M), ordenação/comparação O(M log M), sem consultas por linha.
Snapshot: O(T+S) consultas, leitura/hash O(bytes), sort textual potencial O(N log N)
por tabela; não presumir uso do índice PK. Memória inclui catálogo, lote512 e campos
grandes; snapshots custam aproximadamente65 bytes por hash de campo, mais chave,
headers/catálogo. Comparação percorre arquivos e para na primeira diferença de
cada arquivo; não oferece diff completo de todas as linhas divergentes. Custos
aceitáveis para ferramenta operacional restrita, com medição no clone real pendente.
ACCESS SHARE e transação longa podem bloquear DDL/reter vacuum; lock5s/statement120s
são limites de falha locais, não SLA de produção nem limite total do processo.
ACL/owners/roles/extensões/dependências externas não são certificados pelo dump
de um schema com no-owner/no-privileges. Tipos/objetos executáveis não suportados
param em vez de serem omitidos nos caminhos inspecionados. Não é backup de cluster.

## Dependência CF-017 → CF-029

Aplicado o procedimento de liberação parcial de `tasks/EXECUCAO.md`:

| Origem | Capacidade consumida e prova | Limites |
|---|---|---|
| CF-017 | Fundação V1–V14, banco vazio/legado sintético/versionado, validação Hibernate, rollback e restore local; esta revisão sobre bcec50c | Rascunho deve acrescentar versão posterior; sem baseline real nem reutilizar aprovação antiga |
| CF-023 | Aceite independente de isolamento/sessão em `revisao-CF-022-CF-023`, commit9fa4fae integrado | Segurança/JWT/AuthService sem delta posterior nos caminhos conferidos; endpoints novos exigem seus próprios testes401/404, owner, conflito e ausência de efeito parcial |
| CF-028 | SPEC-001 v1 e aceite final `revalidacao-CF-028-totais`, basea7bc256 integrada | Somente especificação; desde essa base SPEC mudou apenas anotação de aceite, sem alteração do contrato |

Deltas financeiros posteriores ao aceite CF-023 não são revalidação geral dessa
tarefa: exclusão/UserService e comandos têm aceite posterior na revisão CF-027;
autenticação central consumida permanece preservada. CF-029 deverá integrar
exclusão de rascunho, schema/versão, GET/PUT, retomada, ownership, limites exatos e
persistência protegida de evidência/atribuição conforme SPEC-001 §8. Saves não
podem criar posições/saldos; optimistic conflict deve ser testado com concorrência.
Nada disso foi implementado ou pré-aprovado aqui.

RV17-01 residual afeta a adoção de legado mutável, não a criação de schema local
descartável/versionado. Portanto não bloqueia esse início. CF-015/zoom/RVA-03 não
se tornam dependências adicionais do backend de rascunho. Não se libera CF-030–034
ou publicação por associação. Mudança posterior nas garantias consumidas exige
reconferência da base. Todos os gates reais continuam fechados.

## Próximo trabalho delimitado

Sanear somente a janela operacional de RV17-01 e revalidar o runbook, sem editar
produto para esta revisão, sem revisão global de03-integridade. A futura CF-029
pode ser iniciada por solicitação própria exclusivamente local. Adoção real exige
identificação/inventário, compatibilidade, backup/restore, proveniência, coordenação
de writers/clientes, medição e autorizações específicas; não transferidos à CF-029.
