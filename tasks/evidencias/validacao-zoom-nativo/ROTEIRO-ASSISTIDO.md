# Roteiro assistido atualizado

Este é o procedimento preparado após as duas invocações registradas em [RESULTADO.md](RESULTADO.md). Não houve terceira invocação. A confirmação por terminal abaixo teve checagem de sintaxe/argumentos e ausência de escrita; ainda não foi demonstrada com operador e teste ativos. O painel gráfico anterior não emitiu confirmação e está arquivado nos runtimes, sem recomendação de uso.

A operação nativa humana já foi demonstrada pelas capturas RF15 de 100% e 200%. O próximo passo deve mudar o mecanismo de confirmação, sem depender do upload pelo chat durante os 60 segundos. Há também uma falha pré-zoom do cadastro CF015 a diagnosticar separadamente. Não repetir a rodada anterior apenas com outra ferramenta.

## Ambiente, candidato e preparo disponível

Worktree: C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source.
Branch: codex/saneamento-pr3-expanded.
Candidato de produto/testes executado: f09e69a6511a5772ea9052da7509a8930ae88d17.

Runtimes arquivados:
- C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/zoom-nativo-20261103-01
- C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/zoom-nativo-20261103-02

Essas cópias já foram consumidas. Não reutilizar seus caches, diretórios de invocação ou confirmação. Cada prepared.json identifica 849 fontes físicos por cópia, SHA-256 e o único mapeamento operacional: o caminho de recurso Java para o frontend físico curto f. Os specs e suas assertions são os originais.

Ambiente conferido: Windows 11 Pro 10.0.26200 x64, Node24.18.0, JDK21.0.12.1+1 nos drivers, Maven3.9.12 offline, Playwright1.63.0, Next16.1.6, PostgreSQL16.15/Testcontainers descartável. Chromium153.0.8010.12 e Chrome155.0.8059.84 já instalados. Sem instalação nova. O Java25 observado no comando avulso Maven --version não é o JDK dos drivers, que fixam JAVA_HOME21.

A preparação independente em runtime01/p realizou cadastro real, conta longa, cartão final4242, doze compras de1234.56, navegação /cartoes e reload. PostgreSQL confirmou 1 usuário, 2 contas (inclui a conta inicial do cadastro), 1 cartão e 12 compras. Seus serviços foram encerrados. Essa preparação não é teste nativo, não alimenta os specs e não aqueceu runtime01/s ou runtime02/s.

Credenciais dessa preparação ficam somente em preparation/credentials.private.json, fora do Git; não foram copiadas para o relatório. Pertencem ao banco já encerrado e não servem a outra invocação. Os specs cadastram/autenticam novos usuários sintéticos automaticamente; não há login humano necessário.

## Antes de uma nova execução

Primeiro delimitar a reprodução fria do cadastro CF015: o segundo ensaio permaneceu em /auth?modo=cadastro por15s e não criou ready.json. Preservar trace, contexto e logs; a causa não foi demonstrada. Não atribuir automaticamente a compilação, relógio, fixture ou produto; não introduzir aquecimento, retry ou timeout maior.

Com essa pendência encaminhada e operador disponível, o agente prepara um runtime novo. Comandos PowerShell na worktree acima:

~~~powershell
$runtime = 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\zoom-nativo-proxima-01'
node tasks/evidencias/validacao-zoom-nativo/preservar.mjs initial $runtime
node tasks/evidencias/validacao-zoom-nativo/ambiente.mjs prepare $runtime native-only
node tasks/evidencias/validacao-zoom-nativo/ambiente.mjs compile $runtime
node tasks/evidencias/validacao-zoom-nativo/ambiente.mjs list $runtime
node tasks/evidencias/validacao-zoom-nativo/ambiente.mjs run $runtime both atendida-03
~~~

Conferir cada exit antes do comando seguinte. O snapshot aceita apenas a base f09e69a e commits posteriores restritos a esta pasta de evidências; qualquer mudança de implementação requer nova base revisada. O modo run verifica hashes da cópia original e exige frontend frio. Não executa expanded.

Comando canônico invocado pelo driver: Maven offline, -Dtest=Rf15RemediationBrowserTest, -Dreview.grep=(R10: zoom nativo 200% com ações, rolagem e foco|RF15: zoom nativo Chrome 200% com ações, rolagem e foco)$, relatórios e BrowserEvidence no runtime. Playwright aplica grep ao título composto de projeto/arquivo/teste; a âncora final mantém os nomes completos. A listagem tem que retornar exatamente 2 testes em 2 arquivos.

O Java cria PostgreSQL/schema descartáveis com Flyway real e Spring em porta aleatória; o Playwright cria Nextdev próprio em127.0.0.1:3107, reuseExistingServer:false, sem retries. Clocks financeiros/de credenciais permanecem originais. RF15 fixa Date em15/01/2027; CF015 conserva seu comportamento original. Se a porta3107 estiver ocupada por outro recurso, não encerrá-lo como atalho.

## Alvo e confirmação local imediata

Para cada ready.json atual, o agente abre um terminal local destinado ao operador com o comando correspondente:

~~~powershell
node tasks/evidencias/validacao-zoom-nativo/confirmacao-local.mjs confirm '<runtime>' atendida-03 cf015
~~~

Para o segundo caso, usar rf15. A abertura/coordenação fica com o agente; o usuário não precisa investigar infraestrutura. Não canalizar uma resposta artificial para stdin: o helper exige terminal humano e recusa confirmação de invocação/caso já encerrados.

O operador confirma conjuntamente:
- Título CF015 ZOOM NATIVO - ajustar 200%, ou RF15 ZOOM NATIVO CHROME - ajustar 200%.
- Barra de endereço http://127.0.0.1:3107/cartoes.
- Heading Carteira, cartão Cartão sintético para zoom, final4242.
- ready.json e candidate.json da mesma invocação, com versão e candidato identificados pelo agente.

O título sozinho não basta. O processo/contexto é descartável, lançado pelo spec; não usar janela ou perfil pessoal.

Intervenção humana mínima em cada caso:
1. Sem maximizar ou redimensionar a janela1440×1000 solicitada pelo spec, abrir Mais(⋮) → Zoom. Capturar indicador100%, barra de endereço e título. Registrar SO, resolução/monitor e escala do sistema sem modificá-los. Se o indicador inicial não for100%, preservar a ocorrência e parar; a baseline já foi medida.
2. No mesmo menu, usar + até200% e capturar indicador, URL e conteúdo. Capturar o monitor inteiro é permitido; o tamanho da janela do navegador deve permanecer constante.
3. Fechar o menu, voltar ao terminal local e digitar exatamente 200% seguido de Enter, somente após observação e captura reais. Esse é o sinal humano de continuidade. Enviar as imagens pelo chat depois, para não consumir o prazo com upload.
4. Deixar a automação original concluir as ações. Não intercalar cliques humanos durante foco/teclado. Repetir a intervenção apenas na segunda janela quando seu ready estiver presente.

O helper não lê ou controla navegador, não captura tela, não define zoom e não verifica pixels. Grava declaração humana e o sinal exigido pelo spec; não produz aceite. O agente deve associar as capturas depois e deixar capturasReviewed=false até inspecioná-las. Não criar sinal por DPR, viewport ou mera aparência ampliada.

Se as imagens já estiverem disponíveis enquanto o caso continua ativo, confirmar.mjs permite associar PNG100%, PNG200% e metadados humanos e emitir o mesmo sinal. Não executá-lo depois do fim da invocação. Campo source é human; o percentual não é apresentado como observação nativa automatizada própria.

Prazos originais:180000ms para razãoDPR2, depois60000ms para confirmação,300000ms total por spec. Nenhum deles foi ampliado. Falta de confirmação, cadastro ou observação de um item preserva o resultado e interrompe aceite.

## Passos exatos dos dois cenários depois do sinal

Fonte de verdade: os dois specs na [matriz N01–N12](MATRIZ.md), com hashes no manifest. Não há cenário substituto.

1. Exigir razãoDPR2, outerWidth constante, innerWidth=round(before.width/2) e visualViewport.scale1. Associar zoom.json ao indicador nativo externo. Diferenciar zoom de página, pinch, escala do sistema, DPR e viewport.
2. Visitar /, /contas, /cartoes, /planejamento e /extrato. Em cada rota: headingh1 visível, zero spinner e razãoDPR2; produzir cinco capturas. Inspecionar texto/conteúdo acessível, ações e ausência de recorte impeditivo. DOM presente não comprova usabilidade.
3. Novo lançamento → Nova Transação. Foco inicial em Fechar modal; Shift+Tab alcança Salvar Transação; capturar botão inferior; Escape fecha e devolve foco a Novo lançamento.
4. Abrir Ver fatura de Cartão sintético para zoom, final 4242. Diálogo Cartão sintético para zoom •••• 4242; foco em Fechar detalhes da fatura; capturar topo; rolar até Compra 12 com descrição longa para zoom; capturar fim.
5. Acionar Pagar/Adiantar. Diálogo Pagar Fatura - Cartão sintético para zoom; foco no fechamento; Shift+Tab alcança Confirmar Pagamento, inteiro dentro da altura interna; capturar topo/fim. O caso não efetua pagamento.
6. Tab retorna ao fechamento; Escape fecha apenas pagamento e devolve foco à ação da fatura; outro Escape devolve foco ao abridor. Registrar as assertions e a sequência efetivamente executada.

A rolagem é permitida conforme o contrato. Não criar proibição geral de rolagem horizontal. Menu nativo sobreposto na captura do indicador não é defeito de overlay do produto. Uma captura isolada não comprova leitura de todas as telas, ações, teclado ou foco.

## Provas, limites e encerramento

Arquivos por caso: visual/native-zoom-cf015 ou visual/native-zoom-rf15-chrome sob browsers/Rf15RemediationBrowserTest da invocação. Esperar ready, confirmação legítima, zoom, cinco telas, transação, fatura topo/fim, pagamento topo/fim e observations. Logs/JSON Playwright e persisted.txt ficam no diretório do harness; XML atual em surefire. Capturas, credenciais, traces e brutos permanecem privados conforme tasks/EVIDENCIAS.md; versionar apenas síntese sanitizada, referências/hashes e scripts autorizados desta pasta.

O campo method de zoom.json é uma string histórica estática mencionando sky; ele não demonstra autoria do input. Quando humano, a proveniência correta é a declaração e as capturas humanas associadas. Nunca apresentar esse campo sozinho como prova de automação nativa.

Preservar a primeira ocorrência com cenário/N01–N12, passo, URL, entidade, horário, dimensões e captura. Separar produto, fixture, observador e ferramenta; causa incerta permanece incerta. Não corrigir produto nesta etapa nem repetir para apagar um vermelho.

Os finally originais fecham navegadores temporários. Encerrar somente serviços/processos/contêineres próprios; preservar preferências pessoais, runtimes e target históricos. Se permanecer usando perfil descartável, restaurar100% e capturar antes de fechá-lo; encerrar o perfil é alternativa prevista.

Dois passes futuros exigem inspeção das capturas, interações e origem humana antes de avaliar prontidão. Não autoaprovar AC-UI-001/CF010/CF015: a matriz tem outros recortes, incluindo360×800 e onboarding. Somente preparar encaminhamento à expanded integral local; não executá-la automaticamente. PR#3 continua sem merge até os gates aplicáveis. Sem push, atualização de PR, CI remota, hospedagem, deploy ou banco real.
