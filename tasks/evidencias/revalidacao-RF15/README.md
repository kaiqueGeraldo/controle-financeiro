# Revalidação independente RF15 — fechamento em 12/10/2026

**RF15-01 e RF15-03 encerrados. RF15-02 e RF15-04 parcialmente saneados, com resíduos reproduzidos. Nenhuma nova tarefa integralmente concluída.** CF011 conserva conclusão; CF010/012/013/014/015 permanecem em_revisao pelos impedimentos delimitados abaixo.

Base anterior bc5532cffc15f161685c03dae199675b0829c047; candidato examinado db2d77d2ac0856be11d18050168f5076118a7e4a, branch codex/cf-028-contrato-onboarding. Intervalo completo inclui 572e8e5,07b2178,d85e0f1,2b3e4d6,8e739b9,82936a2,56ae14a,db2d77d; base é ancestral e não havia commits posteriores. Durante a revisão os deltas novos são somente testes/probes/evidências/documentação. Não houve correção de produto, onboarding, push, deploy, merge/rebase/reset/clean ou banco real.

Estado inicial: README.md raiz único delta, staging vazio. SHA256 preservado 6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA. Conferência independente de manifests:187/187 arquivos das provas anteriores e 24/24 arquivos da árvore testada iguais aos hashes informados (hash-check.json). Os relatórios históricos não foram reescritos; as notas atuais apontam para este parecer.

| Categoria | Decisão independente |
|---|---|
| A — RF15-01 | Encerrado: criação mobile por nome/Enter, foco, ação real e reload. Não aprova o detalhe do hábito. |
| A — RF15-02 | Aberto parcialmente saneado: ocultação estável/acessível corrigida, mas valores aparecem durante animação inicial de contas. |
| A — RF15-03 | Encerrado: detalhe do extrato, teclado, Escape, retorno, rascunho e cleanup no recorte executado. |
| A — RF15-04 | Aberto parcialmente saneado: datas persistidas/DEC03 e estados financeiros corrigidos; fatura aberta não atualiza atraso na virada do dia/foco. |
| B — resíduos CF014 | Confirmados: Escape/semântica de detalhes de meta/hábito, agrupados; retorno de foco perdido na transição de investimento, causa distinta. |
| C — três testes contestados | Expectativas antigas incompatíveis com DEC03. Teste ativo corrigido em commit separado e contraprova detecta fórmula antiga; seleção ampla 115/115. |
| D — verificações | PAID real, negativo/extenso, metas hoje/concluída e formulários/históricos cobertos nos recortes descritos. Zoom nativo 200 continua sem prova suportada; não é defeito nem aprovação. |
| E — RVA-03 | Inconclusivo. Sequência passiva do executor conferida; não repetida sem hipótese nova. Aceites R03/RV01 preservados. |

## Pareceres individuais

| Tarefa | Atendido/reutilizado | Impedimento atual e estado |
|---|---|---|
| CF010 | Hook compartilhado, camada/cleanup, consumidores testados; geometria/temas anteriores preservados | em_revisao: zoom nativo 200 sem prova; componente PrivacyBlur com transição residual RF15-02. Não imputar detalhes customizados CF014 ao hook sem evidência. |
| CF012 | RF15-03 encerrado, moeda negativa/extensa e privacidade acessível/reload confirmados. Filtros/paginação100, F018 e temporal anteriores conservados | em_revisao: RF15-02, exposição transitória de valores em contas. Não persiste o defeito antigo permanente da linha arquivada. |
| CF013 | DTO/civil/DEC03, fusos, PAID real e parcial, reload/competência, lista longa/foco e recuperação histórica preservados; três testes inválidos tratados | em_revisao: RF15-04 na aba aberta/meia-noite e investigação RVA-03 de recuperação pós-commit. Falta de PAID visual da revisão anterior está suprida. |
| CF014 | RF15-01 encerrado, metas hoje/concluída, formulários longos e histórico 8 verificados; nota/posição/RD58/RV24 e finanças anteriores preservadas | em_revisao: detalhes meta/hábito não fecham por Escape; operação investimento perde destino de foco. RJ02201/H24-01 continuam investigações históricas separadas CF022, sem novos experimentos ou atribuição causal. |
| CF015 | Revisão produz decisões por critério, contraprovas e evidências com banco real descartável; CF011 permanece concluída | em_revisao: RF15-02, resíduo RF15-04, resíduos CF014, zoom e RVA-03. Não aprovar por contagem de testes nem reabrir CF005–009, CF025–028 por associação. CF017 não é veto automático local. |

## Entrega e próximo passo

[Matriz final](MATRIZ.md), [achados e condições objetivas](ACHADOS.md), [decisão dos testes](TESTES-CONTESTADOS.md), [execuções](EXECUCOES.md), [imagens inspecionadas](VISUAL.md). Plano e ressalva de registro inicial em [MATRIZ-PRE](MATRIZ-PRE.md).

Próximo saneamento restrito: tornar ocultação visual imediata (RF15-02); atualizar atraso pelo calendário compartilhado em aba aberta (RF15-04); integrar detalhes meta/hábito ao controle de diálogo e definir destino persistente na transição investimento. Revalidar apenas esses caminhos com probes vermelhos e seus consumidores pertinentes. Zoom requer capacidade suportada; RVA-03 só ganha nova rodada quando houver hipótese/evento novo, sem repetir pagamentos até obter verde. Não iniciar outra auditoria global nem onboarding.

Commits locais de testes: e4b0877 (três expectativas DEC-03, histórico e contraprova isolada) e f6a91fc (probes independentes de transição, virada do dia e descarte). Evidências e pareceres são entregues em commit documental subsequente. Manifesto MANIFEST-SHA256.txt registra os bytes locais de cada artefato deste diretório, excluindo o próprio manifesto.
