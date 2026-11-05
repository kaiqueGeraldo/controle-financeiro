# Inspeção curta de capacidade — 03/11/2026

## Conclusão após a intervenção do usuário

**A, assistida: operação nativa e captura disponíveis com operador humano nesta sessão.** O usuário aceitou operar o menu, forneceu duas capturas de 200% do RF15 na primeira invocação e, na segunda, forneceu menu 100%, menu 200% e fim da página a 200%, na janela RF15/URL local corretas. Não se trata de execução automatizada própria do input nativo. A automação autônoma do navegador nativo continua indisponível pelos limites abaixo. Não foi identificado outro ambiente B.

Os dois specs originais foram executados em duas invocações delimitadas e **nenhum foi aprovado**: na primeira, ambos ultrapassaram o poll de razão DPR2 e falharam pela confirmação ausente em 60s; na segunda, CF015 falhou no cadastro antes do ready e RF15 voltou a ultrapassar o poll de razão DPR2, mas não recebeu confirmação em 60s. Não houve zoom.json nem ações posteriores a esse ponto. A prova humana do percentual RF15 não equivale ao aceite do cenário completo.

A nova condição da segunda invocação foi um painel humano local para emitir imediatamente o arquivo de continuidade. Ele não gerou sinal; seu encaminhamento inicial também aguardou um caso que terminou antes do ready. O painel foi encerrado/arquivado, sem aprovação de sua capacidade. A causa da ausência final de confirmação do painel não foi capturada e não é atribuída ao navegador/site. Não houve terceira rodada equivalente. [Resultados e próximo passo](RESULTADO.md).

## Decisão inicial, antes da disponibilidade do operador

**C para input nativo autônomo.** A inspeção curta abaixo não repetiu os caminhos recusados. A intervenção humana posterior mudou a viabilidade do menu/captura, sem corrigir ou contornar a proteção da ferramenta.

## Instruções e inspeção efetiva

Foi lida integralmente a skill Computer Use local `openai-bundled/computer-use/26.1027.30824/skills/computer-use/SKILL.md`, com `guidance.md`, `api.md` e `confirmations.md`. Foram lidas também as instruções atuais devolvidas por `cua.getState()` e a documentação da integração Chrome por `cua.getBrowser({id:'2'})`.

Chamadas de capacidade realizadas, sem input em página ou janela:

1. Inicialização documentada de `@oai/sky` no `node_repl` e `sky.list_apps()`. Inventário retornou janelas pessoais de Chrome/Edge; nenhuma janela de teste estava em execução. Não houve `get_window`, `get_window_state`, ativação, captura ou atalho nativo.
2. `cua.getState()` retornou integração Chrome por extensão, navegador interno e MCP Apps. A integração Chrome estava vinculada ao navegador pessoal; não foi criada ou reivindicada nenhuma aba.
3. `cua.getBrowser({id:'2'})`, nome de sessão `🔎 Capacidade zoom` e `zoomBrowser.capabilities.list()`. Capacidades retornadas: `viewport` e `management`. A documentação não expõe definição/leitura de zoom nativo nem criação de perfil descartável. `viewport` é explicitamente emulação responsiva. `management` foi apenas listado, não operado.

Não foram preservados nos documentos os títulos/URLs pessoais retornados pelo inventário.

| Capacidade necessária | Encontrado nesta inspeção | Conclusão |
|---|---|---|
| Janela própria com URL inequivocamente confirmada | Inventário possível; nenhum novo vínculo/captura nativos demonstrados | Não comprovada |
| Navegação/interação DOM | Integração Chrome e Playwright existentes | Não resolve o bloqueio nativo |
| Alterar e ler zoom nativo | Não há operação própria na API de navegador documentada | Indisponível para este recorte |
| Indicador externo 100%/200% associado à URL | Dependeria do caminho de captura nativa anteriormente recusado ou de operador | Pendente |
| Perfil descartável | Os specs originais lançam processos/contextos Playwright temporários; a extensão conectada é do perfil pessoal | Preparável pelo harness; sem controle nativo seguro demonstrado |
| Capturas e interações após zoom | Playwright consegue operar seus contextos próprios | Condicionadas à intervenção nativa legítima |

## Recusas anteriores e diferença concreta

- [21/09](../../../../../controle-financeiro/tasks/evidencias/saneamento-CF-015-RV01/ZOOM.md): `sky.get_window` recusou propriedade da janela Chrome for Testing; recuperação documentada também falhou.
- [11/10](../../../../../controle-financeiro/tasks/evidencias/saneamento-RF15/ZOOM.md): a tentativa Chrome instalado terminou por impossibilidade de confirmar a URL com segurança. Não houve input.
- [24/10](../../../../../controle-financeiro/tasks/evidencias/CF015-zoom-gate-CF034/CAPACIDADES.md): vínculo inicial aceito, porém observação interrompida pela mesma proteção de URL. Versão da skill então registrada: 26.1016.51333.
- [Residual da PR3](../saneamento-PR3-expanded-residual/RESULTADOS.md): dois polls obrigatórios esgotados em 180s com razão DPR 1; nenhuma confirmação nativa. O [parecer mais recente](../revalidacao-RR3-01-atribuicao-v2/PARECER.md) manteve C e os dois casos não executados.

Hoje o pacote da skill é mais recente e o Chrome instalado é **155.0.8059.84** (metadados locais do executável). O Chromium já instalado do Playwright é **153.0.8010.12**. Isso não demonstra correção da identificação segura da URL nem nova operação de zoom. O inventário/contrato atual não fornece diferença funcional comprovada que autorize repetir as seleções recusadas. Não foi reproduzida a recusa nem tentado o mesmo caminho por CUA, PowerShell, Win32, CDP ou configuração de perfil.

Não foi cogitada API de protocolo/configuração como substituta: nenhuma foi executada e não há alegação de equivalência com zoom nativo. CSS zoom, transform, deviceScaleFactor, viewport, pinch, DPR isolado, escala do sistema e ampliação de imagem não foram usados para obter aceite.

## Mecanismo assistido permitido

O mecanismo é o menu **Mais → Zoom** da janela descartável aberta pelo próprio spec. A [documentação oficial do Chrome](https://support.google.com/chrome/answer/96810?hl=pt-BR) descreve o zoom de página pelo menu; não foi alterada configuração global. O [contrato do Playwright](https://playwright.dev/docs/api/class-browsertype) e os specs originais sustentam os contextos temporários; não se anexa ao perfil pessoal.

Alvo CF015: título `CF015 ZOOM NATIVO - ajustar 200%`. Alvo RF15: `RF15 ZOOM NATIVO CHROME - ajustar 200%`. Ambos exigem barra de endereço `http://127.0.0.1:3107/cartoes`, `ready.json` da invocação atual e a fixture exata do cartão final 4242. Título sozinho não basta. O operador captura a interface nativa; o agente pode conferir os arquivos recebidos e as métricas do teste, sem operar novamente o caminho recusado.

A operação humana de menu/captura foi concretamente realizada. Falta demonstrar a confirmação síncrona dentro do prazo original, seguida das verificações restantes, e diagnosticar separadamente o cadastro pré-zoom do CF015. O [roteiro atualizado](ROTEIRO-ASSISTIDO.md) oferece uma confirmação por terminal operado pelo usuário: digitar `200%` depois de observar/capturar o indicador, enviar imagens depois. A checagem do novo helper foi de sintaxe/argumentos, sem emissão de marker; sua interação humana ponta a ponta ainda não foi demonstrada. Não é declarada solução validada nem exigida investigação de infraestrutura pelo usuário.
