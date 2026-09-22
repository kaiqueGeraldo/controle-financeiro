# Plano de adoção de banco legado CF-017

Este é um runbook, não autorização para Railway. Executar somente após revisão
independente, credenciais/ambiente corretos e janela aprovada.

## Pré-condições e ensaio

1. Identificar host/database/schema por mecanismo seguro e confirmar PostgreSQL,
   extensão, timezone apenas como inventário (nunca como prova de origem) e versão.
2. Obter schema-only dump e consultas de catálogo descritas no inventário. Comparar
   com V1; confirmar ausência de histórico Flyway e das colunas V2. Divergência
   bloqueia a baseline; não usar `repair` ou `baselineOnMigrate` para escondê-la.
3. Inventariar volumes, tamanhos, bloat, índices duplicados, locks/transações longas,
   writers, jobs e conexões. Medir V2 em clone restaurado com dados representativos.
4. Criar backup em formato custom, registrar checksum/tamanho/revisão e ensaiar
   restore em banco isolado. Reconciliar contagens, somas, FKs, amostras brutas,
   nulls e metadados; `pg_restore --list` não substitui restore completo.
5. No clone, executar o mesmo artefato: preflight → baseline explícita V1 → validate
   → migrate V2 → Hibernate validate → smoke temporal → segundo migrate zero.

Exemplo conceitual, com conexão/segredos injetados pelo ambiente e nunca no Git:

```powershell
./mvnw.cmd flyway:baseline -Dflyway.baselineVersion=1
./mvnw.cmd flyway:validate
./mvnw.cmd flyway:migrate
./mvnw.cmd flyway:info
```

O plugin mantém `baselineOnMigrate=false` e `cleanDisabled=true`. A baseline é um
ato único e auditado que afirma “este schema já corresponde à V1”; ela não executa
V1 nem corrige diferenças.

## Ordem de publicação

1. Congelar todos os writers: aplicação antiga, crons, jobs, scripts e acessos
   administrativos. Leituras podem continuar somente se a janela permitir.
2. Confirmar novamente revisão/target, backup, restore ensaiado e ausência de
   transações longas. Registrar contagens e `flyway info` antes.
3. Executar baseline V1 somente se o preflight for idêntico; validar e migrar V2.
4. Conferir history/checksums, colunas/constraints/índices, contagens, FK inválidas,
   valores brutos e nulls. Executar Hibernate validate com o binário candidato.
5. Publicar a aplicação nova antes de liberar escrita. Escritores antigos não podem
   criar/editar linhas canônicas: eles mudariam aliases sem manter origem/auditoria.
6. Fazer smoke de criação/edição/leitura/paginação/exportação e conferir banco.
   Monitorar erros, locks, latência e crescimento; manter writers congelados se
   qualquer reconciliação falhar.

## Recuperação

- Falha dentro de V2 antes do commit: PostgreSQL reverte DDL e Flyway não marca V2.
  Diagnosticar, preservar logs e repetir a mesma versão corrigida **somente antes de
  ela ter sido aplicada em qualquer ambiente compartilhado**.
- V2 aplicada, sem escrita nova: as mudanças são aditivas. Preferir manter V2 e
  corrigir/publicar o binário; a aplicação antiga só pode voltar com writers ainda
  congelados e decisão explícita, pois não mantém metadados.
- Após qualquer escrita nova: não remover colunas, não restaurar backup por cima e
  não voltar escritores antigos. Congelar escrita, preservar o banco, restaurar o
  backup em ambiente separado e aplicar correção progressiva V3. Reconciliar cada
  operação posterior ao backup antes de liberar. Sem recibo durável de CF-024, não
  há garantia de replay completo; esse risco bloqueia promessa de rollback simples.
- Corrupção/perda física: restaurar em banco novo, migrar/reconciliar e trocar o
  alvo somente após validação. Manter o original isolado para investigação.

## Gate atual

Faltam schema/volumes/versão/trilhas reais, backup restaurável real, ensaio de
restore real e janela/coordenação de writers. Portanto publicação, baseline,
migração remota e certificação Railway continuam bloqueadas. Trabalho local de
CF-018 pode usar V1/V2 em PostgreSQL descartável depois de revisão/integrar CF-017;
qualquer deploy financeiro continua sujeito a este gate.
