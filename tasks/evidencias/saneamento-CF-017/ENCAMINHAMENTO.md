# Encaminhamento para revisão independente

Revisar somente o saneamento local RV17-01/02. Não executar nova auditoria integral
de 03-integridade, onboarding, Railway, baseline real, deploy ou push.

Base integrada: `4206d881cc06bec1e8d80807dfb673d35f52937c`.
Branch candidata: `codex/cf017-preflight-restore`.
Intervalo completo: `4206d88..codex/cf017-preflight-restore`; commits concretos no
README desta evidência e na entrega. A base contém o aceite CF-014, CF-028 documental,
CF-023 e a V14/RD58. CF-015/zoom/RVA-03 não são dependências deste ensaio local.

## Critérios de encerramento

* RV17-01: confrontar inventário congelado com V1, fixture independente e matriz;
  verificar comparações de semântica/validade, política de adicionais, execução CLI
  somente leitura e código de saída. Remover a FK original e confirmar que o fluxo
  não cria history nem aplica migrações. Tentar invalidar também defaults, FKs com
  alvo/ações erradas, NOT VALID, trigger desativado, índices e estado parcial.
* RV17-02: repetir backup real V1/V14 em banco novo; verificar todos os arquivos de
  comparação, valores por PK/campo, multiplicidade sem PK, bruto/proveniência/null,
  constraints/índices, sequence/identity e history. Validar a exceção estreita dos
  casts de enum contra a falha preservada e as contraprovas de CHECK material.
* Reexecutar `Cf017OriginalFindingsTest`: o mesmo critério que teve 2 falhas no log
  original deve ter zero falhas, sem alterar expected para acompanhar implementação.
* Reexecutar suites dirigidas e verificar migrações/configuração imutáveis. Conferir
  custos e limites abaixo, sem transformar pequena fixture em benchmark.

Provas independentes originais: `../revisao-CF-017/README.md`, `ACHADOS.md` e
`EXECUCOES.md`. O probe original de 2026-09-22 era temporário e foi removido pelo
próprio revisor; não existe fonte recuperável desse arquivo na base. Preservados
hashes dos documentos e dos helpers originais, critérios e reprodução dirigida
atual. Não se afirma que esta reprodução nova é o arquivo original perdido.

## Custo, consistência e limites

Preflight: uma consulta de identificação/versão e uma consulta de catálogo (UNION
de conjuntos); sem varredura de dados, consultas por linha ou entidades/JPA.
Inventário de M objetos ocupa O(M); ordenação/comparação O(M log M). O CLI acrescenta
uma consulta de identidade do database. Queries de catálogo leem apenas o schema alvo.

Snapshot: catálogo uma vez, lista de relações uma vez, uma consulta de colunas/PK
e uma leitura de dados por tabela; uma leitura por sequence. O(T+S) consultas,
nenhum N+1 por linha. Streaming JDBC com fetchSize=512 em transação, arquivos por
tabela; memória O(M + 512×largura da linha), mais uma linha/campo grande, e disco
O(total de campos×64 caracteres de hash). Ordenação textual de PK é determinística,
mas pode não usar índice nativo: custo O(N log N) por tabela e sort/spill no servidor;
hash O(bytes lidos). Comparador faz leitura sequencial com memória limitada e para
na primeira divergência por arquivo, sem esconder quais outros arquivos diferem.
Trade-off: diagnóstico por campo ocupa mais disco que um único hash; evita carregar
tabelas inteiras e permite localizar a diferença. Não é plataforma genérica de migração.

No ensaio, snapshot exportado fica vivo durante `pg_dump --snapshot`; a mesma visão
MVCC alimenta captura e dump. Contraprova confirma que commit de dados posterior
não muda essa visão. SELECTs mantêm ACCESS SHARE; DDL pode bloquear e timeout deve
parar o procedimento. Transação longa retém snapshot e pode atrasar vacuum/bloat.
Sequences **não são MVCC**: é necessário congelar todos os writers/nextval, jobs e
DDL durante captura/dump no procedimento completo. O ensaio não tem writers alheios;
o teste concorrente faz apenas uma alteração controlada de dados, sem sequence/DDL.

Timeouts de lock=5s e statement=120s são limites locais de falha, não estimativas de
produção. Volume, bloat, I/O, locks, índices reais, carga e ACLs/roles não foram
certificados. O dump seleciona apenas o schema; dependências externas/large objects/
extensões precisam de plano próprio antes de ampliar seu alcance.

## CF-017 → CF-029: avaliação preliminar, sem liberação

A capacidade oferecida é: fundação versionada V1–V14, preflight reproduzível do
legado V1, upgrade local e restauração lógica verificável em PostgreSQL descartável.
Este candidato ainda requer aceite independente de RV17-01/02 e decisão explícita
de suficiência desse recorte para a CF-029. Não equivale a concluir toda CF-017/P01/P02.

CF-029 depende de CF-017, CF-023 e CF-028. Os arquivos canônicos CF-023 e CF-028 estão
concluídos; CF-028 foi aceita somente como especificação (parecer
`../revalidacao-CF-028-totais/README.md`). Esses aceites não implementam rascunho,
versionamento/concorrência, sessão/ownership ou nova migração do onboarding. A futura
execução deve reconferir a base e testar suas próprias garantias. CF-029 fica proposta.

Gates reais continuam separados: identificação/inventário, backup real restaurável,
proveniência por linha/lote, writers/clientes, janela, permissões, volume/locks,
reconciliação e autorização de baseline/migração/publicação. Não foi acessado banco
real, nem criado recordedAt/proveniência para legado. Aceites CF-014, CF-023 e CF-028
e pendências próprias da CF-015 não são reabertos por este encaminhamento.
