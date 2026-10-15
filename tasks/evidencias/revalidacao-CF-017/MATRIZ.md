# Matriz de critérios — base bcec50c

| Achado/critério | Garantia exigida | Implementação | Prova original | Prova independente atual | Limitação | Decisão |
|---|---|---|---|---|---|---|
| A / RV17-01 fonte | V1 independente das entidades/fixture | Manifesto congelado e catalog.sql | Gate original incompleto; manifesto do executor gerado de V1 | Parser direto do DDL:19tabelas/158colunas/49constraints/11índices; ManifestTest | Legado modelado, sem inventário real | Fonte aprovada |
| A / colunas | Tipos, precisão/escala, nullable/default | format_type/typmod, attnotnull, pg_get_expr | Matriz executor | Reexecução tipo temporal/precisão, numeric38,3, coluna/default/null | Sem provador geral de equivalência SQL | Aprovado |
| A / integridade | PK/UK/FK/check/índices/enforcement | Constraintdef/flags/índices/triggers | FK ausente originalmente aceita | FK ausente/errada/NOT VALID/desativada/ação; PK/UK ausentes; índice; novo FK outro_schema.users rejeitado | V1 sem CHECK; adicional exige revisão; V14 testado no restore | Defeito técnico original resolvido |
| A / adicionais/estado | Falhar fechado sem escrever | Multiconjunto, readonly, exits0/2/3 | Matriz executor | Vazio, gerenciado, parcial/historyfalho, extras; SQLState25006; antes/depois iguais | Índice simples adicional informativo não substitui obrigatório | Aprovado |
| A / encadeamento | Sem baseline após falha | CLI separado; initializer usa assert antes de Flyway | Runbook/initializer | Exit de processo2; alvo errado3; history ausente nos rejeitados | Operador pode contornar manualmente | Código aprovado |
| A / janela | Aprovação vigente antes da baseline | Freeze do runbook para captura/dump | Sem expiração explícita | Probe0→DDL→2; bypass antigo migra sem FK | Não exige mecanismo distribuído | RV17-01 residual P2 aberto |
| B / migrações | V1–V14 imutáveis e caminhos corretos | Flyway e Hibernate validate | Aceites anteriores e executor71 | Blobs iguais;18hashes; vazio/legado/V13→V14; checksum/falha/rollback/migratezero | Nenhuma V15; sem banco real | Fundação local aprovada |
| B / configuração | Sem update/baseline automática/clean | Perfis main/local validate; baselinefalse; cleanDisabledtrue | Revisão original/executor | Inspeção YAML/contextos reais | Perfil genérico de testes difere; gateCF017 sobrescreve | Aprovado |
| C / RV17-02 dados | Cada linha/campo/null/bruto/origem | PK/multiset, UTF8/tag/tamanho/SHA256 | Agregados originais insuficientes |21testesrestore + literal38dígitos/null/vazio/tab/newline + duplicata null | Não povoa todos os estados financeiros | Encerrado local |
| C / estrutura | Constraints/índices/sequences/history | Catálogo+sequences.txt+history.rows | Executor34arquivos/mutações | RestoreV1/V14 novo; Flywayvalidate; CHECK/índice/history/sequence detectados | Sem owners/ACL/cluster | Aprovado local |
| C / determinismo | Representação preserva informação | UTC/ISO/C/texto; normalização estreita CHECK | Falha dump/reparse preservada | FusoKiritimati; framing literal; CHECKmaterial;34pares atuais iguais | JSONB/instante não recuperam sintaxe/offset já descartados pelo PostgreSQL | Aprovado no contrato |
| C / falha | Restore parcial não aceito | exit-on-error/single-transaction/COMPLETE | Teste executor | exit1/targetUnchangedtrue; captura incompleta recusada | COMPLETE não é assinatura de armazenamento | Aprovado |
| C / writers | Mesma visão de linhas; sequences coordenadas | Snapshot exportado; freeze manual | Commit posterior do executor | Reexecução de commit após captura + dump snapshot | Sem nextval concorrente; freeze obrigatório | Condição operacional aceita |
| D / adoção | Alvo/backup/proveniência/writers medidos e autorizados | Runbook/P01/P02 | Sempre pendente | Nenhum acesso real | Sem inferência Railway | Pendente; em_revisao |
| E / CF029 | Fundação integrada, isolamento e contrato | V1–V14/CF023/SPEC001v1 | Aceites9fa4fae/a7bc256 | Ancestralidade/deltas pertinentes;71+4testes; parecer explícito | Testes próprios de rascunho/concorrência/owner obrigatórios | Apta local; não executada |

Provas originais: revisão-CF-017 e saneamento-CF-017, README/ACHADOS/MATRIZ/EXECUCOES
e logs, preservados. Provas atuais: verify.log, independent-probes.log,
manifest-independent.log, fontes dos probes, hashes e snapshots nesta pasta.
Parecer/limites em README.md; resíduo preciso em ACHADOS.md.
