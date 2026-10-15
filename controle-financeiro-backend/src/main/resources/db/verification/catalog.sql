-- PostgreSQL 16 semantic inventory. Names of constraints/indexes and physical
-- column order are deliberately excluded; multiplicity is preserved.
WITH rel AS (
 SELECT c.* FROM pg_catalog.pg_class c
 JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname=current_schema()
), inventory AS (
 SELECT 'relation' AS kind, relname::text AS object,
 json_build_array(relkind,relpersistence,relrowsecurity,relforcerowsecurity,
   relreplident,reloptions)::text AS definition FROM rel WHERE relkind NOT IN ('i','I','S')
 UNION ALL
 SELECT 'column', c.relname||'.'||a.attname,
 json_build_array(format_type(a.atttypid,a.atttypmod),a.attnotnull,
   pg_get_expr(d.adbin,d.adrelid),a.attidentity,a.attgenerated,
   CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::regcollation::text END)::text
 FROM rel c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
 LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
 WHERE c.relkind IN ('r','p','v','m','f') AND a.attnum>0 AND NOT a.attisdropped
 UNION ALL
 SELECT 'constraint', r.relname,
 json_build_array(c.contype,pg_get_constraintdef(c.oid,false),c.convalidated,
   c.condeferrable,c.condeferred,c.connoinherit)::text
 FROM pg_catalog.pg_constraint c JOIN rel r ON r.oid=c.conrelid
 UNION ALL
 SELECT CASE WHEN NOT i.indisunique AND i.indexprs IS NULL AND i.indpred IS NULL
   AND i.indisvalid AND i.indisready AND i.indislive THEN 'plain-index' ELSE 'index' END,
 r.relname,
 json_build_array(substring(pg_get_indexdef(i.indexrelid) FROM ' USING .*'),
   i.indisunique,i.indisprimary,i.indisexclusion,i.indimmediate,i.indisvalid,
   i.indisready,i.indislive,i.indisreplident,i.indnullsnotdistinct)::text
 FROM pg_catalog.pg_index i JOIN rel r ON r.oid=i.indrelid
 UNION ALL
 SELECT 'sequence', r.relname,
 json_build_array(r.relpersistence,format_type(s.seqtypid,NULL),s.seqstart,s.seqincrement,s.seqmax,
   s.seqmin,s.seqcache,s.seqcycle,
   (SELECT json_build_array(d.refobjid::regclass::text,a.attname,d.deptype)
    FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_attribute a
      ON a.attrelid=d.refobjid AND a.attnum=d.refobjsubid
    WHERE d.objid=r.oid AND d.classid='pg_class'::regclass AND d.deptype IN ('a','i'))
 )::text FROM rel r JOIN pg_catalog.pg_sequence s ON s.seqrelid=r.oid
 UNION ALL
 SELECT 'trigger', r.relname, json_build_array(pg_get_triggerdef(t.oid,false),t.tgenabled)::text
 FROM rel r JOIN pg_catalog.pg_trigger t ON t.tgrelid=r.oid WHERE NOT t.tgisinternal
 UNION ALL
 SELECT 'internal-trigger-override',r.relname,
 json_build_array(c.conrelid::regclass::text,pg_get_constraintdef(c.oid,false),t.tgtype,t.tgenabled)::text
 FROM rel r JOIN pg_catalog.pg_trigger t ON t.tgrelid=r.oid
 JOIN pg_catalog.pg_constraint c ON c.oid=t.tgconstraint
 WHERE t.tgisinternal AND t.tgenabled<>'O'
 UNION ALL
 SELECT 'inheritance',r.relname,json_build_array(i.inhparent::regclass::text)::text
 FROM rel r JOIN pg_catalog.pg_inherits i ON i.inhrelid=r.oid
 UNION ALL
 SELECT 'rule', r.relname, json_build_array(pg_get_ruledef(w.oid,false),w.ev_enabled)::text
 FROM rel r JOIN pg_catalog.pg_rewrite w ON w.ev_class=r.oid
 UNION ALL
 SELECT 'policy', r.relname, json_build_array(p.polname,p.polcmd,p.polpermissive,
   pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid),p.polroles::text)::text
 FROM rel r JOIN pg_catalog.pg_policy p ON p.polrelid=r.oid
 UNION ALL
 SELECT 'routine', p.proname::text, json_build_array(p.prokind,
   pg_get_function_identity_arguments(p.oid))::text
 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname=current_schema()
 UNION ALL
 SELECT 'type',t.typname::text,json_build_array(t.typtype,format_type(t.typbasetype,t.typtypmod))::text
 FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace
 WHERE n.nspname=current_schema() AND t.typtype IN ('d','e','r','m')
)
SELECT kind,object,definition FROM inventory
ORDER BY kind COLLATE "C",object COLLATE "C",definition COLLATE "C"
