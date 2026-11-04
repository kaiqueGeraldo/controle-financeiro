# Expanded local do recorte autorizado pela DEC-ZOOM-05

Resultado local: **APROVADA no recorte autorizado**. Revisão independente conjunta pendente. Nenhum aceite de PR, zoom nativo, CI remota ou produção foi inferido.

## A. Correções operacionais verificadas

[Operação e trade-offs](OPERACAO.md), [prova exata de invariantes](INVARIANTES.json) e [plano/identidades de rodada](PLANO.md). Caminho antigo Chromium274 caracteres: ENOENT; novo174: launch/page/screenshot/close, mesmo SHA-256. O caso Next foi tratado separadamente e validado com a jornada original CF023. Saídas dos9 configs e9 wrappers foram isoladas. O produtor adicional de mailbox sintético foi corrigido após o guard rejeitá-lo; arquivo próprio arquivado e movido individualmente. Guard/ignore não foram relaxados.

Maven usa opção explícita Java@argfile, distribuição3.9.12/JDK21 e encoding nativo1252 estrito. O controle negativo de caractere não representável falha sem criar arquivo. Raiz física curta, cache0/TEMP e destinos externos são por execução; não houve SUBST, política global ou ajuste persistente Docker.

A focused chegou às assertions funcionais e encontrou uma falha distinta de preparação. O caso E recarregava sem aguardar a resposta da reversão; o cancelamento não foi provado e a microprova inicial falhou. A microprova seguinte confirmou reload sem confirmação; o teste passou a aguardar o mesmo POST e verificar200 antes do reload. UI, progresso1→0, fixtures e timeouts foram mantidos. Nenhum código de produto foi alterado.

## B. Resultado dos gates e sobreposições

| Gate | Resultado |
|---|---|
|Contratos atuais|46/46, zero falhas/skips|
|Componentes Linux|626/626,71 arquivos: aceite anterior reaproveitado por inputs; nenhuma repetição|
|Componentes Windows|626/626,71 arquivos: JSON/audit/identidades revalidados; reaproveitados|
|Frontend atual|lint/tipos,18 temporais em3 fusos e build novos aprovados|
|Launch/Next/artefatos/preflight|controles reais aprovados; guard e cleanup preservados|
|Mínimo RF15|1 cenário representativo original, funcional; encoding corrigido e controle aprovado|
|Primeira focused15|14 aprovados,1 falha de UI;0 erros/skips. RF15C23 passou dentro do wrapper|
|Controles após ajuste semanal/mailbox|wrapper completo6/6 e mesma identidade E no RF15 1/1, zero retries/skips|
|Backend completo atual|116/116 classes; 928 testes, 0 falhas, 0 erros, 0 skips|
|RF15 atual|23/23 por identidade;25=2 adiados+23 obrigatórios|
|E2E financeiro|{"tests":1,"failures":0,"errors":0,"skipped":0} no wrapper Java; browser {"tests":13,"failures":0,"errors":0,"skipped":0}|
|Pacote|produzido e vinculado aos gates/inputs atuais|
|Cleanup|baseline Docker8 contêineres históricos/3 redes/0 volumes;0 workers próprios; sem exclusão global|

[Matriz das15](MATRIZ-15.md) e [resultados por identidade e SHA-256](RESULTADOS.json). Os14 ENOENT e o caso Next são falhas primárias de preparação; as assertions Java de saída/readiness eram derivadas e a UI não chegava a executar. Artefatos nas fontes são bloqueio adicional, sem relação causal demonstrada com ENOENT. Cada método original aparece novamente na full atual.

116 classes=115 comuns+AdoptionNativeSocketsTest Windows uma vez. As15 classes são um subconjunto; RF15C23 está dentro de Rf15RemediationBrowserTest. Não somar15+23,928+23 ou jornadas sobrepostas entre wrappers. E2E financeiro é o gate posterior próprio. A execução é composta: frontend aceito por reuso explícito e revalidações afetadas; backend/E2E/pacote usam o mesmo controller/runId `26daab35-a0aa-49f4-9830-7fc3ac6fb665`.

As preparações a/b/c, a preparação d com falha de encoding, a focused reprovada, as microprovas e o bloqueio inicial de cleanup permanecem preservados. Full116 efetiva começou uma vez, após os controles6+1 corrigidos; não houve retry automático para obter verde. O cleanup inicial de1,8s capturou remoção assíncrona; a checagem corrigida aguarda até30s e exige igualdade exata, sem remover ou tolerar sobras.

A exceção permanece limitada ao projeto review-sao-paulo, em `cf015.native-zoom.integrated.spec.ts` (“R10: zoom nativo 200% com ações, rolagem e foco”) e `rf15-native-chrome.integrated.spec.ts` (“RF15: zoom nativo Chrome 200% com ações, rolagem e foco”). Manifesto canônico por identidade mantém25=2+23. CF010/CF015 seguem pendentes nesse critério. A causa antiga dos componentes Linux permanece inconclusiva; os tempos2652,056ms e1440,208ms não foram apresentados como prova causal.

## Inputs, pacote e preservação

Candidato realmente executado: `95118407cfe684430421d7f5c4b613a99d2b55d0`,863 arquivos; digest SHA-256 `7d1277b5daa3e86e54e6a46a88b79f18159bc77c91af10d9b3f01e634c65aa4a`. Topologia: Node24.18.0, JVM Windows/JDK21, Maven3.9.12, Playwright1.63.0/Chromium153.0.8010.12, Docker Desktop Linux via loopback127.0.0.1, Ryuk ativo e reuse=false. [Proveniência](PROVENIENCIA.json) registra scripts, versões, manifests e rodadas; [coleta](COLETA.json) registra allowlists sanitizadas sem upload. Brutos, perfis, caches e dados de recuperação ficam privados.

Cópia executável `C:\cf-exp\1104d\s`; saídas próprias sob `C:\cf-exp\1104d`; recibos permanentes em `C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\saneamento-caminhos-20261104-01`. As raízes a/b/c e os acervos anteriores foram conservados. Arquivos privados em disco não são processos ou contêineres ativos.

[Preservação](PRESERVACAO.json):2340 referências conferidas por manifest existente; 2321 iguais no local e 19 com delta autorizado e bytes originais arquivados por hash.24 artefatos antigos intactos. READMEs preservados; checkout principal mantém branch/HEAD e apenas a alteração preexistente no README. O guard final confirma863 inputs sem acréscimos gerados. Nenhum inventário histórico recursivo crescente, git clean/reset, limpeza Docker global ou recriação de.r3.

Pacote local: `C:\cf-exp\1104d/all/api-0.0.1.jar`, 86235083 bytes; SHA-256 `564f87cd83f2b7ddd793b0cded03ac64080647b5522355dc88b27ce218497be9`. Manifest: `C:\cf-exp\1104d/all/package-manifest.json`. Verify gerou o JAR intermediário após testes backend; a coleta aprovada só ocorreu depois do E2E e do guard. O hash confere com o marker backend e os inputs acima; nenhuma reprodutibilidade binária ou publicação foi alegada.

## Revalidação complementar do observador de componentes

[Recibo complementar](REUSO-COMPLEMENTAR.json): o preload server-clock.cjs usado por um teste de componentes foi incluído na fronteira de reuso em d0c22c1b.46 contratos passaram, incluindo rejeição de drift nesse input. A comparação reforçada aprovou626/71; o mesmo preload está intacto nas bases Linux/Windows e no candidato executado. Não houve nova execução de componentes ou backend, cópia de fontes para o candidato, relabeling de markers ou alteração do JAR. O commit95118407 continua sendo o único candidato aqui apresentado como execução completa; a correção posterior do validador é verificada separadamente.

## C. Revisão independente e D. Validação remota

O conjunto está preparado para revisão independente; isso não é aprovação independente. Revisar o diff do lote a partir de `3d8a9a129ebd440db792b180825ea84658a5664c` até o HEAD final de entrega, com hashes completos no recibo privado `git-final.json` e na entrega ao usuário. O commit testado acima distingue código executado de commits posteriores de evidências e da revalidação complementar do observador. Para a revisão conjunta das rodadas anteriores, o recibo também identifica o início `03028231a7c1cbb9a2532adadd2ea1b9e1ea643e`.

CF034 permanece em_revisao e CF036 proposta; checkboxes integrais não foram marcados. GitHub Actions/backend Linux remoto, merge, publicação, hospedagem, deploy e banco real não foram executados. CF017/P01/P02, adoção real e produção continuam com gates próprios.
