# CF015 — Zoom nativo e gate CF034

Decisão posterior: [DEC-CI-04](../../../docs/sdd/decisoes/004-liberacao-local-CF-034.md)
aprova expressamente PROP-CF034-01/A para execução local CF034. Este relatório
conserva o alcance histórico da análise; zoom/aceite integral/uso não aprovados.

24/10/2026, America/Sao_Paulo. **CF033 publicada/integrada; zoom nativo 200%
continua sem verificação por bloqueio da ferramenta; PROP-CF034-01 pendente.**
CF010/015 permanecem `em_revisao`; CF034 `proposta`, não iniciada. Nenhuma alteração
de produto, gate canônico, workflow ou configuração de execução.

## Base e publicação concluídas

Sete commits aprovados de `bfb6c61..e1a01b6`, 483 arquivos, publicados na branch
`codex/cf033-revisao-integrada` e integrados por fast-forward na main. Remoto
`https://github.com/kaiqueGeraldo/controle-financeiro.git`; main e branch CF033
conferidas diretamente em **`e1a01b62e0766c92120c3cefc2bc4b4fc316ce58`**.
Não houve divergência, conflito, PR, force push ou exclusão de branches.
Nova branch **`codex/cf015-zoom-gate-cf034`** criada dessa base, sem upstream;
commits desta análise exclusivamente locais.

CF033 continua concluída como revisão executada, CF033-01/P2 encerrado pelo
[aceite independente](../revalidacao-CF033-01/README.md). O push autorizado
publica esse lote; não amplia o aceite local para uso/produção. O `verify`
histórico com `-DskipTests` permanece comprovação de empacotamento, sem nova
execução de testes/CI. Gatilhos automáticos foram aceitos pelo usuário, mas não
foi consultado ou presumido êxito de CI/Vercel/Railway.

[Estado/backup](estado-inicial.json), [intervalo completo](intervalo-publicado.json),
[integração remota](integracao.json), [registro de execução](EXECUCOES.md).

## Parecer do zoom e do gate

A sessão atual permite listar Chrome e aceitou um vínculo inicial de janela.
A tentativa seguinte de observar a janela foi interrompida pela ferramenta por
incapacidade de confirmar sua URL com segurança. Não houve captura utilizável,
input, configuração de zoom ou interação com produto. Não foi demonstrada
capacidade suficiente para validar 200%; não se afirma impossibilidade universal
do navegador. Nenhum runtime/serviço/usuário/PG novo foi criado.

[Capacidades, mensagem exata, comparação histórica e gatilho de retomada](CAPACIDADES.md).
Nenhuma imagem de 200% existe nesta rodada. Zoom não foi aprovado nem convertido
em defeito; nenhuma configuração anterior de zoom foi alterada.

O critério exato é AC-UI-001/CF010-1: leitura, conteúdo completo, ações essenciais,
erros, scroll e foco a 200% nativo, abrangendo consumidores e onboarding atual.
Viewport/CSS/DPR/imagem não o substituem. Os demais aceites CF010 e do marco
CF015 permanecem nos respectivos alcances, sem reabertura automática. Provar
zoom futuramente ainda exigirá parecer independente do conjunto antes de concluir
CF010/015; tarefa não termina por associação.

[Matriz critério→dependência→evidência→execução→aceite](MATRIZ-GATE.md),
[matriz futura de telas e interações](MATRIZ-ZOOM.md).
CF026/032/033 têm aceites locais integrados; futuras mudanças nos consumidores
requerem reconferência dirigida. DEC-ONB-03 continua específica de CF031.

## Continuidade concreta, ainda sem autorização

[PROP-CF034-01](PROPOSTA.md) recomenda autorizar **em outra tarefa** apenas
infraestrutura e provas locais de CI: lint/tipos/testes/build, PostgreSQL/E2E
descartáveis, negativo causal, cleanup, triggers, cache e vínculo SHA/pacote.
Essa capacidade é tecnicamente independente do zoom; a dependência formal não
foi removida. Aprovação integral CF034, resultados remotos não executados,
artefato publicado e uso do produto conservam as condições documentadas.

Decisão necessária do usuário: aceitar ou recusar esse recorte local específico.
Se aceitar, registrar decisão aprovada antes de anotar prontidão restrita e
iniciar trabalho; se não, manter a situação canônica até prova/parecer CF015.
Nenhuma CF034/sucessora foi implementada ou executada nesta tarefa.

## Preservação e limites finais

README raiz mantido fora dos commits, SHA256 inicial e após integração:
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Backup recuperável conferido; nenhuma restauração automática.
Os 430 arquivos de runtime do manifesto histórico permanecem byte a byte
iguais; nenhum runtime foi limpo, movido ou criado. Dos 627 caminhos históricos,
67 arquivos do repositório diferem em hash bruto, mas todos correspondem aos
mesmos blobs aprovados sob os filtros Git nas duas bases examinadas; não se
afirma igualdade bruta desses 67. [Distinção e hashes](historico-eol.json).
Snapshot pós-integração de 9.663 arquivos em [preservação inicial](preservacao-inicial.json);
resultado final em `preservacao-final.json` após as notas deliberadas.

Provas no commit local `0f787eb3272c6a8fa17aefa39d8aaaa1dd2d4bc9`;
parecer/matrizes/proposta, referências canônicas e correção do caminho recuperável
do backup em commit documental local separado. O HEAD final é informado na entrega.

Validação desta mudança documental: JSON, links locais, diff/staging explícitos,
hashes/escopo e refs; sem repetir suítes de produto sem mudança que o justifique.
Adoção real CF017/P01/P02, limitações de produção e alcance DEC-ONB-03 preservados.
Sem banco real, migração operacional, notificações ou deploy manual.

Próximo passo delimitado: decidir PROP-CF034-01. Para zoom, somente retomar após
mudança que faça o preflight de URL/captura/indicador nativo/input funcionar;
depois executar a matriz e submeter provas ao parecer independente CF015.
