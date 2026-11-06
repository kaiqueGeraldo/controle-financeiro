-- Executar somente com o lote de inventário autorizado.
-- Derivado do inventario-somente-leitura.sql de 46b85ee0.
-- psql -X -v ON_ERROR_STOP=1, papel de leitura, canal privado e alvo confirmado.
-- Parâmetros: expected_database e target_schema. Qualquer exit não zero exige parar.
\set ON_ERROR_STOP on
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '3s';
SET LOCAL search_path = pg_catalog;

SELECT current_database() = :'expected_database' AS target_ok
\gset
\if :target_ok
\else
  DO $ BEGIN RAISE EXCEPTION 'STOP: database divergente'; END; $;
\endif

SELECT current_database() AS database_name, :'target_schema' AS target_schema,
       current_setting('server_version_num') AS server_version_num,
       current_setting('TimeZone') AS session_timezone,
       current_setting('transaction_read_only') AS transaction_read_only,
       pg_is_in_recovery() AS recovery;

SELECT n.nspname AS schema_name,
       has_schema_privilege(n.oid, 'USAGE') AS role_has_usage
FROM pg_namespace n
WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'
ORDER BY n.nspname;

SELECT e.extname, e.extversion, n.nspname AS schema_name
FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY e.extname;

SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = :'target_schema') AS schema_exists
\gset
\if :schema_exists
\else
  DO $ BEGIN RAISE EXCEPTION 'STOP: schema ausente; confirmar escopo e objetos em outros schemas'; END; $;
\endif

SELECT has_schema_privilege(:'target_schema', 'USAGE') AS schema_visible
\gset
\if :schema_visible
\else
  DO $ BEGIN RAISE EXCEPTION 'STOP: papel sem USAGE no schema'; END; $;
\endif

SELECT c.relkind, count(*) AS objects
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'target_schema'
GROUP BY c.relkind ORDER BY c.relkind;

SELECT c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity,
       has_table_privilege(c.oid, 'SELECT') AS role_can_select
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'target_schema' AND c.relkind IN ('r', 'p', 'f', 'v', 'm')
ORDER BY c.relname;

SELECT t.typtype, count(*) AS types
FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = :'target_schema'
GROUP BY t.typtype ORDER BY t.typtype;

SELECT count(*) AS routines FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = :'target_schema';

SELECT count(*) AS constraints FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace WHERE n.nspname = :'target_schema';

SELECT n.nspname AS history_schema, c.relkind
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'flyway_schema_history'
ORDER BY n.nspname;

SELECT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = :'target_schema'
      AND c.relname = 'flyway_schema_history' AND c.relkind IN ('r', 'p')
) AS has_history
\gset
\if :has_history
  SELECT format('SELECT installed_rank, version, type, script, checksum, success FROM %I.flyway_schema_history ORDER BY installed_rank', :'target_schema')
  \gexec
\endif
ROLLBACK;
