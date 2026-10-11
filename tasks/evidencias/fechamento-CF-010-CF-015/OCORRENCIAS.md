# Ocorrências iniciais e correções do probe

- Componentes: primeira execução não carregou testes por EPERM no rename do cache temporário do sandbox. Execução com acesso adequado: 8 arquivos/30 testes aprovados; não é retry de assertion.
- Probe B: getByRole(alert) selecionava alerta global do Next antes da mensagem de erro. Corrigido para exigir texto de código inválido. A sequência de Tab agora exige o botão intermediário Mostrar nova senha e depois Redefinir Senha; não retira prova de teclado.
- Probe B/C: alerta global e alerta da aplicação tornavam o seletor ambíguo. Filtrado pelo texto esperado, conservando assertion e falha 503.
- Roteiro visual: primeira ocorrência preservada em browser/playwright.log e first-failures/visual-context.md. Estourou 90s no roteiro que agrega todas as larguras/temas/nota/modais. Novo probe separa por largura com as mesmas assertions, sem alterar 90s nem retries=0. Isso não prova causa ambiental nem elimina a ocorrência; resultado por recorte será informado.
- E: bloqueio antes de criar hábito, não após clique semanal. Botão mobile sem nome acessível é defeito de produto (RF15-01), confirmado na imagem e árvore. Investigação semanal continua com fixture criada por desktop e clique semanal mobile; não representa aprovação do botão de criação. O finally do probe passou a preservar erro original se screenshot falhar após fechamento da página.

## RF15-01 — P2 — ação de criar hábito sem nome acessível no mobile

Dona CF-014; critério teclado/nomes acessíveis AC-UI-001, consumidor CF-010. Em 360px, abrir /habitos com usuário sintético vazio. Esperado: ação de criar identificável por tecnologia assistiva. Observado: botão com ícone +, árvore apenas button, sem nome; busca pelo nome Novo Hábito não encontra. Evidências first-failures/habits-mobile-unnamed.png e habits-context.md; rede E-weekly-network.json somente GET200. Impacto: ação visual existente, inacessível por nome, não falha de persistência. Condição: nome acessível em todos os breakpoints e prova teclado/browser. Sem correção nesta revisão.

## Zoom nativo — verificação faltante

Chromium 153.0.8010.12 isolado, janela1440 e innerWidth1424, DPR1. sky.list_windows retornou a janela CF015 Native Zoom Capability. get_window recusou: `window id 9045178 no longer belongs to Chrome; current owner is Chrome`. Nova listagem e nova seleção por id repetiram o erro. Nenhum input enviado, zoom nunca aplicado. Alternativa cua_repl: APIs nativas desabilitadas nesta sessão; Chrome extension expõe viewport e locators, sem controle documentado de zoom. Não usar viewport, DPR ou CSS como substituto. Critério CF010/AC-UI-001 permanece aberto; demais provas continuam.

## Probe final de datas

A primeira execução final aprovou download, mas tentou parsear JSON de resposta de compra HTTP OK sem corpo e parou antes das assertions de datas. Leitor corrigido para retornar null quando corpo vazio, mantendo exigência HTTP OK. A cópia corrigida reproduziu RF15-04 com API correta e três assertions de UI vermelhas. Nenhuma mudança de produto/expected/timeout. Logs final e final-corrected preservados.
