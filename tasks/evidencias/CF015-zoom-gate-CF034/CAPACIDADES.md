# Capacidade de zoom nativo — 24/10/2026

Resultado: **verificação bloqueada pela ferramenta antes de captura/input**.
Nenhum ensaio de produto a 200%, nenhuma aprovação ou defeito visual inferido.

## APIs efetivamente conferidas

Lidas a skill `computer-use` e suas referências completas `guidance.md`,
`api.md` e `confirmations.md`, versão local `26.1016.51333`. Inicialização pelo
`node_repl`, importação de `@oai/sky`, sem helper próprio ou automação alternativa.

| Etapa / chamada suportada | Observação real | Limite |
|---|---|---|
| Importar `@oai/sky`; `sky.list_apps()` | Êxito; Chrome expõe uma janela nativa | Inventário não demonstra input ou captura |
| Seleção única; `sky.get_window({id:264048, app:"Chrome"})` | Retornou o objeto da janela | Diferente das falhas históricas de vínculo; não comprova zoom |
| `cua.createBrowserTab("chrome", "about:blank", {sessionName:"🔎 CF015 zoom"})` | Chamada retornou documentação da extensão Chrome, browser ID 3 | Criação de aba de análise, **sem prova de perfil/janela isolados**; não foi carregado produto |
| Renovar `sky.list_windows()` e selecionar Chrome único | ID 264048 retornado novamente | Nenhuma janela CF015 de produto foi preparada |
| `get_window` e `get_window_state({include_screenshot:true, include_text:true})` na janela renovada | Computer Use interrompido por impossibilidade de determinar a URL atual com confiança para aplicar sua política | Etapa parou antes de screenshot/árvore utilizáveis e de qualquer input; não foi possível delimitar com certeza qual das duas chamadas internas causou a interrupção |

Mensagem devolvida pela ferramenta, preservada literalmente:

```text
Computer Use has been stopped for this turn because it could not determine the current browser URL on Windows with enough confidence to enforce policy. Stop your work and send a final message noting why Computer Use ended.
```

Encerrado o trabalho de controle de computador. A integração Git e a análise
documental autorizadas prosseguiram separadamente. Não houve retry após essa
interrupção, seleção de outra janela, input em abas pessoais ou contorno por
PowerShell/Win32/CDP. Nenhum atalho de zoom foi enviado. A interface da sessão
`cua_repl` informa APIs nativas desabilitadas; a documentação da extensão permite
observação/locators, sem operação documentada para definir/verificar zoom nativo.
Não foi inventada API de zoom ou usada uma combinação de teclas no DOM como prova.

## Comparação histórica

- [21/09: ZOOM](../saneamento-CF-015-RV01/ZOOM.md): janela isolada Chrome for Testing
  153, inicial 1424×905/DPR1; `get_window` recusou o vínculo mesmo após recuperação.
- [11/10: ZOOM](../saneamento-RF15/ZOOM.md): mesma recusa no Chrome for Testing;
  alternativa Chrome154 já havia sido interrompida por incapacidade de determinar
  URL. [Ocorrências do fechamento](../fechamento-CF-010-CF-015/OCORRENCIAS.md)
  também preservam vínculo recusado e APIs nativas indisponíveis.
- Agora o vínculo inicial foi aceito, mas **não há capacidade nova demonstrada
  para captura/input/URL**. A checagem curta da sessão atual encontrou novamente
  o bloqueio de URL já registrado. Isso encerra a sondagem; não justifica repetir
  o harness antigo ou criar serviços para esperar o mesmo bloqueio.

## Alcance e retomada verificável

Não foram medidos versão do navegador, viewport, DPR, tema, privacidade ou zoom
inicial por página. Não foram obtidas capturas, traces ou interações a 200%.
Não houve runtime novo, usuário, serviço ou PostgreSQL iniciado nesta análise.
O zoom anterior não exige restauração: nenhuma ação o alterou.

Gatilho de retomada: atualização/correção da ferramenta que permita, na **janela
de análise correta com URL local confirmada**, capturar a interface e ler o
indicador nativo. Primeiro executar um preflight suportado: seleção única →
captura/URL → registrar zoom inicial → configurar 200% pelo menu nativo → capturar
indicador → interagir/observar → restaurar e conferir zoom inicial. Somente após
esse preflight preparar runtime próprio em
`../controle-financeiro-runtimes/CF015-zoom-gate-CF034/<execucao>/` e percorrer a
[matriz futura](MATRIZ-ZOOM.md). Persistência de bloqueio de URL encerra a tentativa.
Uma API futura documentada que leia/escreva o zoom por aba, com confirmação do
indicador e capturas/interação, também é mudança concreta de capacidade a avaliar.

Viewport menor, CSS zoom/transform, deviceScaleFactor, ampliação de screenshot,
zoom de imagem/SO e estilos modificados continuam sem valor de aceite nativo.
Não é solicitado trabalho manual ao usuário nesta entrega.
