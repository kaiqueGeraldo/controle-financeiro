# Parecer independente — histórico invisível CF014

14/10/2026. **Diagnóstico e correção do harness aprovados; ocorrência encerrada;
CF-014 concluída; CF-015 permanece em_revisao.** Nenhuma alteração de produto.

## Base e preservação

Branch `codex/cf014-historico-invisivel`, HEAD inicial
`31e6fe25235dd0eac4598f6631a286859d01211f`; intervalo examinado
`8096b22f0baebf1665cf833065fd3972817d5000..31e6fe2`, ancestralidade confirmada.
Três commits candidatos:56ba986 (probes),0b22c89 (harness),31e6fe2 (provas/docs).
Não havia alterações posteriores no início. Staging vazio, única alteração
preexistente README.md raiz, hash6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA.
Mantido fora dos commits. Nenhum reset/clean/checkout/merge/rebase/push/deploy,
nenhuma branch antiga recriada, banco real ou onboarding.

[preservation.json](preservation.json):121 artefatos do executor,5 fontes e3
provas históricas conferidos sem divergência antes de editar. A única fonte
candidata depois alterada foi o observador de testes, em commit próprio a40cb6f,
por defeito demonstrado na primeira execução desta revisão. Fontes de produto
permanecem idênticas à base, inclusive durante a contraprova (não houve mutação
que exigisse restauração). Relatórios históricos não foram reescritos.

## Decisões separadas

| Item | Parecer e fundamento |
|---|---|
| A. Diagnóstico | **Aprovado, defeito de integração do harness demonstrado**. Clock conserva ticks entre documentos; WAAPI reinicia timeline. Motion transfere startTime no futuro e mantém opacity0. HTTP200/8, React comprometido8 e DOM8 descartam ausência/descarte de dados como causa observada |
| B. Harness | **Aprovado**. Date fixa preserva data/instante de referência; timers/performance/rAF nativos mantêm origem coerente. Cenário não exige passagem de dia ou avanço de timers. Troca restrita a investment, sem enfraquecer assertions, suprimir animação ou mudar produto |
| C. Ocorrência | **Encerrada no recorte sustentado15s da matriz original**. Contraprova reproduz a mesma cadeia/elemento; controles e jornada original adaptada comprovam pintura/interação. Não é encerramento automático de toda captura vazia |
| D. CF-014 | **concluida**. Os quatro critérios originais estão confrontados na [matriz vigente](MATRIZ.md); a opacidade era o único resíduo após o aceite do P2 ciclo visual. Nenhum critério removido ou pendência essencial transferida |
| E. CF-015 | **em_revisao**. Recebe CF014 concluída, mas conserva zoom nativo200% não verificado (CF010) e RVA-03 inconclusivo (CF013). Sem aprovação integral do marco |

## Prova independente

[Mecanismo, contrato temporal e diferenças da fixture](MECANISMO.md).
Mesma fixture SQL persistida, mesmo componente/viewport/jornada nos três modos;
nenhuma operação financeira criada pela interface ou API. Na rodada final:

| Modo | performance−timeline | currentTime inicial WAAPI | HTTP/React/DOM | Pintura |
|---|---:|---:|---|---|
| Clock antigo |24723,5ms|−24603,5ms|200/8/8|opacity0 após15s, assertion original vermelha exigida pelo probe |
| Nativo |12,8ms|72,4ms|200/8/8|opacity1, ancestrais visíveis, clique/scroll/foco |
| Date fixa candidata |15,8ms|83,1ms|200/8/8|opacity1, ancestrais visíveis, clique/scroll/foco |

[Valores completos](causal-final-summary.json). Não se conclui causalidade só
porque retirar Clock deixa o teste verde: os valores medidos ligam configuração,
navegação, origem de tempo, startTime futuro, currentTime negativo e opacity0.
O original não tinha instrumentação de timeline: a atribuição histórica é
sustentada pela reconstrução de trace/código e contraprova equivalente, não por
uma medição retroativa inventada.

Primeira rodada:4/5 testes aprovados, Maven falha. Controle nativo atingiu
opacity1 do histórico, mas o modal ainda animava (opacity0,704486) na assertion
síncrona adicional. [Falha e reparo do probe](PROBE.md), preservados em browser/.
Após correção de sincronização, três controles3/3 e Maven BUILD SUCCESS.
Não houve retry automático nem aumento de timeout. O cenário civil de resposta
retida/reabertura/reload e a jornada original adaptada passaram na primeira
rodada e não foram modificados. São cinco cenários distintos, não oito aceites
independentes por somar repetições. Lint/typecheck aprovados.

[Imagens e correlação de interação](VISUAL.md),
[comandos e alcance do snapshot financeiro](EXECUCOES.md).
Banco comparado antes/depois: todas as colunas de investments, invest_transactions,
accounts, transactions e financial_intent_receipts, iguais nas duas rodadas.
Não se alega igualdade de todo o banco ou reconciliação de compras reais.
Oito traces inspecionados: histórico200, CSS esperado e zero JWT remanescente
após sanitização local documentada. Provas duráveis fora de target.

## Pendências e próximo trabalho delimitado

- **Verificação faltante:** zoom nativo200% CF010/015, com evidência real de zoom,
  reflow/alcance das ações; viewport/CSS/DPR não substituem.
- **Investigação inconclusiva:** RVA-03 CF013/015; avançar somente com hipótese e
  condição técnica novas, distinguindo falha pré-envio de reconciliação após commit.
- **Limites históricos preservados:** outras capturas intermediárias, observação
  de5s da operação e dois timeouts de componentes não explicados por associação.
  Não são novos bloqueios sem evidência própria; o critério do histórico foi
  atendido pela cadeia atual de pintura/interação, não pela certificação dessas imagens.
- **Aceites preservados:** CF011/012, RF15-01–04 e P2 ciclo visual RVR24-02.
  RJ-022-01/H24-01 permanecem no escopo CF022.

Próximo trabalho restrito aos dois resíduos do marco: obter verificação de zoom
nativo e, havendo hipótese nova, investigar RVA-03. Não reabrir auditoria geral
frontend, itens aceitos, cálculos financeiros ou onboarding.
