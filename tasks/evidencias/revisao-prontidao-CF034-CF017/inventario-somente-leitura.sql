-- PROPOSTA para etapa FUTURA autorizada. Nao executado nesta revisao.
-- Executar com psql -X -v ON_ERROR_STOP=1, papel de leitura e service protegido.
-- Parametros psql: expected_database e target_schema; nunca credenciais no arquivo.
-- Inventario inicial de catalogos: nao certifica V1, dados, backup ou baseline.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '3s';
SET LOCAL timezone = 'UTC';
SELECT current_database() = :'expected_database' AS target_ok,
       EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = :'target_schema') AS schema_exists
\gset
\if :target_ok
\else
  ROLLBACK;
  \quit 2
\endif
\if :schema_exists
\else
  ROLLBACK;
  \quit 2
\endif
SELECT current_database() AS database_name, :'target_schema' AS target_schema,
       current_setting('server_version_num') AS server_version_num,
       current_setting('TimeZone') AS session_timezone,
       current_setting('transaction_read_only') AS transaction_read_only;
SELECT c.relkind, count(*) AS objects
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'target_schema'
GROUP BY c.relkind ORDER BY c.relkind;
SELECT t.typtype, count(*) AS types
FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = :'target_schema'
GROUP BY t.typtype ORDER BY t.typtype;
SELECT count(*) AS routines
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = :'target_schema';
SELECT count(*) AS constraints
FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = :'target_schema';
SELECT to_regclass(format('%I.flyway_schema_history', :'target_schema')) IS NOT NULL AS has_history
\gset
\if :has_history
  SELECT format('SELECT installed_rank, version, type, script, checksum, success FROM %I.flyway_schema_history ORDER BY installed_rank', :'target_schema')
  \gexec
\endif
ROLLBACK;
