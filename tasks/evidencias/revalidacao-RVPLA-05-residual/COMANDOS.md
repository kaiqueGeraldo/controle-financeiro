# Comandos e observadores da revisão residual

Rodada28/10/2026 America/Sao_Paulo; timestamps brutos em UTC. Não executar comandos
de criação contra as pastas já entregues. Para reprodução, usar outro destino
novo com prefixo revalidacao-rvpla05-residual-, candidato isolado e scripts desta
revisão do commit66f0ec6288fcfdad7a8fb1652631657343e592ed, copiando apenas os
scripts necessários, sem sobrescrever evidências entregues/resetar a working tree
nem atribuir HEAD documental a build anterior. Inventários históricos são próprios
deste computador; não constituem instalador portátil.

## Ambiente, identidade e preservação

```powershell
$taskRepo = 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro'
$taskRoot = '../controle-financeiro-runtimes/preparacao-adocao/revalidacao-rvpla05-residual-20261028-01'
$env:JAVA_HOME = Join-Path $taskRepo 'controle-financeiro-backend\target\temurin21\jdk-21.0.12.1+1'
$env:PATH = "$env:JAVA_HOME\bin;C:\Users\Aluga.com\AppData\Local\Programs\DockerDesktop\resources\bin;$env:PATH"
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor acaa6ed9374f8c9a205d92955f0f4f946b17aa8a d8bd180a916e5c2351a4baa33368abcead1c2bef
git diff acaa6ed9..d8bd180a -- tasks/evidencias/preparacao-local-adocao/counterproofs.mjs
git status --short
git diff --cached --name-status
node tasks/evidencias/revalidacao-RVPLA-05-residual/preservar.mjs inicial
```

HEAD/branch exatos, base ancestral, staging vazio e somente README raiz alheio
modificado. AGENTS fornecido pelo usuário aplicado; nenhum adicional encontrado
nos caminhos relevantes. Tasks/políticas/revisões/saneamento e contratos confrontados
com o delta. Java21.0.12.1+1 explícito, Node24.18.0/libuv1.52.1, Maven3.9.12 e
Docker Desktop local. Permissão da ferramenta para runtimes externos/processos
descartáveis; sem elevação Windows, mudança de ACL ou impersonação.

O primeiro inventário conferiu19.841 protegidos e artefatos, mas não expandiu todos
os itens posteriores por esperar runtime/file em vez de source absoluto. Fonte
e recibo parciais arquivados em preservar-v1.mjs.txt e preservacao-inicial-parcial.json.
O observador foi ajustado ao schema real e a fotografia completa refeita **antes
de qualquer ator/runtime de teste**. Não houve alteração do candidato ou repetição
de teste. Snapshot correto exige todos os3.701 arquivos posteriores e registra
25.100 protegidos, sem transformar o delta autorizado em preservação da versão antiga.

## Amostra prefixada e comparação, sem seleção

```powershell
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot setup
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot timing
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot comparison
```

setup copia os drivers e altera só destinos, registrando SHA original/adaptado.
Os operandos originais rvpla03/rvpla04 que localizam fontes de controles permanecem
corretos. timing executou exatamente prazo01/02/03, sem warmup artificial ou retry.
Cada results.json registra status do probe, gate20s, close monotônico, queries,
guardiões, ambiente, overhead e restauração das oito fontes. Status0 do driver
agregador significa que ele terminou; o resultado do gate vem do probe registrado.

comparison executou uma só reversão de função/import de acaa6ed9. Esta observação
antiga falhou no20s, close censurado. Não se inventou duração natural nem se
alterou o gate. A comparação histórica18,564s passou e continua positiva, sem
ser apresentada como negativo. As contagens15/5/21 retornaram; hashes restaurados.

```powershell
node tasks/evidencias/revalidacao-RVPLA-05-residual/conferir.mjs $taskRoot
```

A primeira versão de conferir assumiu close presente também no antigo e falhou
ao acessar ns. Foi arquivada em conferir-v1.mjs.txt; correção do agregador só lê
o dado censurado existente, sem novos atores. conferencia-independente.json valida
as contagens e a correlação Job/run/request/reply, consulta externa após close,
restauração/estados e confirmação final antes do retorno das três rodadas atuais.

## Segurança e integração dirigidas

```powershell
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot safety
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot groups
node tasks/evidencias/revalidacao-RVPLA-05-residual/confirmacao-externa.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot real
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot analysis
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot resources
```

safety executou quatro bloqueios de ambiente/duas omissões, último current e sua
omissão, confirmação nova negada/antiga ignorada/cache sintético detectado e
controle restaurado. confirmacao-externa selecionou só Job retido no mesmo driver
contratual, sem mudar assertions; omitir a consulta closed em cópia ficou vermelho,
restaurar SHA ficou verde. Nunca se alterou helper de implementação na working tree.

O primeiro driver de groups passou nos43 controles e parou na allowlist do broker
antes de criar atores: substituições sucessivas repetiram residual no destino
novo. executar-v1.mjs.txt e os logs/cópias iniciais foram preservados. A continuação
aplicou substituição em passagem única, sem repetir43 controles:

```powershell
node tasks/evidencias/revalidacao-RVPLA-05-residual/continuar-grupos.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05-residual/executar.mjs $taskRoot resources-final
```

Broker/before-child/handoff/inspection/edge passaram. Canal parou antes dos atores
num copyfile: procurava broker/Tree.exe, mas o broker válido estava em broker-valid.
Pasta/log parciais preservados. conclui-se apenas o que não havia iniciado,
usando o binário já produzido e outro destino de canal, sem mudar critérios:

```powershell
node tasks/evidencias/revalidacao-RVPLA-05-residual/concluir-grupos.mjs $taskRoot
```

Esse comando executa canal e complemento alheio aceito, depois resources-delivery.
Os dois levantamentos anteriores de recursos ficam intermediários; somente o
posterior aos últimos atores fundamenta a conclusão final. São consultas, sem
terminação. As falhas de direcionamento são falhas do observador anteriores ao
cenário, preservadas sem serem creditadas como negativos do candidato. Os scripts
de grupo interrompidos não são apresentados como verdes integralmente.

real exportou o candidato d8bd180a e selecionou somente
only=preflight-hides-missing-constraint contra PG17 descartável, imagem local
`sha256:8c10218386234f364e264e898fa77e40cd56a0236f4eeab245cf6bb97f568ef1`.
Uma assertion causal esperadamente falha, zero erros/skips; complete legítimo.
Resume/audit/identidade, uma tentativa e SHA de checkpoint estável, sem novos
testes no audit. Não é suíte financeira, startup amplo, pacote ou banco real.
EPERM causal anterior reutilizado por diff/hashes de canal/guardiões intocados,
sem obrigação de reintroduzir todos os defeitos históricos. analysis particiona
somente as três rodadas completas; o antigo censurado é tratado separadamente.

## Coleta e entrega

```powershell
node tasks/evidencias/revalidacao-RVPLA-05-residual/coletar.mjs $taskRoot
node tasks/evidencias/revalidacao-RVPLA-05-residual/auditar.mjs
node tasks/evidencias/revalidacao-RVPLA-05-residual/auditar.mjs --staged
```

Coleta exclusiva, sem sobrescrever, com hashes de originais/cópias e inventário
completo do runtime. Decodificação UTF8/sanitização declaradas; nomes longos
compactados sem mover originais. JSON de corrupção mantém bytes/hash e marcador,
sem certificado. Binários só inventariados; nenhum executável/classe/JAR/.env de
release versionado. Auditor lê evidências e confere sintaxe/JSON/hashes; não roda
testes. --staged confere os blobs coletados antes do commit de provas.

Após provas e redação dos pareceres/quatro notas, preservação final exclusiva:

```powershell
node tasks/evidencias/revalidacao-RVPLA-05-residual/preservar.mjs final
git diff --check -- tasks
Get-FileHash -LiteralPath README.md -Algorithm SHA256
git diff --cached --name-status
```

Provas e parecer em commits locais separados. Snapshot final antecede o commit
documental, evitando autorreferência; hashes finais na entrega. Staging explícito,
README raiz alheio excluído. Logs brutos não têm whitespace alterado para obter
diff limpo. Sem novo teste após redação, clean/reset destrutivo, limpeza geral de
target, implementação, push/merge/CI remota/hospedagem/deploy ou adoção real.
