# Inspeção visual — CF-015

As capturas originais do parecer continuam em `../revisao-CF-015/visual/`;
a reprodução inicial deste saneamento fica em `visual-inicial/`. O estado
corrigido é capturado em `visual/`, separado por projeto/fuso. Screenshots foram
inspecionados, não aprovados automaticamente por terem sido gerados.

## Matriz executada

| Conteúdo | 360px | 768px | 1440px | Critério observado |
|---|---|---|---|---|
| Dashboard | Escuro/claro e fim da rolagem | Escuro/claro, sidebar recolhida | Escuro/claro, sidebar fixa | Total R$ 123.456.789,12 integral; gráfico com controles separados e eixo legível; extrato recente/contas sem dígitos cortados. |
| Contas/cartões | Resumos em uma coluna, nomes longos | Resumos adaptados a duas colunas | Três colunas quando há espaço | Rótulos/ícones/valores e ações de cabeçalho não se sobrepõem. |
| Extrato | Botão nomeado abre modal | Cabeçalho e resumos com espaço | Ações disponíveis | R12 verificado por nome acessível; não se usou saldo de página como total global. |
| Planejamento | Cabeçalho quebra e mantém ações | Texto longo e totais do rodapé | Sidebar/rodapé compatíveis | Item R$ 25,00 + fatura R$ 14.814,72; ações e valores acessíveis. Captura espera o item persistido, não apenas ausência momentânea do spinner. |
| Fatura com 12 compras | Modal ocupa 85vh, lista rola | Diálogo centralizado | Diálogo centralizado | Total R$ 14.814,72, acesso ao item 12 e ao pagamento. Foco entra, filho recebe foco, Tab/Shift+Tab contidos, Escape fecha filho e depois pai; retorno ao acionador. |
| Outras telas | Metas, investimentos, hábitos, resumo anual, ajustes | Mesmas rotas | Mesmas rotas | Capturas de compatibilidade; não equivalem a revisão funcional integral dessas áreas. |

Automação executada em Chromium/São Paulo e Chromium/Kiritimati. A inspeção
visual do implementador concentrou-se nas capturas São Paulo dos fluxos afetados,
com os dois temas e as três larguras. Kiritimati repete as assertions de interação,
geometria e persistência; não se declara inspeção humana individual de toda imagem.

A primeira matriz ampliada passou automaticamente, mas sua inspeção revelou
recorte de números no extrato recente e de rótulos no eixo. A imagem foi
preservada em [antes do ajuste](visual-recortes/1440-dashboard-light-antes.png).
Após a correção, o [dashboard final](visual/chromium-desktop-sao-paulo-cf007-v1/1440-dashboard-light.png)
mostra o valor inteiro; em
[360px](visual/chromium-desktop-sao-paulo-cf007-v1/360-dashboard-bottom.png) a linha
quebra sem esconder centavos. O eixo usa unidade compacta e o tooltip conserva
valor integral. Não houve alteração de cálculo financeiro.

Exemplos adicionais inspecionados:

- [Planejamento 768 claro](visual/chromium-desktop-sao-paulo-cf007-v1/768-planejamento-light.png).
- [Contas 1440 claro](visual/chromium-desktop-sao-paulo-cf007-v1/1440-contas-light.png).
- [Cartões 360 claro](visual/chromium-desktop-sao-paulo-cf007-v1/360-cartoes-light.png).
- [Fatura 360](visual/chromium-desktop-sao-paulo-cf007-v1/360-invoice-long.png) e [768](visual/chromium-desktop-sao-paulo-cf007-v1/768-invoice-long.png).

`observations.json` registra largura do documento/main e botões sem texto/label
em cada rota. Esses números são diagnósticos, não certificado geral de
acessibilidade. R12 tem assertion semântica específica. Componentes e E2E cobrem
foco; não houve leitor de tela físico ou auditoria WCAG completa.

## Zoom e limitações

O teste de capacidade `zoom-capability.mjs` tentou três Control+Equal no Chromium
headless: innerWidth=1440, DPR=1 e visualViewport.scale=1 permaneceram iguais.
Logo, **zoom nativo de 200% não foi aplicado nem verificado**. Deve ser revalidado
em navegador interativo. `180-modal-light-narrow-viewport.png` é exclusivamente
uma largura adicional com ação alcançável por rolagem; não equivale a zoom.

As capturas incluem indicadores do servidor Next dev; não se alterou o produto
para escondê-los. A inspeção visual usa relógio nativo para as animações, enquanto
o backend de teste mantém o relógio de negócio fixo. Datas/status da seed visual
não são oráculos financeiros; os roteiros temporais e de pagamento próprios
usam contratos e relógios controlados, com persistência conferida separadamente.

Não foram certificados todos os contrastes, todos os leitores de tela,
combinações de privacidade/dados ou todos os navegadores. A nova revisão deve
confrontar essas capturas com o parecer e inspecionar diretamente os fluxos.
