# Execução e auditoria

Windows/sessão1, Node24.18.0, JDK21 explícito, Maven wrapper e Docker Desktop local.
Preparação executada quando HEAD era exatamente0b4c6598. Sem skip, retry de teste
ou aumento de40s. Não executar contra a pasta preservada; usar prefixo novo.

```powershell
$env:JAVA_HOME = 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro\controle-financeiro-backend\target\temurin21\jdk-21.0.12.1+1'
$env:PATH = "$env:JAVA_HOME\bin;C:\Users\Aluga.com\AppData\Local\Programs\DockerDesktop\resources\bin;$env:PATH"
$env:REVIEW_PWSH = (Get-Command pwsh).Source
$taskRun = [IO.Path]::GetFullPath('../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rvpla03-NOVO')
node tasks/evidencias/preparacao-local-adocao/prepare.mjs $taskRun
node tasks/evidencias/revalidacao-RVPLA-03/executar.mjs $taskRun
node tasks/evidencias/revalidacao-RVPLA-03/processos-independentes.mjs $taskRun all
node tasks/evidencias/revalidacao-RVPLA-03/processos-independentes.mjs $taskRun mutation
node tasks/evidencias/revalidacao-RVPLA-03/handoff.mjs $taskRun
$env:RVPLA03_REVIEW_RUNTIME = $taskRun
node --test --test-reporter=tap tasks/evidencias/revalidacao-RVPLA-03/quiescencia-handoff.test.mjs
# O teste acima é vermelho no candidato por RVPLA-04; não interpretar como erro de infraestrutura.
./tasks/evidencias/revalidacao-RVPLA-03/real.ps1 $taskRun
node tasks/evidencias/revalidacao-RVPLA-03/recursos.mjs $taskRun
```

Executar sequencialmente. Para reproduzir os hashes/candidato, usar checkout
isolado do commit informado; não resetar este worktree. Em descendente documental,
o manifesto deve registrar seu HEAD real, sem forjar0b4c6598. Os coletores desta
entrega são específicos desse candidato e recusam sobrescrever recibos existentes.

executar.mjs copia fontes para tools/ e altera **somente a allowlist de destino**
rvpla03→revalidacao-rvpla03 nos probes do saneamento; adaptacoes.json liga SHA
original/cópia. A reprodução original vem byte idêntica do blob9bed5e2; wrapper
PowerShell redireciona Copy-Item dos três módulos para blobs antigos, mantendo
script/assertions intactos. Nenhum Docker/DB nessa fixture de abandono.

Os43 testes rodam com REVALIDATION_RUNTIME, RESUME_TEST_RUNTIME e TMP/TEMP dentro
do runtime novo. Probes de CI só apagam seus próprios temporários sintéticos;
não há clean/reset ou limpeza geral de target. grupos process-5/edges-5/shared
usam o candidato final; as fontes adaptadas estão externas e seus hashes no mapa.

Regressão: pg16/pg17/linux e respectivos XMLs/commands em regression.json.
Invocações Maven test, --batch-mode, timezoneUTC e major explícita, JAR ou imagem
anterior. Wrapper continua após erros para registrar casos independentes; exit0
final não significa que os dois binds nativos passaram. Mutação de alocador só
no checkout exportado, restaurada por SHA antes do controle positivo.

processos-independentes all03 foi a rodada final,5/5. all/all02 preservam erros
dos probes v1/v2, sem editar seus resultados. A versão final calibra objeto Job
retido sem exigir filhos vivos; recursos reais e expected original de encerramento
não foram relaxados. Mutação usa o mesmo oracle por handles: red-test exit1 pelo
efeito tardio, restored-test exit0; fonte isolada restaurada.

handoff.mjs compila GUI diagnóstica fora do Git e insere uma barreira em cópia do
probe, entre QueryIds e resolução de identidades. O pai capturado cria filho e
termina antes de o loop original continuar. Worker usa ProofStore e supervisão
reais; efeito causal de negócio é fixture sintética de um arquivo, sem financeiro.
Wrapper exit0 encerra observação; o expected contratual fica vermelho. Native
probe restaurado por SHA. Não há correção do harness de implementação.

real.ps1 cria sentinel Docker lógico alheio, confere recusa antes de tentativa e
preservação, para apenas seu próprio ID e confirma ausência. Só depois executa
preflight realPG17 e resume/audit; perturbação da identidade do observador é em
cópia dos sete módulos. Não certifica as outras quatro contraprovas ou startup.

Auditoria da entrega, sem novos testes:

```powershell
node tasks/evidencias/revalidacao-RVPLA-03/auditar.mjs
```

preservar inicial/final e coletar foram executados uma vez para esta entrega.
Há513 blobs coletados auditados contra fontes e índice Git; originais4808
protegidos e894 artefatos anteriores reconferidos. O snapshot final é posterior
ao commit de provas eb785362 e anterior ao commit de parecer. HEAD final consta
na entrega, sem autorreferência no próprio commit. Logs -text preservam CRLF/
espaços; decodificação/sanitização constam nos hashes original/coletado.
