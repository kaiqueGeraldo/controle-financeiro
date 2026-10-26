"""Read existing evidence only; write compact review receipts in --output.

No network, application bootstrap, database access, extraction or cleanup.
Python 3 standard library. All failures stop the review without printing bytes.
"""
import argparse
import hashlib
import io
import json
import pathlib
import re
import subprocess
import zipfile
from datetime import datetime, timezone

BASE = 'fb986456a37a48afcafef204f165d15354294d26'
EXPECTED_README = '6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def digest_file(file):
    with file.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=repo)


def save(name, value):
    (out / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def preserved():
    return {p.name: {'bytes': p.stat().st_size, 'sha256': digest_file(p)}
            for p in sorted(runtime.iterdir()) if p.is_file()}


def inspect_archive(name, artifact):
    file = runtime / name
    digest = digest_file(file)
    assert digest == artifact['digest'].removeprefix('sha256:'), name + ': remote ZIP digest mismatch'
    assert file.stat().st_size == artifact['size_in_bytes'], name + ': size mismatch'
    with zipfile.ZipFile(file) as archive:
        members = archive.namelist()
        assert len(set(members)) == len(members), 'Duplicate ZIP members'
        assert all(not n.startswith('/') and '..' not in pathlib.PurePosixPath(n).parts
                   and '\\' not in n for n in members), 'Unsafe ZIP member'
        # No extraction and no publication of raw bytes.
        text_files = {n: archive.read(n) for n in members if n.endswith(('.json', '.log'))}
        sentinel_files = [n for n, b in text_files.items() if b'CF034_SENTINEL' in b]
        assert not sentinel_files, 'Unredacted synthetic sentinel'
        collections = {}
        for n, b in text_files.items():
            if n.endswith('collection.json'):
                record = json.loads(b)
                assert record['status'] == 'sanitized'
                parent = pathlib.PurePosixPath(n).parent
                for f in record['files']:
                    path = str(parent / f['publicFile'])
                    assert sha(archive.read(path)) == f['sanitizedSha256'], 'Collection hash mismatch'
                collections[n] = len(record['files'])
        return {'artifactId': artifact['id'], 'producer': artifact['workflow_run'],
                'zipSha256': digest, 'bytes': file.stat().st_size, 'members': members,
                'collectionHashesVerified': collections, 'syntheticSentinels': len(sentinel_files),
                'expiresAt': artifact['expires_at']}


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--runtime', type=pathlib.Path, required=True)
parser.add_argument('--output', type=pathlib.Path, default=pathlib.Path(__file__).resolve().parent)
parser.add_argument('--preservation-only', action='store_true')
args = parser.parse_args()
out = args.output.resolve()
repo = pathlib.Path(__file__).resolve().parents[3]
runtime = args.runtime.resolve()
assert runtime.is_dir() and out.is_dir()
readme = digest_file(repo / 'README.md')
assert readme == EXPECTED_README, 'README changed; investigate without restoring'
inventory = preserved()
initial_file = out / 'preservacao-inicial.json'
if not initial_file.exists():
    save(initial_file.name, {'at': datetime.now(timezone.utc).isoformat(),
         'entryHead': 'ddd5a4143827146e8e3abdb99aba4c101a9fddcd',
         'entryBranch': 'codex/cf034-ci-local', 'entryStaging': 'empty',
         'entryStatus': [' M README.md'], 'localMain': '272001f7b4c39aebd18bdcd856109f9a0f6c1213',
         'reviewBase': BASE, 'readmeSha256': readme,
         'runtime': str(runtime), 'runtimeFiles': inventory,
         'scope': f'{len(inventory)} files in referenced runtime; not a new inventory of every historical runtime'})
else:
    initial = json.loads(initial_file.read_text(encoding='utf-8'))
    assert initial['runtimeFiles'] == inventory, 'Referenced runtime changed'
    assert initial['readmeSha256'] == readme
if args.preservation_only:
    save('preservacao-final.json', {'at': datetime.now(timezone.utc).isoformat(),
         'headAtCheck': git('rev-parse', 'HEAD').decode().strip(),
         'branch': git('branch', '--show-current').decode().strip(),
         'staging': git('diff', '--cached', '--name-only').decode().splitlines(),
         'statusAtCheck': git('status', '--short').decode().splitlines(),
         'readmeSha256': readme, 'runtimeFilesUnchanged': len(inventory),
         'initialReceiptSha256': digest_file(initial_file),
         'scope': 'Exact byte preservation of referenced runtime and README; HEAD precedes receipt commit'})
    print('Preservation verified:', len(inventory), 'runtime files and README')
    raise SystemExit(0)

metadata = json.loads((out / 'consultas-remotas.json').read_text(encoding='utf-8'))
artifacts = {a['id']: a for a in metadata['artifacts'] + metadata['probeArtifacts']}
archives = {}
for name, identifier in [('main-package.zip', 12657946856), ('main-diagnosis.zip', 12658201593),
                         ('probe-contracts.zip', 12655978610), ('probe-cleanup.zip', 12657281838),
                         ('probe-ready.zip', 12656208348)]:
    archives[name] = inspect_archive(name, artifacts[identifier])

with zipfile.ZipFile(runtime / 'probe-contracts.zip') as contracts, zipfile.ZipFile(runtime / 'probe-ready.zip') as ready_zip, zipfile.ZipFile(runtime / 'probe-cleanup.zip') as cleanup_zip:
    contract = json.loads(contracts.read('public/result.json'))
    ready = json.loads(ready_zip.read('ready.json'))
    cleanup = json.loads(cleanup_zip.read('result.json'))
    assert contract['status'] == 'passed' and contract['subprocess']['steps'][-1]['exit'] == 23
    assert contract['missingReport']['detected'] and contract['tamperedPackage']['restored']
    assert not contract['sanitization']['ambiguous']['rawFallback']
    assert cleanup['runId'] == ready['runId'] and cleanup['status'] == 'passed'
    assert cleanup['runnerStatus'] == 'cancelled' and not cleanup['childAlive'] and not cleanup['descendantAlive']
    assert cleanup['containerRemoved'] and not cleanup['errors'] and not cleanup['approvedArtifact']
    assert ready['postgres']['network'] == 'none'
    save('provas-cancelamento.json', {'contracts': contract, 'cleanup': cleanup,
        'ready': {'runId': ready['runId'], 'postgres': ready['postgres']},
        'scope': 'Supported workflow cancellation plus explicit private cancel request in always cleanup; bounded synthetic processes/container; no unrelated Linux control or post-VM observation'})

with zipfile.ZipFile(runtime / 'main-package.zip') as package, zipfile.ZipFile(runtime / 'main-diagnosis.zip') as diagnosis:
    assert set(package.namelist()) == {'api-0.0.1.jar', 'public/package-manifest.json'}
    assert set(diagnosis.namelist()) == {'backend.log', 'build.log', 'collection.json', 'components.log',
        'e2e.log', 'lint.log', 'maven-version.log', 'package-manifest.json', 'playwright.log',
        'result.json', 'typecheck.log', 'unit.log'}
    manifest = json.loads(package.read('public/package-manifest.json'))
    assert manifest == json.loads(diagnosis.read('package-manifest.json'))
    result = json.loads(diagnosis.read('result.json'))
    assert manifest['commit'] == result['source']['commit'] == metadata['main'] == BASE
    inputs = manifest['sourceFiles']
    assert len(inputs) == 820 and len({f['path'] for f in inputs}) == 820
    assert sha(json.dumps(inputs, separators=(',', ':'), ensure_ascii=False).encode()) == manifest['sourceDigest']
    conversions = []
    for f in inputs:
        raw = git('show', BASE + ':' + f['path'])
        if sha(raw) != f['sha256']:
            # The only accepted conversion is explicitly committed in the backend attributes.
            assert f['path'] == 'controle-financeiro-backend/mvnw.cmd'
            attributes = git('show', BASE + ':controle-financeiro-backend/.gitattributes')
            assert b'*.cmd text eol=crlf' in attributes
            raw = raw.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')
            assert sha(raw) == f['sha256'], 'Input differs from tested Git object'
            conversions.append({'path': f['path'], 'conversion': 'committed text eol=crlf'})
    tracked = git('ls-tree', '-r', '--name-only', BASE).decode().splitlines()
    def relevant(p):
        if not (p.startswith(('.github/', 'controle-financeiro-backend/', 'controle-financeiro-frontend/'))
                or p in ['tasks/evidencias/CF-028/examples.json', 'tasks/evidencias/saneamento-CF-028-origem/snapshots.json']):
            return False
        return not (re.search(r'(^|/)(node_modules|target|\.next|\.git|test-results|playwright-report)(/|$)', p)
            or pathlib.PurePosixPath(p).name in ['.ci-source.json', 'next-env.d.ts']
            or p.endswith('.tsbuildinfo') or re.match(r'^\.env(?:\.|$)', pathlib.PurePosixPath(p).name))
    assert {p for p in tracked if relevant(p)} == {f['path'] for f in inputs}, 'Manifest path set mismatch'
    jar = package.read('api-0.0.1.jar')
    jar_hash = sha(jar)
    assert jar_hash == manifest['sha256'] == manifest['gates']['backend']['jarSha256'] == result['artifact']['sha256']
    assert len(jar) == manifest['bytes'] == 86225965
    assert jar_hash == 'c3860ec069aa893b8faed588f9a20904930a2937c0e8eb94818297651c85a9d9'
    assert result['status'] == 'passed' and all(c['exit'] == 0 for c in result['steps'])
    assert all(g['status'] == 'passed' and g['source'] == manifest['sourceDigest'] for g in manifest['gates'].values())
    bypath = {f['path']: f['sha256'] for f in inputs}
    assert manifest['dependencies']['pomSha256'] == bypath['controle-financeiro-backend/pom.xml']
    assert manifest['dependencies']['lockSha256'] == bypath['controle-financeiro-frontend/package-lock.json']
    classes = re.findall(r'Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+).* -- in ([\w.$]+)', diagnosis.read('backend.log').decode())
    assert len(classes) == 95 and len({c[4] for c in classes}) == 95
    totals = {k: sum(int(c[i]) for c in classes) for i, k in enumerate(['tests', 'failures', 'errors', 'skipped'])}
    assert totals == result['backend'] == {'tests': 891, 'failures': 0, 'errors': 0, 'skipped': 0}
    unit_runs = list(map(int, re.findall(r'# tests (\d+)', diagnosis.read('unit.log').decode())))
    assert unit_runs == [6, 6, 6] and sum(unit_runs) == result['unit']['tests']
    assert result['components']['tests'] == 620 and result['browser']['tests'] == 6 and result['e2eJava']['tests'] == 1
    with zipfile.ZipFile(io.BytesIO(jar)) as app:
        app_resources = [n for n in app.namelist() if n.startswith('BOOT-INF/classes/') and n.endswith(('.yml', '.yaml', '.properties'))]
        forbidden = [n for n in app.namelist() if re.search(r'(^|/)(\.env(?:\.|$)|id_rsa|id_ed25519|[^/]+\.(?:p12|pfx|jks)$)', n)]
        assert not forbidden, 'Unexpected secret-bearing resource category in JAR'
        jar_migrations = [n for n in app.namelist() if n.startswith('BOOT-INF/classes/db/migration/') and n.endswith('.sql')]
        assert len(jar_migrations) == 16
        for n in jar_migrations + app_resources:
            source = 'controle-financeiro-backend/src/main/resources/' + n.removeprefix('BOOT-INF/classes/')
            assert sha(app.read(n)) == sha(git('show', BASE + ':' + source)), 'Packaged resource differs'
    save('proveniencia-verificada.json', {'at': datetime.now(timezone.utc).isoformat(),
        'archives': archives, 'commit': BASE, 'tree': git('rev-parse', BASE + '^{tree}').decode().strip(),
        'sourceDigest': manifest['sourceDigest'], 'sourceInputsChecked': len(inputs),
        'inputSetMatchesGit': True, 'conversions': conversions, 'jarSha256': jar_hash, 'jarBytes': len(jar),
        'packagedMigrationsChecked': len(jar_migrations), 'packagedConfigurationChecked': app_resources,
        'counts': {k: result[k] for k in ['unit', 'components', 'backend', 'e2eJava', 'browser']},
        'backendClassLogCount': len(classes), 'unitRuns': unit_runs,
        'deferred': result['selection']['deferred'], 'commands': result['steps'],
        'sanitizationScope': 'All ZIP text members checked for synthetic sentinels and collection hashes; app resources match Git; no arbitrary-secret guarantee or binary-code audit',
        'binaryReproducibility': 'not tested', 'testExecution': 'existing remote artifacts independently inspected; suites not rerun',
        'download': 'Existing downloaded ZIPs reused after current API digest/size/producer verification; no new download required'})
print('PASS: 5 remote artifact digests, 820 inputs, JAR, packaged resources and remote counts verified')
