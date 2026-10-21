# Verificação visual CF-031

Rodada final21/10/2026, Chromium153.0.8010.12. Três projetos reais Playwright:
360×800/SP,768×1024/UTC,1440×900/Kiritimati. Relógio Date-only fixa calendário;
animações conservam relógio nativo. Cada captura aguarda estado observável e duas
pinturas; sem sleep arbitrário, retry ou timeout ampliado. Ver ambientes por caso.

Inspeção direta de capturas finais:

- [Mobile, subtotal parcial extenso](e2e-final/mobile-360-SP-large-partial-review.png):
  centavos e aviso de total indisponível quebram linha sem truncar.
- [Mobile, investimento desconhecido](e2e-final/mobile-360-SP-unknown-source.png):
  desconhecido/indisponível difere do zero da carteira; não inventa saldo livre.
- [Mobile, ações da revisão](e2e-final/mobile-360-SP-full-review-actions.png):
  confirmar/consultar/cancelar visíveis e acionáveis após rolar; meta numérica
  mantém unidade e cobertura monetária não aplicável; prazo original vencido visível.
- [Desktop, resumo escuro](e2e-final/desktop-1440-Kiritimati-full-review-dark.png):
  contas1300/investimentos501/patrimônio1451, reservas separadas, hierarquia legível.
- [Tablet, metas](e2e-final/tablet-768-UTC-full-step-5.png): campos e navegação
  refluem; formulário em duas colunas com rótulos e prazo original.

Inspeções anteriores preservadas em `e2e-observers-fixed/` e `e2e-extended/`:
contas/cartões/investimentos/metas/reservas/previsões, claro/escuro e conclusão
com privacidade. Rodada final contém capturas equivalentes e negativas/extensas.
Asserções finais verificam overflow horizontal tanto no documento como em main,
visibilidade das ações e ausência de valores sob privacidade após mudança real.
Testes de tela cobrem nomes acessíveis, teclado, Escape, foco inicial/retorno e
associação de erros; não se reduz a presença no DOM.

O shell tem rolagem interna: fullPage registra o viewport atual desse contêiner,
não todas as suas posições. Topo, ações e fontes têm capturas dedicadas. A cor
do título no cabeçalho global claro apresenta contraste fraco já existente;
esta entrega não certifica contraste global nem modifica o shell compartilhado.

**Zoom nativo200% não foi certificado.** Viewport/DPR e estas capturas não o
substituem. Escopo, procedimento, evidência, responsável e reavaliação incluindo
onboarding seguem a DEC-ONB-03 e CF010/015. Nenhuma tentativa bloqueada foi repetida.
