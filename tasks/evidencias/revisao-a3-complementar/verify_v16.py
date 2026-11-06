import hashlib
import io
import json
import pathlib
import re
import secrets
import subprocess
import sys
import time
import zipfile

root = pathlib.Path(sys.argv[1]).resolve()
a2 = root.parent / '20261106-lote-a2'
a3 = root.parent / '20261106-lote-a3'
receipt = json.loads((root / 'recibo.json').read_bytes())
manifest = json.loads((a2 / 'recibo.json').read_bytes())['migration']['reconciliation']
image = 'ghcr.io/railwayapp-templates/postgres-ssl@sha256:5e806d28c18198f933d25e79989470a47a938f465bf0634e030b416961b3463e'
container = 'cf-review-v16-' + secrets.token_hex(5)
admin = 'cf_review_bootstrap'
db = 'controle_financeiro'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def docker(*args, data=None, required=True):
    run = subprocess.run(['docker.exe', *args], input=data, capture_output=True, timeout=70)
    if required and run.returncode:
        raise RuntimeError(f'docker {args[0]} failed (exit={run.returncode}): {run.stderr.decode(errors="replace")[:350]}')
    return run

def sql(command, database=db):
    result = docker('exec', '-i', container, 'psql', '-XqwAt', '-F', '\t',
                    '-v', 'ON_ERROR_STOP=1', '-U', admin, '-d', database, data=command.encode())
    return result.stdout.decode().rstrip('\r\n')

def catalog():
    return sql("""
SELECT 'RELATION',c.relname,c.relkind,c.relrowsecurity,pg_get_userbyid(c.relowner)
  FROM pg_class c WHERE c.relnamespace='public'::regnamespace ORDER BY c.relname;
SELECT 'COLUMN',c.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,
       coalesce(pg_get_expr(d.adbin,d.adrelid),'')
  FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
  LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
 WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('r','p','v','m')
   AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum;
SELECT 'CONSTRAINT',c.relname,k.conname,k.convalidated,pg_get_constraintdef(k.oid)
  FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid
 WHERE k.connamespace='public'::regnamespace ORDER BY c.relname,k.conname;
SELECT 'INDEX',c.relname,i.indisvalid,i.indisready,pg_get_indexdef(c.oid)
  FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
 WHERE c.relnamespace='public'::regnamespace ORDER BY c.relname;
SELECT format('SELECT %L,%L,count(*) FROM public.%I','ROWCOUNT',relname,relname)
  FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')
  AND relname<>'flyway_schema_history' ORDER BY relname
\\gexec
""")

def canon(line):
    if not (line.startswith('CONSTRAINT\t') and '\tCHECK (' in line):
        return line
    pat = r"\(\(ARRAY\[((?:'[A-Z_0-9]+'::character varying)(?:, '[A-Z_0-9]+'::character varying)*)\]\)::text\[\]\)"
    return re.sub(pat, lambda match: '(ARRAY[' + ', '.join(
        '(' + item + ')::text' for item in match[1].split(', ')) + '])', line)

for item in receipt['evidence']:
    assert sha((root / item['file']).read_bytes()) == item['sha256'], item['file']
assert sha((a2 / 'recibo.json').read_bytes()) == receipt['earlierEvidence']['a2']
assert sha((a3 / 'recibo.json').read_bytes()) == receipt['earlierEvidence']['a3']
archive = (root / 'backup-protegido/v16-completo.dump').read_bytes()
roles = (root / 'backup-protegido/roles-sem-senhas.sql').read_bytes()
assert not re.search(rb'PASSWORD\s+\x27', roles, re.I)
assert not re.search(rb'SCRAM-SHA-256\$|md5[0-9a-f]{32}', roles)
jar = (root / 'release/api.jar').read_bytes()
assert sha(jar) == receipt['package']['jarSha256']
source_commit = receipt['sourceCommit']
with zipfile.ZipFile(io.BytesIO(jar)) as packaged:
    prefix = 'BOOT-INF/classes/db/migration/'
    names = {entry.removeprefix(prefix) for entry in packaged.namelist()
             if entry.startswith(prefix) and entry.endswith('.sql')}
    assert names == {item['script'] for item in manifest}
    for item in manifest:
        file = item['script']
        source = subprocess.check_output(['git', 'show', f'{source_commit}:controle-financeiro-backend/src/main/resources/db/migration/{file}'])
        executor = (a2 / 'executor/src/main/resources/db/migration' / file).read_bytes()
        assert sha(source) == sha(executor) == sha(packaged.read(prefix + file)) == item['sha256']
    print('SHA-256 confirmado: 14 arquivos do lote, recibos A2/A3, JAR e 16 SQL (Git/A2/JAR)')
    print('Dependências:', ', '.join(name.rsplit('/', 1)[-1] for name in packaged.namelist()
          if re.match(r'BOOT-INF/lib/(postgresql|flyway|okhttp|okio|jackson-databind|spring-boot-|hibernate-core|resend-java|kotlin-stdlib)', name)
          and name.endswith('.jar')))
assert docker('image', 'inspect', image).returncode == 0
try:
    docker('run', '-d', '--rm', '--pull=never', '--name', container, '--network=none',
           '--tmpfs', '/var/lib/postgresql/data:rw,exec,size=300m',
           '-e', 'PGDATA=/var/lib/postgresql/data/pgdata', '-e', f'POSTGRES_USER={admin}',
           '-e', 'POSTGRES_DB=postgres', '-e', 'POSTGRES_PASSWORD=' + secrets.token_hex(24), image)
    for _ in range(50):
        if docker('exec', container, 'pg_isready', '-q', '-h', 'localhost', '-d', 'postgres', required=False).returncode == 0:
            break
        time.sleep(1)
    else:
        raise RuntimeError('fixture not ready')
    toc = docker('exec', '-i', container, 'pg_restore', '--list', data=archive).stdout.decode()
    for line in toc.splitlines()[:15]:
        if re.search(r'Dump Version|Format|Compression|Dumped from|Dumped by|TOC Entries', line):
            print(line)
    assert 'TABLE DATA public flyway_schema_history' in toc
    assert 'Dumped from database version: 17.11' in toc and 'Dumped by pg_dump version: 17.11' in toc
    assert sql("SELECT count(*) FROM pg_database WHERE datname='controle_financeiro';", 'postgres') == '0'
    assert docker('exec', '-i', container, 'psql', '-Xqw', '-v', 'ON_ERROR_STOP=1',
                  '-U', admin, '-d', 'postgres', data=roles).returncode == 0
    restore = docker('exec', '-i', container, 'pg_restore', '-w', '-U', admin,
                     '--exit-on-error', '--create', '-d', 'postgres', data=archive)
    print(docker('exec', container, 'pg_restore', '--version').stdout.decode().strip())
    print('roles psql exit=0; pg_restore --exit-on-error --create exit=' + str(restore.returncode))
    assert sql("SELECT current_setting('server_version_num');") == '170011'
    history = sql("SELECT installed_rank,version,type,script,checksum,success FROM public.flyway_schema_history ORDER BY installed_rank;")
    expected = '\n'.join('\t'.join(map(str, (m['rank'], m['version'], 'SQL', m['script'], m['flywayChecksum'], 't'))) for m in manifest)
    assert history == expected and sha(history.encode()) == receipt['restore']['historySha256']
    assert sql('SELECT DISTINCT installed_by FROM public.flyway_schema_history;') == 'cf_adocao_migrator'
    source = [line for line in (a2 / 'production-executor-post.log').read_text(encoding='utf-8').splitlines()
              if line.startswith(('RELATION\t', 'COLUMN\t', 'CONSTRAINT\t', 'INDEX\t', 'ROWCOUNT\t'))]
    restored = catalog().splitlines()
    assert list(map(canon, source)) == restored
    rewrites = sum(x != y for x, y in zip(source, restored, strict=True))
    counts = {kind: sum(row.startswith(kind + '\t') for row in restored)
              for kind in ('RELATION', 'COLUMN', 'CONSTRAINT', 'INDEX', 'ROWCOUNT')}
    assert counts == {'RELATION': 134, 'COLUMN': 360, 'CONSTRAINT': 166, 'INDEX': 97, 'ROWCOUNT': 36}
    assert all(row.endswith('\t0') for row in restored if row.startswith('ROWCOUNT\t'))
    print(f'Histórico: 16 antes de qualquer Flyway; catálogo {counts}; {rewrites} linhas de casts equivalentes.')
    seq_rows = sql("""
SELECT format('SELECT %L,last_value,is_called FROM %I.%I',
              sequencename,schemaname,sequencename)
 FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename
\\gexec
""").splitlines()
    seq_sql = docker('exec', '-i', container, 'pg_restore', '--data-only', '--file=-', data=archive).stdout.decode()
    archived_seq = sorted((name, val, 't' if called == 'true' else 'f') for name, val, called in
         re.findall(r"^SELECT pg_catalog.setval\('public\.([a-z0-9_]+)', (\d+), (true|false)\);", seq_sql, re.M))
    assert len(archived_seq) == sum('SEQUENCE SET public' in line for line in toc.splitlines())
    assert [tuple(line.split('\t')) for line in seq_rows] == archived_seq
    assert sql("""
SELECT count(*) FROM pg_class seq JOIN pg_namespace ns ON ns.oid=seq.relnamespace
WHERE ns.nspname='public' AND seq.relkind='S'
AND EXISTS (SELECT FROM pg_depend dep JOIN pg_class tab ON tab.oid=dep.refobjid
WHERE dep.classid='pg_class'::regclass AND dep.refclassid='pg_class'::regclass
AND dep.objid=seq.oid AND dep.refobjsubid>0 AND dep.deptype IN ('a','i')
AND seq.relowner=tab.relowner);
""") == str(len(seq_rows))
    assert sql("""
SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname=current_database();
SELECT DISTINCT pg_get_userbyid(relowner) FROM pg_class
WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p','S');
""") == 'cf_adocao_admin\ncf_adocao_migrator'
    assert sql("""
SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,rolinherit,rolconnlimit
FROM pg_roles WHERE rolname='cf_adocao_api';
SELECT rolcanlogin FROM pg_roles WHERE rolname='cf_adocao_migrator';
SELECT count(*) FROM pg_auth_members WHERE member='cf_adocao_api'::regrole;
""") == 't\tf\tf\tf\tf\tf\tf\t12\nf\n0'
    assert sql("""
SELECT has_database_privilege('cf_adocao_api',current_database(),'CONNECT'),
       has_database_privilege('cf_adocao_api',current_database(),'TEMP,CREATE'),
       has_schema_privilege('cf_adocao_api','public','USAGE'),
       has_schema_privilege('cf_adocao_api','public','CREATE');
SELECT string_agg(relname,',' ORDER BY relname) FROM pg_class
 WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')
 AND has_table_privilege('cf_adocao_api',oid,'SELECT');
SELECT count(*) FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')
 AND has_table_privilege('cf_adocao_api',oid,'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER');
SELECT count(*) FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='S'
 AND CASE WHEN relkind='S' THEN has_sequence_privilege('cf_adocao_api',oid,'USAGE,UPDATE,SELECT') ELSE false END;
SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND prosecdef
 AND has_function_privilege('cf_adocao_api',oid,'EXECUTE');
SELECT count(*) FROM pg_db_role_setting WHERE setrole='cf_adocao_api'::regrole
 AND setconfig @> ARRAY['default_transaction_read_only=on'];
""") == 't\tf\tt\tf\nusers\n0\n0\n0\n1'
    print(f'Sequences em public: {len(seq_rows)}; estado do archive e cópia coincide.')
    print('ACL: role e owners esperados; CONNECT, USAGE, SELECT users, padrão read-only; zero DML, sequences e funções SECURITY DEFINER acessíveis no public.')
    cert = docker('exec', container, 'openssl', 'x509', '-in', '/var/lib/postgresql/data/certs/server.crt',
                  '-noout', '-subject', '-issuer', '-ext', 'subjectAltName', '-fingerprint', '-sha256', required=False)
    print('Certificado da nova cópia:', cert.stdout.decode().strip() if cert.returncode == 0 else f'consulta exit={cert.returncode}')
finally:
    if docker('inspect', container, required=False).returncode == 0:
        assert docker('stop', '--time', '8', container).returncode == 0
        assert docker('inspect', container, required=False).returncode != 0
        print('Contêiner descartável removido.')
