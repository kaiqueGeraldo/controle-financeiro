# Correções operacionais e limites da prova

A execução usa uma cópia física curta em `C:\cf-exp\1104d`, identificada por
recibos no acervo permanente `saneamento-caminhos-20261104-01`. Nenhum SUBST,
registro, política global ou configuração persistente do Docker foi alterado.

| Camada | Construção anterior e falha | Destino usado no lote |
|---|---|---|
| Executável Chromium | Playwright cache0 sob prefixo físico longo; executável existente de274 caracteres falha com ENOENT | Mesmo cache0 e binário SHA-256,174 caracteres sob a cópia curta; launch/page/screenshot/close reais |
| Perfis e temporários | Defaults podiam herdar prefixos do usuário | TEMP/TMP=`C:\cf-exp\1104d\t`, herdados pelos filhos; perfis próprios gerados pelo Playwright |
| Cópia executável/cwd | Prefixo longo propagado a Java, Node e Next preparado | `s\controle-financeiro-backend` e `s\controle-financeiro-frontend`, caminhos físicos únicos |
| Next | Cópia preparada CF023 falhou antes de readiness no prefixo antigo | Build `.next` na cópia executável e runtime preparado privado sob evidence; CF023 foi executado com UI e pós-condições SQL originais |
| Relatórios e mídias | Nove configs continham `../artifacts/...`, dentro de tests do candidato | `artifactDirectory` recebe destino externo por execução; reject por resolução física, inclusive aliases/junctions |
| Wrappers Java | Nove wrappers criavam evidence histórica, sem consumir o destino do runner | Uso do helper existente `BrowserEvidence.directory`; identidade da classe e criação exclusiva mantidas |
| Mailbox sintético | FrontendClosure gravava em `tests/artifacts/closure-mailbox` | `evidence/mailbox`, compartilhado com o processo filho; nenhum dado de recuperação versionado |
| Maven/argv | Seleção extensa não cabe em CMD e UTF8 em @file corrompeu o grep acentuado | Opção explícita Java@argfile, Maven3.9.12/JDK21, encoding nativo1252 estrito; argv integral, rejeição multiline/NUL e de caracteres não representáveis |

O contraste do executável manteve o mesmo SHA-256
`addfa79abb060e1e514e155ed745d4bf96140bca402735958bb4e223aea0b98c`.
O caminho antigo falhou no lançamento isolado; o novo abriu e fechou o browser.
Isso comprova o impedimento de caminho desse mecanismo no ambiente recebido;
não determina um limite universal do Windows ou de versões futuras do browser.
Os14 erros anteriores de Chromium e o caso separado de Next foram classificados
por seus próprios relatórios. Artefatos nas fontes são uma falha adicional de
isolamento; não há prova de que tenham causado ENOENT/readiness.

O guard permaneceu ativo e detectou o arquivo de mailbox gerado somente quando
a recuperação chegou a executar. Esse arquivo próprio foi arquivado por hash e
movido individualmente, antes da nova geração de inputs. Os24 arquivos antigos
continuam preservados no acervo anterior. `target`, `.next` e `node_modules`
são saídas previstas na cópia descartável; não são inputs de produto nem foram
acrescentados às exceções do guard neste lote. O checkout de revisão não recebe
a execução ou suas saídas.

## Sincronização observada no caso semanal

A primeira focused15 corrigiu a preparação e alcançou as assertions funcionais.
O caso E falhou após clicar em desfazer e recarregar imediatamente: o segundo
POST estava registrado sem confirmação e a leitura posterior manteve progresso1.
A captura não prova cancelamento, nem um defeito financeiro. A primeira
microprova que tentava observar ERR_ABORTED não confirmou essa hipótese.

A microprova seguinte, com endpoint local próprio, demonstrou que reload pode
terminar com a resposta do POST retida; o controle positivo aguardou HTTP200.
O ajuste no teste real arma a resposta do mesmo POST, aguarda200 e mantém o
reload, a assertion de UI e o progresso0. Acrescenta uma garantia, sem mudar
fixture, timeout ou produto. O padrão de aguardar a reversão já está em CF022.
As6 jornadas originais do wrapper e a identidade E dentro de RF15 passaram
nessa geração, sem retry, antes de iniciar full116.

## Custos e portabilidade

A raiz curta é um contrato do executor local: novos prefixos/toolchains exigem
revalidar caminhos e launch. Cache0 mantém o isolamento da instalação e evita
introduzir overrides em cada lançador; exige espaço por cópia executável.
Defaults históricos standalone permanecem compatíveis, enquanto o runner deve
sempre fornecer o destino externo. A resolução física de saída percorre seus
ancestrais (O(profundidade)); não altera consultas ou algoritmos financeiros.

O adaptador Maven usa componentes internos da distribuição3.9.12 instalada,
PowerShell/.NET e codepage nativa. É explícito, local e restrito: rejeita opções
JVM/RC não examinadas e caracteres não representáveis. Isso evita mudança
silenciosa de semântica, ao custo de revalidação para outro ambiente. O caminho
Linux/cmd legado não passa a usar esse adaptador por mera variável ambiente.

Reuso de componentes compara hashes de todos os inputs frontend, exceto E2E,
e revalida JSON/audit, plataforma e626 identidades/71 arquivos (O(arquivos+casos)).
A seleção não afeta fixtures, pool, watchdog ou assertions. Nenhum código de
produto, query, regra financeira, isolamento ou atomicidade foi modificado.
A prova local JVM Windows/Docker Desktop/loopback não certifica backend Linux
no GitHub Actions. Zoom200% nativo continua adiado exclusivamente nas duas
identidades DEC-ZOOM-05; CF010/015, CF017/P01/P02 e produção mantêm seus gates.
