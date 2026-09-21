# R10 — zoom nativo 200% continua pendente

Tentativa em 21/09/2026, navegador isolado **Google Chrome for Testing / Chromium
153.0.8010.12**, perfil temporário, dados sintéticos em PostgreSQL descartável.
Janela externa 1440×1000, viewport inicial medido **1424×905**, DPR 1,
visualViewport.scale 1. [Métricas da janela](visual-final/native-zoom/ready.json).

Método planejado: aumentar zoom pelo teclado/menu nativo da janela, capturar
o indicador 200% e confirmar simultaneamente DPR relativo 2, largura interna
pela metade, janela externa inalterada e visualViewport.scale 1. Depois,
percorrer dashboard, contas, cartões, planejamento, extrato e modais de
transação/fatura/pagamento, verificando acesso, scroll e foco.

O primeiro harness falhou antes da página porque herdou `deviceScaleFactor`
do projeto Playwright junto de `viewport: null`. Corrigida somente a configuração
do teste. Na segunda tentativa a janela e a fixture real foram criadas.

`@oai/sky` listou a janela `CF015 ZOOM NATIVO - ajustar 200%: Google Chrome for
Testing`, ID 1379468, app `Chrome`. Entretanto `get_window` recusou esse objeto:

```text
window id 1379468 no longer belongs to Chrome; current owner is Chrome
```

Renovada a seleção com `list_windows`, a tentativa por ID retornou o mesmo erro.
`list_apps` confirmou a janela com o mesmo identificador. A recuperação indicada
pela skill falhou. Nenhum atalho foi enviado a janelas pessoais como alternativa.
Não foi possível capturar a janela pelo controle nativo nem aplicar/comprovar
200%. O teste exige o zoom real e, portanto, não aprova a situação inicial de 100%.

**Não existem capturas de 200% nesta rodada.** As capturas responsivas produzidas
pelo harness existente são testes de viewport; não suprem esse aceite. Não foi
usado CSS zoom, device scale ou redimensionamento de imagem como substituto.
Nenhuma alteração de produto foi criada para contornar essa limitação.

## Roteiro manual curto para fechar a pendência

1. Usar ambiente local descartável e usuário sintético, nomes longos, valor
   R$ 123.456.789,12 e fatura com 12 compras. Registrar commit, navegador/versão,
   tema e viewport a 100% (incluir 360×800 conforme AC-UI-001/CF-010).
2. No menu do navegador, selecionar **200%**. Capturar o indicador nativo;
   registrar dimensões antes/depois. Não usar escala de DevTools ou CSS zoom.
3. Percorrer dashboard, contas, cartões, planejamento e extrato: totais e
   ações devem ficar legíveis/alcançáveis por rolagem e teclado, sem recorte
   que impeça acessar o conteúdo completo. Capturar topo e fim relevantes.
4. Abrir Nova Transação, fatura longa e pagamento: alcançar o último item e
   botões inferiores; verificar Tab/Shift+Tab contidos no modal, Escape apenas
   no filho e retorno ao acionador. Repetir modal nos temas claro/escuro.
5. Anexar capturas, medidas e resultados à nova revisão. Se a geometria falhar,
   registrar evidência antes de propor correção. Até isso ocorrer, manter R10
   parcialmente verificado e o aceite integral de zoom aberto.

O teste opt-in `cf015.native-zoom.integrated.spec.ts` prepara fixture real e
verifica esses fluxos após intervenção nativa. Ativar `CF015_NATIVE_ZOOM=1`
no harness Java e observar `ready.json`; somente depois de capturar 200%,
gravar `native-confirmed.txt` com conteúdo exato `200%` no mesmo diretório.
Esse arquivo é apenas sinal de continuidade: não substitui a assertion de
zoom efetivo nem a captura visual do indicador.
