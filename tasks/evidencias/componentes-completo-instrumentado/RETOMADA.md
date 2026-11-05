# Retomada operacional do Windows após limite de caminho

A rodada Linux626/71 aprovada não se repete. A rodada Windows atual também
aprovou626/71, com auditoria estrita. O primeiro build Windows falhou antes de
produzir build por caminho físico de272 caracteres. O máximo medido no build
Linux aprovado chega a131 caracteres relativos ao candidato; só encurtar o
subdiretório na raiz longa ainda ultrapassaria260.

Criar o runtime irmão autorizado componentes-completo-w, candidato c. Exportar
os860 arquivos atuais da worktree, verificando todos por SHA contra o manifest
do candidato desta rodada. Preservar integralmente a primeira tentativa Windows,
seus relatórios, fontes e build parcial. Não usar SUBST/junction para enganar
physicalPath nem mudar configuração global do Windows/Next.

Reutilizar somente os626 componentes Windows desta mesma rodada, com prova
explícita: exit0 do comando, JSON/audit/contexto/71 arquivos/626 identidades
validados novamente pelo mecanismo canônico, d7 em ambas as cópias, mesma
plataforma e Node. Não copiar seu relatório para aparentar execução nova.

Adapter externo ao candidato deriva do ci.mjs canônico atual. O único gate que
ele deixa de invocar é o componente já aprovado: em seu lugar roda a validação
acima e registra reuso-componentes-proof. Instalação, lint, tipos e unidade rodam
na cópia curta; build/browser e todo o restante mantêm os comandos canônicos.
Marker frontend só nasce depois de todos esses gates, com referência à prova.
Backend116, RF15C23, E2E e pacote continuam no mesmo controller/runId e conservam
suas validações. Nenhum arquivo de .github/produto/teste na worktree é alterado.

Isto é retomada composta com reaproveitamento identificado, não nova execução
integral Windows. O resultado reprovado anterior continua reprovado e preservado.
Preflight Windows aprovado nesta rodada é reutilizado: mesma JVM, daemon e
loopback, sem mudança de topologia. O problema de arquivamento de symlink Linux
é independente: copiar scripts por allowlist e finalizar seu executor próprio
após a continuidade. Se outro gate real falhar, preservar a ocorrência antes de
qualquer decisão. Pacote só após as validações completas do controller.


## Lançamento Maven — complemento do commit baff0e49

O build e browser-install no caminho curto passaram. O wrapper Windows rejeitou
a seleção116 com "Linha de comando muito longa.", antes de iniciar Maven/testes.
A primeira falha e o resultado do controller permanecem em componentes-completo-w/o.

A retomada seguinte usa Java @argfile com a estrutura de lançamento lida do
Maven3.9.12 instalado: mesmo JDK21, Classworlds2.9.0, m2.conf, Maven home,
base do projeto, native-access e offline/batch. A lista -Dtest inteira permanece
igual por conjunto e ordem (116; AdoptionNativeSocketsTest uma vez; SHA do array
bd7adb45b0380308f6e24344de79f0ec44aceded4cd24885d5131c1eb1f4c0c0).
Não foram abreviados seletores nem trocado o mecanismo de relatório Surefire.

O adapter externo mantém backend/RF15/E2E/pacote canônicos no mesmo runId.
Revalida e reaproveita o frontend já completo e os626 componentes atuais,
sem repetir testes aprovados. Seu marker inclui os comprovantes do frontend
atual. Arquivos de argumentos, opções efetivas, hashes e ferramentas ficam no
runtime curto. Uma falha real durante testes deste backend não autoriza repeti-lo.
