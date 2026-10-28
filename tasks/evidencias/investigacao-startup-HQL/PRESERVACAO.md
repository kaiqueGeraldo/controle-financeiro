# Preservação proporcional

README raiz, inicial/final:
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
Alteração alheia mantida fora do staging/commits. Nenhuma restauração automática.

JAR p05 anterior intacto:
`b296705828c8461c7c3cb15acb919e90280ed92a6944e6f22d7dd34b6d31395b`.
Produtor dos inputs `24844b594e4ed8fe906e0fc6eaee32bdd58f31a0`, não o HEAD
documental. Manifesto p05 conferido por hash como referência, sem alegar rebuild
binário independente. Imagem local anterior8c102183…568ef1 preservada; SHA do JAR
embarcado/versão Java reconfirmados sem rede. ID local não é digest publicado.

Conferência final em [preservacao-final.json](preservacao-final.json):452 inputs
backend atuais,281 entradas src/main, incluindo16 migrations, e14 referências
históricas selecionadas mantêm os SHA iniciais. Mais35 arquivos de ocorrências
antigas (XMLs/logs/dumps) e3 relatórios complementares reconferidos contra a
extração; catálogo de queries preservado. Referências a inventários anteriores
têm caminho/hash próprio; não foi copiada nem certificada integralmente toda
árvore histórica. Fontes de produto/frontend/harness/.github sem diff da base.

Único runtime novo: startup-hql-20261028-01. Inventário separado de1.020 arquivos,
1.333.726.782B, em [runtime-files.json](runtime-files.json). A maior parte desse
tamanho é a expansão textual1,21GB do JFR nativo; não foi copiada para Git.
21 artefatos selecionados coletados, com transformação e hashes separados.
JFR bruto pode conter ambiente do processo e permanece privado no runtime;
somente estatísticas/seleções sanitizadas foram publicadas no commit local.
Não houve cópia recursiva de evidências antigas, limpeza geral de target,
git clean/reset destrutivo, remoção de runtimes ou imagens anteriores.

Auditoria final somente leitura em execucao/ambiente-final.json: zero processos
associados e containers ativos; portas53120/60421/53124/64885. Duas tuplas
residuais estado11/TimeWait, owner0, nenhum LISTEN ou processo próprio ativo.
Não se alegou ausência de toda tupla kernel. Java PID20288, nascimento
2026-10-25T22:04:29.672Z, presente antes/depois e preservado. Nenhuma terminação
por nome/porta ou de processo alheio foi emitida pela auditoria.

Fotografia final foi feita no HEAD dos probes aa4749f3, antes do commit de
documentação que contém o próprio recibo. O hash final desse commit/intervalo
é entregue depois; não se inventa autorreferência. Somente novos documentos e
coleta ainda seriam adicionados, sem mudança de inputs/pacote entre as fotos.

RVPLA-01/03/04/05, audit/EPERM e TCP aceito preservados por ausência de diff
canônico e hashes. Sem nova alegação de aceite sobre matrizes/cancelamento/
zoom/configuração ou adoção real. Nenhum banco real ou ação remota executada.
