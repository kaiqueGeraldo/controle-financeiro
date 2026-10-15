# Mecanismo e equivalência — revisão independente, 14/10/2026

## Ocorrência reconstruída

Original: `rf15-matrix.integrated.spec.ts:55`, mobile360×800, animações normais.
Clock fixado15/01/2027 antes da autenticação/preparação; oito BUY por API;
navegação completa para `/investimentos`, abrir RF15, exigir oito botões e
opacity1 do contêiner. O trace preservado registra instalação213106,694ms,
goto230480,292ms:17,374s transcorridos. HTTP200/8 e snapshots opacity0 ao
longo da assertion15s. A imagem histórica foi inspecionada: cabeçalho visível,
região inferior vazia. Não é apenas região fora da viewport nem ausência de dados.
O trace antigo não mediu `document.timeline`; a atribuição retroativa combina
sua sequência temporal com reprodução instrumentada do mesmo consumidor.

## Encadeamento causal verificado no código instalado

- Playwright1.63.0, `node_modules/playwright-core/lib/coreBundle.js:12497`:
  setFixedTime chama `_installIfNeeded`, instala o Clock e registra logs para
  novos documentos. O código injetado (linha12023) substitui Date, timers,
  requestAnimationFrame e performance; performanceNow retorna ticks acumulados,
  sincronizados com tempo real. Fixar Date não congela esses ticks.
- A navegação cria nova timeline nativa de animação. Ela não participa do log
  reproduzido pelo Clock, ao contrário do performance.now substituído.
- Motion12.33.0, `motion-dom/dist/es/frameloop/sync-time.mjs:21`: time.now usa
  performance.now ou timestamp do frame. AsyncMotionValueAnimation calcula
  startTime a partir de createdAt/resolvedAt; NativeAnimationExtended:35 e
  NativeAnimation:148 atribuem esse valor a animation.startTime.
- Produto intacto, `src/components/screens/investments/investmentDetails.tsx:203`:
  motion.div opacity0→1, delay200ms. Com startTime no futuro da timeline,
  currentTime negativo mantém o primeiro keyframe transparente. A requisição e
  o commit React podem terminar sem produzir pintura visível.

A espera condicional performance>=25000 no documento anterior é a variável
experimental escolhida antes da navegação. Não aumenta timeout nem tenta
esperar a falha desaparecer. O probe antigo só passa quando a assertion de
pintura falha e os indicadores temporais/estado confirmam esse mecanismo.

## Correção candidata e trade-off

`support/civil-date-clock.ts:4` fixa Date.now, Date() e new Date() sem argumentos
por initScript. Instantes explícitos, parse, UTC e instanceof são preservados;
performance, timers, rAF e WAAPI permanecem nativos. O cenário exige data local
estável para defaults/autenticação, sem avanço de timers ou passagem de dia.
A data fixa mantém15/01/2027 em São Paulo. A animação deve correr naturalmente.
A troca aplica-se somente ao start('investment'); o ramo de metas que avança
um dia continua com Clock. Não há opacity forçada, CSS injetado, animação
suprimida, assertion removida ou prazo ampliado.

Benefício: preserva a origem temporal nativa usada pela animação sem mudar
produto. Limite: este helper não simula passagem do tempo ou meia-noite e não
deve substituir Clock indiscriminadamente. Trata-se de harness de teste, sem
mudança de complexidade, concorrência, consultas ou separação de domínios no
produto. Leitura Fiber é observação O(n) da árvore de desenvolvimento, somente
nos probes; não é contrato público React ou instrumentação de produção.

## Equivalência e limites da fixture

Mesmo usuário sintético por rodada, SQL antes de iniciar browser: RF15 tem8
BUY1×10, IDs100–107, datas08–15jan2027; CURTO tem1, VAZIO0. Todos os três modos
usam os mesmos dados persistidos, viewport e passos. Original tinha oito
operações em15jan e uma conta; nome e disponibilidade da avaliação também
diferem. Essas diferenças alteram textos/altura, mas a própria fixture atual
reproduz o defeito com Clock e o elimina nos dois controles, no mesmo elemento,
sem trocar dados ou componentes. Equivalência é da ocorrência visual, não de
reconciliação financeira. Nenhuma compra/compensação é submetida nesta revisão.

A jornada adicional reproduz as assertions originais após a preparação:
histórico8, opacity1, rolagem, Aportar via teclado, Confirmar Operação no viewport,
Escape retorna foco e fecha detalhe. A preparação original com oito POST não
é reexecutada. Loading/reabertura/reload são cobertos pelo probe civil existente.

## Alcance

Classificação: defeito de integração do harness temporal demonstrado no cenário
sustentado15s, não defeito de produto. A evidência original não instrumentada
limita a atribuição histórica; a reprodução causal elimina a hipótese de mera
captura ocasional para esta ocorrência. Não explica automaticamente screenshots
intermediários em outras seleções, a observação de5s da operação, RVA-03, zoom
nativo200% ou dois timeouts de componentes. Esses registros ficam intactos.
