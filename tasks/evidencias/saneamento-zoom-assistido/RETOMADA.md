# Retomada operacional

Não há janela nativa aguardando operador ao término deste lote. Serviços próprios são encerrados; sinais e sessões antigos não são reutilizáveis. Consultar RESULTADO.md e RESULTADOS.json antes de retomar. Não executar expanded integral.

## Pacote já conferido neste lote

O runtime C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-runtimes/preparacao-adocao/zoom-assistido-20261103-06 já passou por preservação, preparação física, adaptação, compilação e listagem. Candidato: 117d3c6982958d2276aa5ee94973adb97be6a71d. Continua sem .next e sem invocação; pode iniciar CF015 uma única vez quando o operador estiver disponível:

~~~powershell
node tasks/evidencias/saneamento-zoom-assistido/ambiente.mjs run 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\zoom-assistido-20261103-06' cf015 atendida-cf015-01
~~~

Não executar novamente prepare/compile/list nesse runtime, pois seus diretórios e recibos são exclusivos. Para RF15, preparar outro runtime conforme abaixo. O pedido de retomada no chat informa disponibilidade; só a declaração local após observação real é confirmação válida.

## Pré-condições

O executor deve conferir a preparação de ambos os casos, código/branch e ausência de alteração posterior relevante. Se a preparação de algum caso continuar falhando, não pedir outra rodada manual: diagnosticar a falha delimitada primeiro.

Cada cenário usa runtime novo e uma invocação própria. A compilação, cadastro UI, sessão, dados e página devem estar prontos antes de abrir o terminal humano. Um runtime já consumido por diagnóstico não serve como próxima execução fria.

PowerShell na worktree C:/Users/Aluga.com/Documents/Projetos/pessoal/controle-financeiro-worktrees/pr3-expanded-source:

~~~powershell
$runtime = 'C:\Users\Aluga.com\Documents\Projetos\pessoal\controle-financeiro-runtimes\preparacao-adocao\zoom-assistido-proxima-cf015-01'
node tasks/evidencias/saneamento-zoom-assistido/preservar.mjs initial $runtime
node tasks/evidencias/saneamento-zoom-assistido/ambiente.mjs prepare $runtime native-only
node tasks/evidencias/saneamento-zoom-assistido/aplicar.mjs $runtime
node tasks/evidencias/saneamento-zoom-assistido/ambiente.mjs compile $runtime
node tasks/evidencias/saneamento-zoom-assistido/ambiente.mjs list $runtime
node tasks/evidencias/saneamento-zoom-assistido/ambiente.mjs run $runtime cf015 atendida-cf015-01
~~~

Conferir cada exit antes de continuar. Os comandos não devem ser disparados em bloco se houver falha intermediária. Para RF15: outro runtime terminado em proxima-rf15-01, cenário rf15 e label atendida-rf15-01. A listagem geral deve conter exatamente dois specs originais; run seleciona um por nome completo, workers 1, retries 0.

A pausa aparece sob <invocação>/browsers/Rf15RemediationBrowserTest/visual/native-zoom-cf015/assisted/pause.json ou native-zoom-rf15-chrome. O agente confere status waiting, versão, candidato, pacote, alvo, sessão e dados. Só então abre terminal local visível para o operador com:

~~~powershell
node tasks/evidencias/saneamento-zoom-assistido/confirmacao-local.mjs confirm '<diretório assisted atual>'
~~~

A abertura desse terminal é responsabilidade do agente; não cabe ao usuário investigar infraestrutura. Não alimentar stdin artificialmente. cancel permite encerrar incompleto; check é leitura sem emitir sinal.

## Mensagem curta ao operador, somente quando a página estiver pronta

Use a janela descartável cujo título começa por CF015 ZOOM NATIVO ou RF15 ZOOM NATIVO CHROME e termina com Z-<identificador atual>. Confira URL http://127.0.0.1:3107/cartoes, heading Carteira e Cartão sintético para zoom, final 4242.

Sem maximizar/redimensionar a janela 1440×1000, capture o menu nativo mostrando 100%. Ajuste Mais → Zoom para 200%, capture indicador, URL e título, e feche o menu. No terminal aberto pelo agente, digite a frase exata mostrada. Envie as imagens depois. A automação executará as cinco páginas, transação, fatura longa, pagamento aninhado, rolagem e foco/teclado; não intercale cliques.

Registrar SO/versão, monitor/resolução e escala do sistema sem modificá-los. Configuração não verificada fica explicitamente desconhecida e impede alegar cobertura desse registro. Menu 100% ausente ou janela alterada: preservar ocorrência e parar.

O terminal é declaração humana; o agente deve inspecionar as capturas nativas e associá-las a esta execução. Não usar captura histórica, DPR ou imagem ampliada como nova confirmação. Se o alvo/sessão mudar, interromper e preparar novamente; não reutilizar sinal.

## Critérios depois da retomada

Usar a matriz N01–N12 original em ../validacao-zoom-nativo/MATRIZ.md. Associar cada assertion e captura ao critério: geometria, cinco rotas, transação e retorno, fatura correta e 12ª compra, pagamento aninhado e botão inteiro, Escape apenas na camada superior e retornos de foco. Inspecionar conteúdo, recortes e ações nas imagens. Não declarar aprovação pelo menu de zoom.

Primeira falha é preservada, classificada e encerra o aceite. Não corrigir produto em meio à prova nem repetir apenas para buscar verde. Capturas tardias não alteram o resultado funcional. Encerrar contexto descartável ou restaurar 100%; conferir processos/contêineres próprios.

Dois cenários completos ainda precisam de revisão independente e confronto com AC-UI-001, incluindo recortes 360×800/onboarding não cobertos por estes dois specs. Sem expanded automática, autoaprovação global ou liberação de merge.
