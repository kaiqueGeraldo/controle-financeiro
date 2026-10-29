# Comandos, sequência e falhas preservadas

Rodada Windows/mesma sessão, diretório novo. Não repetir comandos de criação
contra a execução entregue. Reprodução futura exige outra pasta com prefixo
`revalidacao-rvpla05-`, candidato isolado e scripts de revisão copiados do commit
`98869a1d7db2068bce68d27b8800e7482d8a7281`. Não resetar esta working tree nem
atribuir seu HEAD documental a inputs exportados anteriormente. Inventários e
snapshots históricos são específicos deste computador, não instalador portátil.

## Ambiente e fronteira Git

```powershell
$taskRepo = 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro'
$taskRoot = '../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rvpla05-20261027-01'
$env:JAVA_HOME = Join-Path $taskRepo 'controle-financeiro-backend\target\temurin21\jdk-21.0.12.1+1'
$env:PATH = "$env:JAVA_HOME\bin;C:\Users\Aluga.com\AppData\Local\Programs\DockerDesktop\resources\bin;$env:PATH"
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor 9c27881ca0506b0206c59d9e0e9fd1723efa83d9 019a6ce39fdb2e7182addedacc83fd634f9c778e
git diff 9c27881c..019a6ce3 -- .github/scripts/owned-process.ps1 tasks/evidencias/preparacao-local-adocao/counterproof-supervision.mjs
git status --short
git diff --cached --name-status
```

Java21.0.12.1+1, Node24.18.0/libuv1.52.1, Maven3.9.12, Docker Desktop local.
Somente o README raiz alheio estava modificado; candidato/branch exatos e staging
vazio. Instruções AGENTS fornecidas pelo usuário aplicadas; nenhum arquivo AGENTS
adicional encontrado nos caminhos relevantes. Políticas/tasks e provas anteriores
confrontadas com o delta. Consultas oficiais usadas apenas para semântica das APIs,
citadas nos documentos. Sem mudança de privilégio Windows/ACL ou impersonação;
gravações na pasta irmã e processos de teste usaram a permissão da ferramenta
correspondente ao escopo autorizado.

## Execução finita, em ordem

```powershell
node tasks/evidencias/revalidacao-RVPLA-05/preservar.mjs inicial
node tasks/evidencias/revalidacao-RVPLA-05/executar.mjs $taskRoot setup
node tasks/evidencias/revalidacao-RVPLA-05/executar.mjs $taskRoot timing
node tasks/evidencias/revalidacao-RVPLA-05/plumbing.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/executar.mjs $taskRoot timing-valid
node tasks/evidencias/revalidacao-RVPLA-05/executar.mjs $taskRoot mutation
node tasks/evidencias/revalidacao-RVPLA-05/perfil.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/executar.mjs $taskRoot fixture
node tasks/evidencias/revalidacao-RVPLA-05/alheio.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/executar.mjs $taskRoot groups
node tasks/evidencias/revalidacao-RVPLA-05/executar.mjs $taskRoot audit
node tasks/evidencias/revalidacao-RVPLA-05/protocolo.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/executar.mjs $taskRoot real
node tasks/evidencias/revalidacao-RVPLA-05/diagnostico.mjs $taskRoot
```

Os comandos independentes continuaram após falhas, preservando cada status/log;
não se apresenta a sequência inteira como script verde. `timing-valid` contém
exatamente três medidas prefixadas, nenhuma reexecutada. `mutation`, perfis e
diagnóstico têm finalidades próprias e não acrescentam aprovações de20s.
O plano registra os adendos antes dos experimentos correspondentes.

Falhas e limitações dos observadores:

- `medida01/02/03` pararam antes de compilar/criar atores: adaptação ampla havia
  alterado ambos os operandos do redirecionamento interno. `plumbing.mjs` corrigiu
  somente cópias/destinos, preservou versão anterior e SHA. Originais/assertions/
 20s intactos; as três observações válidas foram feitas nas novas pastas prazo01/02/03.
- Mutação direta: timeout da barreira wrapper.json; depois o reporter não encontrou
  B. Não prova regressão de retorno de B. Perfil gerenciado posterior, já previsto,
  alcançou B e demonstrou a cauda e o estouro esperado. Helpers restaurados.
- Perfil nativo: timeout/consulta a PID já encerrado, seguido de erro ao agregar
  métrica ausente. Fonte restaurada; TSV/eventos existentes analisados sem novos
  atores. Não foi declarado controle20s aprovado.
- Probe completo original: falhou no20s, não na assertion de fixture desta vez;
  código30s original preservado. Complemento alheio guarda o probe20s falho e
  testa a preservação física separadamente, com negativo sensível.
- Protocolo:4 casos escritos no resultado original. No quinto, request errado foi
  rejeitado e Job fechado; o reporter releu o slot sobrescrito deliberadamente
  pelo worker e buscou o UUID novo, causando ENOENT. Versão1 arquivada em
  protocolo-v1.mjs.txt; erro/atores/recibos preservados. Caminho da resposta foi
  corrigido apenas no observador de revisão. O quinto não foi repetido.
- Diagnóstico60s: o probe terminou naturalmente após20s e seu reporter recusou
  aprovação por margem negativa, como devido. Timer da fotografia auxiliar usou
  descriptor sem campo resume e não disparou; a fotografia nativa não existe.
  `diagnostico-trace.mjs` reconstruiu somente a ordem dos eventos existentes,
  explicitando esse limite, sem novo teste.
- Consulta exploratória de CPU/memória por CIM foi negada no contexto da ferramenta;
  sem medição de carga utilizável ou atribuição ambiental. Essa saída só está na
  conversa, não se inventou log coletado. Probes nativos autorizados foram executados
  normalmente; essa consulta não é falha do candidato nem contraprova de latência.

## Consolidação sem repetir atores

```powershell
node tasks/evidencias/revalidacao-RVPLA-05/analisar.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/recuperar-observacao.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/protocolo.mjs $taskRoot publish-only
node tasks/evidencias/revalidacao-RVPLA-05/recursos.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/coletar.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/diagnostico-trace.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05/auditar.mjs
```

`publish-only` executou somente o sexto caso planejado, que ainda não começara.
O quinto foi conferido por reply/closed imutáveis existentes: erro operacional,
code130, Job ausente, nenhum decision de sucesso. O protocolo original não é6/6
verde. `recursos.mjs` só consulta; outra sessão e recibo inválido ficam sem
certificado. `coletar.mjs` preserva mapa SHA de1.602 artefatos e inventário de
3.737 arquivos, inclusive fontes executadas/temporárias e binários só por hash.
Nenhum `.exe`, `.class`, `.jar`, `.env` ou pacote de release foi versionado.

Preflight real exportou834 inputs do candidato019a6ce3. Seleção única
`only=preflight-hides-missing-constraint`, imagem local anterior
`sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`.
Uma assertion causal esperada, zero erros/skips, complete/restauração válidos;
resume, audit e identidade passaram, sem nova tentativa/Maven no reuse/audit.
Não é suíte financeira integral nem novo pacote.

## Preservação e commits

Provas no commit98869a1d; após a redação dos sete documentos e quatro notas:

```powershell
node tasks/evidencias/revalidacao-RVPLA-05/preservar.mjs final
git diff --check -- tasks
Get-FileHash -LiteralPath README.md -Algorithm SHA256
git diff --cached --name-status
```

Snapshots exclusivos, não sobrescrevíveis. O final registra o HEAD de provas antes
do commit documental; o HEAD final está na entrega, sem autorreferência. O auditor
com `--staged` conferiu todos os1.602 blobs coletados antes do commit de provas;
sintaxe/JSON/hashes do runtime também foram conferidos. Diff de fontes revisado;
logs brutos conservam whitespace/bytes históricos. Staging explícito em ambos os
commits, README raiz excluído. Sem clean/reset, limpeza geral de target, correção
de implementação, remoto, adoção real ou repetição de testes após a redação.
