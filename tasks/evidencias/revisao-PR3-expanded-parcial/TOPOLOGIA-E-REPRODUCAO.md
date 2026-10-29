# Proveniência, execução e preservação

## Checkouts

- Principal: `C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro`, branch `codex/saneamento-cpa01-selecao-testes`, HEAD `c16e6545488c8f13efda4dab9efa8aa896fcddaa`. Modificação alheia de README e `.r3/` não rastreado são preexistentes.
- Revisado: `C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro\.r3\pr3-expanded-source`, branch `codex/saneamento-pr3-expanded`, candidato `26dce7dbc98b140d22095b6948c539e01fc1128c`; inicialmente limpo. Comandos Git e scripts da revisão usam explicitamente esse diretório.
- Publicação limpa preservada: `C:\Users\Aluga.com\.codex\worktrees\publicacao-limpa\controle-financeiro`, HEAD `1c4173f2e9a8bd459a9f2ecd4acf2d803245be88`.

`git worktree list`, HEAD, status, diff e ancestralidade foram conferidos. Base1c4173f2 é ancestral do candidato e coincide com o head remoto. Produto/backend/frontend/workflows/dependências de c16e654 e1c4173f2 coincidem; a diferença de publicação é documental/acervo. Os cinco commits revisados são ad80c9d4 (schemas),64dfdc74 (diagnósticos),4eab449d (credenciais/readiness),374754b3 (transporte),26dce7db (provas/documentação/allowlist).

Não há AGENTS.md físico adicional encontrado na worktree ou em seus ancestrais. Aplicadas as instruções AGENTS fornecidas pelo usuário, tasks/README, EXECUCAO e POLITICA-DE-TESTES e a skill Tech Lead & Arquiteto. Metadados históricos de modelo não alteram a execução desta revisão nem exigem outro agente.

## Versões e pacote

Local: Windows, JDK21.0.12.1, Maven3.9.12 offline, Node24.18.0, Spring Boot4.0.2, Playwright1.63.0/Chromium1243, PostgreSQL16-alpine descartável por Testcontainers. JVMUTC/cache Spring4; Playwright workers1/retries0; nenhum skip configurado para obter aprovação. Relatórios XML registram o ambiente e os argumentos reais de cada invocação.

Remoto original: Linuxamd64, Temurin21.0.13, Maven3.9.12, Node24.22.1, PostgreSQL16/Testcontainers2.0.3. As diferenças de sistema/patch e a topologia Linux local não certificada impedem equiparar execuções locais a Actions.

Esta revisão testa classes compiladas dos fontes identificados por hash. **Nenhum JAR foi gerado ou usado como substituto dessas execuções.** O JAR histórico de `INTEGRACAO-PR3.md`,86.234.927bytes/SHA2566fade573d10b02feaddcc4b4b82d379e328f400ee47eac00ad8d04ebc19ba6fe, pertence à smoke40871546471/1; não é um pacote novo validado com o saneamento. O artifact de pacote do dispatch40873511911 é outro registro remoto; não se transfere o digest de um para outro. O pacote expanded posterior não foi alcançado no job reprovado.

## Runtimes privados da revisão

Base externa: `C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\`.

1. `revisao-pr3-parcial-20261029-01`: cópia física inicial/855 entradas por hash;32 contratos dos gates aprovados. `candidate-directed` conserva falhas de preparação de navegador por caminhos longos. `candidate-short-path` conserva a tentativa com aliasR: e erro do Turbopack por caminho canônico fora da raiz do alias; execução interrompida somente na JVM própria identificada62764 e seus descendentes. Nenhum relatório ausente é considerado sucesso.
2. `revisao-pr3-parcial-2/s`: segunda cópia física com caminho menor. Dependências instaladas foram reutilizadas por hardlinks de arquivos imutáveis; não houve npm install/ci nem modificação dessas dependências. `candidate-directed` conserva erro Windows de spawn do executável de273 caracteres e uma seleção vazia causada pelo filtro ancorado da própria revisão; também conserva a falha inicial de configuração do novo probe decimal. Nenhuma dessas falhas é prova contra o candidato.
3. `worktree-original` executa os arquivos originais na worktree correta, com saídas apenas no runtime externo. O filtro dirigido é `UI04 visual dirigido`, mantendo o teste completo e seus prazos.
4. Os probes de contraprova/visual usam `revisao-pr3-parcial-2/s/f` como frontend físico curto. Os fontes frontend são cópias byte a byte do candidato; classes adicionais `ReviewerAuthBrowserProbe` e `ReviewerOpeningBrowserProbe` reproduzem os wrappers com apenas nome da classe e caminho físico alterados. `preparar-complemento.mjs` torna essas diferenças reproduzíveis. Isso é infraestrutura de observação privada, não alteração entregue ao harness. As assertions originais são conservadas. O probe decimal é novo, exclusivo da revisão; sua primeira configuração herdava dois initializers incompatíveis. A versão corrigida do próprio probe usa inheritInitializers=false, sem mudar o candidato.

Cada invocação cria diretório novo e registra inputs, argumentos, log, SHA de log e XML. Contraprovas alteram somente arquivos dessa cópia, em série, restaurando bytes por SHA em finally. Os hashes de fontes extras e do frontend curto são capturados nas novas invocações. As falhas de preparação anteriores permanecem acessíveis. Não houve limpeza de target, .next, Git, worktree ou runtime histórico.

## Reprodução

Executar a partir da worktree revisada. `executar.mjs prepare <runtime-novo>` exige uma pasta nova com nome `revisao-pr3-parcial-*` sob a base externa acima; copia fontes rastreados e confere os97 arquivos protegidos. Configurações sensíveis herdadas são removidas; o banco só pode ser criado pela infraestrutura descartável/guardloopback existente. O JDK é lido do acervo local, não reinstalado.

`executar.mjs maven <runtime> <label-novo> <classe[#método]...>` seleciona somente as reproduções necessárias, com failIfNoTests e retries0. `REVIEW_GREP` delimita o trecho Playwright sem alterar seleção obrigatória; `REVIEW_ORDER` permite ordem explícita. `REVIEW_SUBJECT_PATH` identifica o checkout efetivamente usado e é registrado junto dos hashes reais. Não usar alias ou executável profundo no Windows como condição de produto.

`auditar.mjs <runtime>` relê os18 recibos/24 XML/22 traces anteriores, confere hashes e inspeciona o ZIP remoto sem extraí-lo. Corpos financeiros são lidos apenas na allowlist; nenhum token ou segredo vai ao resumo versionado. O resultado completo fica privado.

Depois da invocação inicial encerrada, `preparar-complemento.mjs <runtime>` cria os probes adicionais; `contraprovar.mjs <runtime> fixture|auth|opening` executa mutante/controle em cópia e emite recibo. Para auth e opening, executar antes o controle positivo dos clones. O script de contraprova não toca os fontes da worktree.

As invocações exatas realizadas, resultados e hashes ficam em `RESULTADOS.json`; contagens são por invocação e não devem ser somadas entre repetições. `visual-complement` preserva quatro falhas causais do observer de geometria e duas falhas de preparação do próprio probe de presença (JSON em resposta sem corpo). Somente o adaptador desse probe novo foi ajustado; `presence-complement` selecionou apenas os dois casos antes não alcançados, com mesmos prazos/retries0. Resultado: Playwright clock reprovou, Date-only completou a jornada financeira. Nenhum cenário candidato foi corrigido nem repetido para buscar verde.

Uma tentativa de iniciar o complemento não foi executada porque a revisão automática de aprovação estava indisponível por limite de uso. Após o usuário informar o restabelecimento, a mesma ação passou pelo fluxo normal de aprovação; nenhum contorno foi usado. A execução efetiva do complemento começou às22:43UTC de29/10; as anteriores e a pausa mantêm seus timestamps originais.

Traces/cookies/SQL/capturas permanecem nos runtimes, fora do Git. A inspeção de uma préviaPNG pareceu vazia, mas os arquivos original/clone/restaurado são idênticos. `verificar-pixels.mjs` confirmou o mesmo bufferRGBA antes/depois de re-encodingPNG sem alteração de pixels; a prévia normalizada mostra o conteúdo. A suspeita foi retirada, preservando o arquivo e o recibo. Windows nativo de sockets e os seis testes históricos do consumidor de migração são reaproveitados somente porque seus fontes/consumidores/configuração não mudaram; não há afirmação de reexecução desses gates nesta revisão.

## Preservação e integração futura

README principal: SHA256 `6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`. README da worktree: `e7d3458fbd8ac227520be27996ce23c73e8c3be2086d8cfbd51ad59568f4cee0`, sem diff preexistente nessa worktree. Não são intercambiáveis.

Manifest protegido: `tasks/evidencias/validacao-remota-consolidacao/preservacao-inicial.json` no principal, SHA256 `562c35febf59d72da751cd655cf99ef264c63a61fcb4a9de1a062a7b79ee981f`,97 entradas. Conferência inicial e final usa esse mesmo manifest; sem inventário geral novo do acervo. Migrations, pacotes e arquivos históricos são preservados; scripts novos e resultados derivados ficam somente nesta pasta de revisão.

Os commits de revisão são locais, com staging explícito desta pasta, sem README alheio, runtimes ou secrets. A worktree `.r3` permanece onde está. Depois de autorização futura e resolução dos bloqueios, integrar os commits delimitados a partir da base confirmada, conferindo ancestralidade e diff, preservando os três checkouts e o README alheio. O intervalo inteiro não fica liberado automaticamente: CF023/readiness permanece parcial. A branch de publicação em1c4173f2 é ancestral desta linha; fast-forward só cabe quando o candidato completo posterior estiver revisado e validado. Se houver divergência, cherry-pick/merge delimitado exige nova conferência, sem reescrever o principal ou incluir seu README. Não mover nem apagar `.r3` antes da integração e da conferência dos hashes. Não houve integração nesta etapa.

Conferência final: nenhum processo Java/Node/Chromium próprio ativo e nenhum container próprio ativo entre os15 IDs recuperados dos logs. O alias temporárioR: foi liberado somente após conferir o destino exato e o fechamento dos processos; os diretórios permanecem intactos. O reciboresource-closure.json e seu SHA estão referenciados emRESULTADOS.json. Os manifests97 e36 foram verificados separadamente, sem soma de caminhos potencialmente sobrepostos.
