# Regra, persistência de issues e custo

## Regra independente do código

SPEC-001 §2 permite folhas ausentes e inconsistências em rascunhos, exige issues
para incompatibilidades e rejeita valores presentes malformados. §3 distingue
NUMERIC de dinheiro e restringe reservas a metas monetárias. §5.1 exige meta
monetária própria também em ASSIGN. FieldError (§5) contém path/code/message;
não tem severidade e não deve ecoar dados financeiros.

Logo, Allocation/ASSIGN para meta NUMERIC estruturalmente válida deve salvar200,
sem remover valor/vínculo/meta, mas com issue no campo goal do item. O código
GOAL_TYPE_MISMATCH não é um literal previamente imposto pela SPEC: é uma extensão
coerente de códigos de campo, com significado preciso e formato existente.
Os paths são /sections/allocations/items/{i}/goal e
/reservationConfirmations/{i}/goal. Mensagem genérica: “Revise este campo.”
MONETARY não recebe esse mismatch. Ref temporária pendente mantém sua issue;
folha ausente mantém REQUIRED; id+tempId malformado400; alheio/ausente persistido404
uniforme. A inconsistência não deve antecipar rejeição financeira da CF-030.

## Semântica de GET: decisão sustentada

A SPEC não contém uma frase isolada dizendo “todas as issues são recalculadas
no GET”. A leitura conjunta dos §§2/5/6 define recuperar o último save confirmado,
comparar snapshot/versão após resposta perdida, revalidar dependentes quando a
resposta é alterada e validar fontes/snapshots na preparação/aplicação. SessionView
transporta payload/issues/versão; PUT retorna a avaliação do snapshot confirmado.
Não está previsto um comando de reavaliação dinâmica no GET de rascunho.

Portanto é conforme recuperar as issues persistidas junto com aquele save.
Isso também preserva a decisão explicitamente examinada na revisão anterior
(revisao-CF-029/ANALISE.md), sem usar apenas o relatório do executor como norma.
Uma mudança externa pode tornar a avaliação antiga: o próximo SAVE/PAUSE/RESUME
reavalia as referências atuais e a CF-030 deverá revalidar autoritativamente antes
de preparar/aplicar. Referência removida gera404 na próxima escrita, preservando
o último confirmado; GET continua recuperável. Nenhuma issue vazia autoriza
aplicação financeira. Se fosse desejada avaliação dinâmica, seria mudança de contrato.

Distinção: mode NEW/COMPLEMENT é calculado por fatos atuais (SPEC §4), não faz
parte de uma promessa de congelar toda SessionView. O probe de remoção mantém
outro fato próprio para isolar payload/issues/versão da mudança legítima de mode.

Verificação real: o teste dirigido altera tipo NUMERIC→MONETARY no banco; GET
conserva avaliação, próximo save reduz25 mismatches para24 sem misturar índices.
O probe independente remove a meta: GET conserva a avaliação salva e o próximo
PUT404 não sobrescreve a sessão. JDBC e nova requisição/token conferem estado.

## Implementação e preservação dos aceites

Delta de produto eb70a4b..aa88ecc: apenas DraftConsistency e DraftReferences.
Não mudou migration/schema, DraftValidator/decimais, OnboardingDraftService,
transação, ordem/timeout de locks, versão, UserService ou exclusão integrada.
Os aceites originais dessas áreas permanecem válidos no recorte aprovado;
não foi exigida reexecução de toda a matriz por associação.

DraftReferences coleta tipos GOAL na consulta owner-scoped já existente. A nova
avaliação ocorre após ownership de todas as refs e revisão de registros protegidos,
antes de persistir. Não permite descobrir tipos alheios por issues. O avaliador
indexa CREATE por tempId, resolve alias LINK por id próprio e lê refs diretas do
mesmo mapa. Ausência mantém diagnóstico anterior; DISCARD/null retorna lista vazia.
Composição com issues estruturais/de consistência existentes é aditiva e cada save
reconstrói o conjunto, evitando acumulação de diagnósticos antigos.

O método público pressupõe payload previamente validado, conforme seu único
chamador de produto. Não há novo endpoint nem dependência JDBC no domínio.
Mais um passe linear é um custo aceitável para evitar duplicação da regra em GET.
Não há motivo demonstrado para alterar locks, schema ou arquitetura neste saneamento.

## Observador, complexidade e limites

O observador inicial contou a entrada query(String,Map,RowCallbackHandler) e
query(String,SqlParameterSource,RowCallbackHandler) delegada como duas consultas.
Falha histórica: esperado1, observado2. Bytecode do spring-jdbc7.0.3 local confirma
a delegação. Filtrar somente a entrada Map corrige a unidade medida, sem elevar
a expectativa nem esconder segunda consulta de produto nessa rota.

Probe independente usa um filtro mais amplo para query com FROM goals, observa
ambos os overloads e confere parâmetros: uma entrada Map, uma delegação e IDs
exatamente iguais ao conjunto enviado, com owner correto, tanto para1 como50 metas.
Paths esperados são literais por índice NUMERIC; leitura posterior não emite query
de referência a metas. A consulta de classificação mode continua existindo e não
é confundida com consulta por item. Não se mediu “SQL total=1”.

O observador conta chamadas Java reais ao template, não tráfego JDBC ou planos
do PostgreSQL. Isoladamente não detectaria SQL emitido por caminhos não observados.
Aqui é combinado com o diff completo: nenhum novo SQL ou chamada a repositório foi
adicionado, apenas reaproveitamento de resultados e mapas em memória. Não há N+1
novo no caminho alterado. Para G metas locais, R IDs persistidos, A alocações e C
confirmações, custo adicional O(G+R+A+C), memória O(G+R+I) incluindo I issues.
O custo da consulta IN cresce com cardinalidade; não é certificação de latência,
carga, índices ou desempenho de produção.

## Independência das provas

O teste original permaneceu byte a byte com SHA256
45AD002AB3F96D167F87289C9AD9E444E9F91CB57C098BD3A1D3CE3A4F99580E.
Sua assertion original não foi editada: vermelho histórico, verde no candidato,
vermelho novamente sem a regra na cópia. Os cinco probes/scripts anteriores e57
arquivos de evidência da revisão foram conferidos por hash.

Os testes do saneamento usam o validador de produto para produzir parte do expected
normalizado. Essa comparação sozinha não prova preservação da normalização. Por
isso o probe adicional envia payload já canônico e compara a árvore inteira com
uma cópia literal da entrada, sem chamar o validador para calcular expected.
Reserva/ASSIGN mistos preservam tipos, valores e identidades, com dois paths exatos;
BOUNDARY_UNCONFIRMED e DUPLICATE_REFERENCE continuam presentes. Snapshot de todas
as tabelas de domínio não muda; somente a sessão avança. Não foi feito saneamento
de produto, relaxamento de assertions, retry para obter verde ou aumento de timeout.
