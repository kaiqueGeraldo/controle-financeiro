# Matriz normativa do saneamento local CF-017

Base: `4206d881cc06bec1e8d80807dfb673d35f52937c`, PostgreSQL 16.
Fonte de verdade para **baseline 1**: `V1__baseline_pre_temporal.sql` congelada,
nunca o modelo ORM atual. `legacy-v1.inventory` é sua projeção semântica versionada;
`Cf017ManifestTest` recria somente V1 em schema descartável e exige igualdade exata.
A fixture SQL manuscrita preexistente é independente desse inventário. Seus nomes
de PK/UK/FK diferem da V1 e continuam aceitos. Hashes originais em `original-hashes.txt`.

| Obrigação | Comparação/decisão | Prova dirigida |
|---|---|---|
| Schema alvo | Identificador explícito; database esperado conferido; schema precisa existir e ser acessível | CLI com banco errado retorna 3; ausência nunca aprova |
| Tabelas | Todas as 19 relações V1, tipo/persistência/RLS/replica identity/options | Fixture independente; tabela adicional exige análise |
| Colunas | Todas, por tabela/nome; ordem física não é contrato | Coluna ausente/adicional rejeitada |
| Tipos | `format_type` inclui precisão/escala/typmod; collation incluída | numeric(38,3), timestamptz, timestamp(3) rejeitados |
| Nulabilidade/defaults | Igualdade material para toda coluna | NOT NULL removido e default boolean invertido rejeitados |
| PK/UK | Definição, colunas, deferrabilidade; índice correspondente | PK/UK ausentes rejeitadas; nomes gerados equivalentes aceitos |
| FK | Origem, destino/colunas, ações, MATCH, validade e deferrabilidade via catálogo | FK original ausente; alvo errado válido; ON DELETE diferente; NOT VALID |
| Enforcement | Flags de validação e overrides dos triggers internos | `DISABLE TRIGGER ALL` rejeitado |
| CHECK | V1 não tem CHECK; adicional não é automaticamente benéfico e exige análise | CHECK adicional rejeitado; restore V14 detecta remoção, literal alterado e NOT VALID |
| Índices | Método, chaves, expressões/predicados, ordem/nulls/opclass, uniqueness, flags de validade/readiness | Índice removido, expressão e predicado diferentes rejeitados |
| Sequence/identity | V1 usa UUID da aplicação e não tem sequences; objeto extra exige análise; identity/default nas colunas | Sequence extra rejeitada; restore prova definição/ownership/last_value/is_called em extensão sintética |
| Flyway | V1 legado requer ausência de qualquer history; versão/estado não são inferidos pelo ORM | Vazio, gerenciado V14, baseline apenas e history com success=false são recusados pelo gate legado |
| Migrações | V1–V14 presentes e imutáveis; baseline explícita; clean desabilitado | Vazio→V14, legado→baseline1→V14, V13→V14, checksum, falha/rollback/recuperação e migrate zero |
| Backup/restore | `pg_dump -Fc --snapshot`, destino novo, `pg_restore --exit-on-error --single-transaction` | Legado V1 e V14 restaurados; comparação integral; Flyway validate/migrate zero |
| Dados | Todas as colunas e linhas de todas as tabelas do schema, inclusive history | Troca entre PKs com soma preservada, bruto microsegundo, origem/null, relação, saldo, exclusão e instante |

## Política de objetos adicionais

* **Compatível, informativo:** índice não único, simples (sem expressão/predicado),
  válido/ready/live, sobre tabela esperada. Os índices exigidos continuam obrigatórios.
  Um índice adicional não substitui um obrigatório perdido. Nomes de índices e
  constraints não entram na identidade; multiplicidade não é descartada.
* **Desconhecido, parar para análise:** tabela, coluna, CHECK, unique, sequence,
  tipo definido pelo usuário, rotina, trigger de usuário, rule, policy, herança ou
  índice especial adicional. Exit 2, sem baseline. Não há allowlist permissiva configurável.
* **Incompatível:** semântica obrigatória ausente/alterada, FK inválida/desativada,
  coluna/tipo/default divergente etc. Relatório mostra esperado e observado;
  alteração normalmente gera uma ausência e uma adição, ambas determinísticas.
* Outros schemas não relacionados, roles, ACLs, comentários, OIDs, tablespaces,
  extensão/infraestrutura do cluster e estatísticas não fazem parte da equivalência
  da aplicação. Exigem inventário operacional próprio. Referências externas de FKs
  permanecem qualificadas e não equivalem às referências internas esperadas.

SQL de expressão é decompilado pelo próprio PostgreSQL, não comparado ao texto da
migração. A equivalência não é um provador geral de SQL: formas não reconhecidas
param para análise. Há uma normalização **somente de CHECKs** para o cast de arrays
de literais de enum uppercase/underscore/dígitos de varchar sem typmod para text,
distribuído pelo dump/reparse PostgreSQL 16. Não remove literais, ordem, condições,
casts com tamanho, flags NOT VALID nem tipos das colunas. Capturas de catálogo antes/
depois da falha inicial estão preservadas; teste de literal adicional/NOT VALID
impede mascarar mudança material. Nenhum valor de linha recebe essa normalização.

## Estados reconhecidos e caminho correto

| Estado | Gate `preflight` V1 | Caminho posterior, sempre separado |
|---|---|---|
| Legado pré-baseline equivalente | 0 COMPATIBLE | Revisão/autorização próprias; baseline 1 explícita; cadeia atual V2–V14 |
| Schema vazio | 2 STOP | Fluxo de banco vazio: migrate V1–V14, sem baseline |
| Gerenciado, inclusive V13/V14 | 2 STOP | Flyway info/validate/checksums, decidir upgrade suportado; nunca nova baseline |
| Parcial, history inesperado ou falho | 2 STOP | Investigar origem/versão/rollback; sem repair automático |
| Falha de conexão, versão PG não suportada, alvo incorreto | 3 ERROR | Corrigir identificação/ambiente; nunca prosseguir |

Não é necessário aceitar banco vazio/gerenciado no gate **legado** para suportá-los:
as suítes existentes verificam seus fluxos distintos com Flyway real e Hibernate
validate. V14 mantém `goal_history.recorded_at` nullable sem default/backfill.

## Representação canônica do restore

1. Transação dedicada, read-only, REPEATABLE READ; UTC, ISO YMD, interval ISO, bytea
   hex e row_security off (falha em vez de aceitar silenciosamente um subconjunto).
2. Inventário semântico ordenado em Java; dados com colunas por nome em ordem C.
3. Linhas por PK em representação textual com collation C. Sem PK, como habit_days,
   usa multiconjunto ordenado pela linha completa: preserva duplicatas, mas não
   inventa identidade individual entre duas linhas idênticas.
4. Cada campo usa a saída textual PostgreSQL do tipo, sem passar por double/float;
   encode é tag null=0 ou tag valor=1 + tamanho UTF-8 de 4 bytes + bytes. SHA-256
   por campo e pela chave. Textos com delimitadores/quebras não tornam framing ambíguo.
5. Decimal preserva escala armazenada; datas e timestamps locais não recebem fuso;
   timestamptz representa o instante em UTC (o PostgreSQL já não guarda offset de
   entrada). JSONB conserva a representação armazenada; não promete recuperar a
   sintaxe/ordem original que JSONB não armazena. Brutos, origem e nulls não são inferidos.
6. Arquivos por tabela têm nomes das colunas, hashes por linha/campo e COUNT final;
   sequences incluem parâmetros/ownership no catálogo e last_value/is_called à parte.
   History inclui **todos** os campos, checksum, installed_on, installed_by e tempo.
7. Diretório novo; marcador COMPLETE só após sucesso integral. Comparação recusa
   saída parcial, detecta arquivo/tabela ausente e aponta arquivo/linha/posições de
   campo da primeira divergência por arquivo. Chave hash permite localizar a linha
   no artefato; consultar valores somente em ambiente autorizado e protegido.

Suporta os tipos usados pela cadeia atual (UUID, texto/varchar, boolean, inteiros,
numeric, date/time/timestamps, JSONB, bytea). Tipos/rotinas/herança/views/foreign
tables não suportados falham explicitamente; não são omitidos. Flags de RLS fazem
parte do catálogo; permissão insuficiente não deve certificar leitura parcial.

Igualdade aqui é **lógica**, não igualdade dos bytes do dump, nem garantia de ACLs,
owners, roles, configurações/infraestrutura do cluster. `--no-owner --no-privileges`
é deliberado para o clone isolado. Checksum do dump prova identidade do arquivo;
comparação dos snapshots prova os dados/schema cobertos. Nenhuma delas autoriza adoção.
