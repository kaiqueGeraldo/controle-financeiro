# Reconferência independente CF-017 — 15/10/2026

Resultado atual: **75 testes, zero falhas/erros/skips; verify exit0**. Reconferidos
34 pares de snapshots e18 hashes históricos. [Comandos, provas novas e aceites
reutilizados](EXECUCOES.md). Mantidos RV17-02 encerrado localmente, RV17-01 residual
P2 aberto e CF-029 pronta exclusivamente no recorte local.

## Base e delimitação

Pedido: revisão de RV17-01/02 em `4206d88..bcec50c`. Entrada efetiva:
`d806f825f5462a96043b824fe89ac539e66a7b20`, branch
`codex/cf017-preflight-restore`. O candidato é ancestral do HEAD. Os commits
posteriores `45c8c00` e `d806f82` já registravam provas e parecer independente.
Seu delta não altera backend, migrações ou runbook. Esta execução reconfere o
candidato e esses aceites; não apresenta provas anteriores como execuções novas.
[Base e preservação](base.json), [blobs e hashes](preservation.json).

Staging inicial vazio; única alteração preexistente: README da raiz, SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Preservado e excluído do staging. Aplicadas instruções AGENTS da conversa; nenhum
AGENTS adicional encontrado na árvore ou nos ancestrais pesquisados. Lidos os
guias de execução/testes, tarefas e pareceres CF-017/P01/P02, achados originais,
saneamento, revalidação anterior, runbook, configuração, fontes de verificação,
migrações no recorte e CF-028/SPEC-001/CF-029 com seus aceites pertinentes.

Código exportado de `bcec50c` com `git archive` para uma nova cópia no root de
visualizações desta conversa; probe anterior copiado somente para essa cópia.
Nenhuma correção de produto, ferramenta ou runbook. Nenhum onboarding, banco
real, push, deploy, checkout, reset, clean, merge ou rebase. Testcontainers cria
os próprios recursos PostgreSQL16, sem fallback; nenhum descarte manual.

## Matriz de critérios

| Achado/critério | Garantia exigida | Implementação | Prova original | Prova independente atual | Limitação | Decisão |
|---|---|---|---|---|---|---|
| A/RV17-01: fonte V1 | Oracle anterior à adoção temporal | Manifesto congelado de V1, separado de ORM e fixture | Helper original comparava só tabelas/quatro colunas | Parser direto do DDL em manifest.log; inspeção de catalog.sql e Cf017ManifestTest | Teste de manifesto do executor compartilha consulta; parser direto e inspeção são necessários | Aceito localmente |
| A: objetos obrigatórios | Colunas/tipos/escala/default/null, PK/UK/FK/ações/validade, índices | Catálogo sem nomes de constraints/índices, com multiplicidade e flags | FK ausente aceita na revisão original; vermelho preservado no saneamento | Matriz CLI e reprodução original reexecutadas; alvo externo, precisão e NOT VALID exercitados | V1 não possui CHECK/sequence; adições param, restore exercita ambos | Aceito no comparador |
| A: adicionais/estados | Revisão não autoriza baseline | Exit2 para desconhecido/incompatível; vazio/gerenciado/parcial recusados | Ausência de gate completo | Casos de adicionais, history, vazio e gerenciado; nomes equivalentes e índice simples adicional passam | Não é provador geral de equivalência SQL; falso bloqueio conservador possível | Aceito |
| A: somente leitura/encadeamento | Reprovação sem escrita/history | Transação read-only; CLI sem baseline; wrapper de teste condiciona avanço | Gate antigo permissivo | Comparação antes/depois e SQLSTATE25006; processo CLI retorna2 | Não existe wrapper operacional que execute baseline automática | Aceito |
| A: validade temporal | Último gate no mesmo alvo e janela controlada | Runbook congela captura/dump, mas não explicita invalidação do preflight | Resíduo P2 em revalidacao-CF-017/ACHADOS.md | Releitura das linhas25/65/133 e reexecução de previousPassDoesNotAuthorizeChangedSchema | Bypass deliberado no probe, não bypass interno do comparador | RV17-01 permanece aberto somente neste resíduo |
| B: cadeia local | Vazio/legado/versionado/upgrade, checksum e rollback | Flyway explícito; baselineOnMigrate=false; cleanDisabled=true; Hibernate validate | Aceites locais acumulados | Suites dirigidas, blobs V1–V14/configuração iguais em base/candidato/HEAD | Perfil geral de testes não substitui os contextos de migração com validate | Aceito; nenhuma V15 |
| C/RV17-02: linhas/campos | Detectar alteração com agregados iguais | PK textual; multiconjunto sem PK; hash por campo, COUNT | Fingerprint original agregado não detectava microssegundo | Dump/restore V1/V14; troca com soma30,03, bruto/origem/vínculo/saldo/instante detectados | Hashes provam conteúdo capturado, não todos os aspectos do cluster | Encerramento local mantido |
| C: representação | Null distinto de texto, decimal exato, ordem determinística | Tag/tamanho UTF-8; ::text sem float; UTC/ISO; ordem C | Oracle original parcial | Probe literal de numeric(38,8), tab/newline/vazio/null; duplicatas e tabela vazia | JSONB/instante preservam informação armazenada, não sintaxe/offset original já descartado pelo PostgreSQL | Aceito |
| C: estrutura/sequence/history | Detectar divergência além de dados | Catálogo, estado last_value/is_called e todas as colunas de history | Agregados não cobriam estrutura | CHECK removido/alterado/NOT VALID, índice, checksum e sequence; restauração final íntegra | Igualdade não certifica sequence saudável se a origem já era inválida; certifica fidelidade | Aceito |
| C: falha/consistência | Sem aceitar restore parcial ou visões de dados diferentes | pg_dump com snapshot vivo; restore single-transaction/exit-on-error | Limites documentados no saneamento | Falha após DDL com rollback e exit1; commit posterior de linha não muda snapshot | Sequences não são MVCC; CLI manual fecha sessão e exige freeze contínuo | Aceito sob condição operacional |
| D: adoção real/P01/P02 | Schema, dados, proveniência e operação do alvo comprovados | Gates separados no runbook e tarefas | Nenhum aceite real anterior | Nenhum acesso real nesta execução | Inventário, backup/restore real, clientes/writers, desempenho e autorizações pendentes | CF-017/P01/P02 em_revisao |
| E: CF-029 | Fundação local e dependências integradas/aceitas | V1–V14; CF-023 isolamento/sessão; CF-028 especificação | Aceites9fa4fae/a7bc256 e liberação d806f82 | Ancestralidade e deltas reconferidos; SPEC §8 e CF-029 examinadas | Nova migração/ownership/versão/conflitos/evidências precisam de testes próprios | Apta exclusivamente local/descartável; não executada |

## Parecer e achado aberto

**RV17-01:** o P1 original da FK está saneado. Permanece o mesmo resíduo **P2**,
sem duplicar ID: `tasks/evidencias/CF-017/ROLLOUT-LEGADO.md:25`, `:65`, `:133`.
Esperado: controlar writers/DDL antes do último preflight e até baseline; alteração
de alvo/schema/history ou interrupção da janela exige nova verificação. Escritas
e nextval também invalidam a comparação de capturas separadas e exigem repetir
as etapas afetadas do backup/restore. Observado: essa ligação temporal ainda não
é explícita no procedimento. O probe passa, remove FK, recebe exit2 no novo gate
e demonstra que baseline sem repetir/respeitar o gate pode chegar à V14 sem FK.
Impacto: reutilização operacional de aprovação obsoleta. Encerramento requer
somente saneamento do runbook e revalidação documental dirigida contra esse caso.
Não há necessidade demonstrada de coordenador distribuído novo.

**RV17-02:** encerrado no escopo local; novo ciclo dirigido reconfirma fidelidade
lógica e sensibilidade das contraprovas. Não equivale a igualdade binária do dump
nem ao cumprimento do backup/restore real. O marcador COMPLETE representa término
da captura; não é assinatura contra adulteração posterior dos diretórios.

**CF-017:** fundação local aprovada; estado integral em_revisao preservado. Dos
quatro critérios originais, os três locais conservam aceite; compatibilidade real
continua não demonstrada, além do resíduo operacional explícito acima.
**P01/P02:** permanecem em_revisao; não há proveniência histórica fabricada nem
transferência de inventário, backup, consumidores/writers reais ou medição à CF-029.

**CF-029:** apta a iniciar somente em banco novo/gerenciado descartável na base
`bcec50c`, código também presente no HEAD examinado. CF-023 e CF-028 continuam
dependências: aceites integrados, nenhum delta no núcleo de autenticação conferido;
SPEC mudou desde a7bc256 apenas para registrar aceite. A regra de liberação parcial
em EXECUCAO.md permite a prontidão já registrada. Rascunho deve acrescentar migração
posterior à V14 e provar GET/PUT, persistência, ownership, conflito entre versões,
retomada, limites e ausência de efeito financeiro. Nenhum aceite antecipado dessas
funcionalidades, CF-030–034 ou publicação. CF-015 não é dependência nova deste recorte.

## Custos, consistência e limites

Preflight não varre dados: catálogo de M objetos e comparação O(M log M), memória
O(M). Snapshot usa O(T+S) consultas para tabelas/sequences, sem consulta por linha.
Hash custa O(bytes lidos); ordenação textual pode custar O(N log N) por tabela e
spill em disco, sem garantia de usar índice nativo da PK. Streaming fetch512 limita
lotes, mas um campo grande e catálogo ainda consomem memória. Arquivos custam cerca
de65 caracteres por hash de campo, mais chave, cabeçalhos e catálogo. Comparador
percorre arquivos e para na primeira divergência por arquivo; não entrega diff de
todas as linhas. Diagnóstico por campo melhora localização ao custo de disco.

ACCESS SHARE e transação longa podem bloquear DDL e reter versões/vacuum. Lock5s
e statement120s são limites por operação, não SLA global. Aceitável para ensaio
operacional restrito; volume/tempo de produção não inferidos da fixture pequena.
O snapshot compartilhado estabiliza linhas; nextval/sequences exigem freeze próprio.
CLI manual usa sessões separadas: somente freeze contínuo torna snapshot e dump
comparáveis. Retomar writers/DDL invalida essa condição; aprovação não é permanente.

ACLs/roles/owners/extensões/dependências externas/cluster não são certificados por
este dump de schema sem owner/privileges. Equivalência lógica coberta, igualdade
dos arquivos produzidos e checksum de identidade do dump são garantias distintas.
Formas SQL equivalentes desconhecidas podem exigir revisão; normalização de CHECK
é estreita aos casts de arrays de literais de enum, sem normalizar dados monetários
ou temporais. Nenhuma promessa de concorrência ou escala de produção.

Próximo trabalho delimitado: sanar a validade temporal no runbook e revalidar esse
resíduo de RV17-01. CF-029 só começa por solicitação própria; adoção real conserva
inventário, compatibilidade, backup/restore, proveniência, coordenação, medição e
autorização de baseline/migração/publicação como gates separados.
