# Matriz independente de critérios — 16/10/2026

Candidato18c7150, base8a83c35. Provas reutilizadas são aceites independentes,
não novas execuções. Não se infere conclusão da tarefa apenas de checkbox.

| Tarefa / critério integral | Evidência rastreável e alcance | Decisão |
|---|---|---|
| CF019/1 soma exata, competência e limite CF016 | [Revisão46d9fad](../revisao-CF-018-CF-021/README.md): B19, DEC03/fronteiras29–31/bissexto e mutação M1 detecta centavo; [consolidação independente9ff1aec](../revisao-CF-022-CF-023/MATRIZ-ESTADOS.md), núcleo aceito. RF15 acrescenta datas persistidas, sem redefinir algoritmo. | Atendido, aceite preservado |
| CF019/2 débito/obrigação uma vez, sem repetir baixa | [Revalidação3d64e7a](../revalidacao-CF-016-CF-021/README.md): RVI11/12, SAN-D1 e intenção/recibo; [CF024 dbf828e](../revisao-CF-024/README.md), protocolo e concorrência. Ressalva RVA03 resolvida pela contraprova própria e SQL/recibo/reload desta revisão. | Atendido; não confundir requests de replay com novos efeitos |
| CF019/3 retry cron sem duplicar e rollback intermediário | B19/trigger/threads nas revisões46d9fad e3d64e7a, reafirmados na matriz9ff1aec. Nenhuma alteração de cron/pagamento no candidato. Os testes backend posteriores RF15 cobrem consumidores da alteração closingDate. | Atendido, não é certificação operacional de scheduler real |
| CF019/4 provas, limites, sensibilidade | M1 histórica; contraprova clock antigo120 mantém falha visual em15s com880/0; Date-only fecha sem alterar expected. Logs inclusive falhas, SQL, fontes e capturas preservados. | Atendido; **CF019 concluida** no escopo local entregue |
| CF013/1 competência, datas, status API/reload | [RF15 db2d77d](../revalidacao-RF15/MATRIZ.md): vazia/aberta/parcial e PAID real, três fusos, DEC03; [residual a991114](../revalidacao-residual-RF15/MATRIZ.md): meia-noite/foco/visibilidade, competência preservada. Run02 confirma OPEN com pagável0 para adiantamento, sem substituí-lo por PAID. | Atendido |
| CF013/2 valores extensos/lista longa/ação mobile | [Fechamento11/10](../fechamento-CF-010-CF-015/MATRIZ.md):12 lançamentos1234,56, total14814,72, CTA/Tab/Escape/modal aninhado; matriz RF15/residual preserva aceite. Zoom nativo é obrigação compartilhada CF010/015, não evidência alegada aqui. | Atendido no critério próprio |
| CF013/3 falha/conflito recuperável e snapshot ligado ao defeito | [R03/RV01 f550b9e..e4079a9](../revalidacao-CF-015-RV01/README.md): mutações detectam falso sucesso, recuperação por leitura sem novo POST; R05/R06/ownership já aceitos. RVA03: imagem original + contraprova React/WAAPI + Date-only com clique/reload nesta revisão. | Atendido; ressalva histórica explícita |
| CF013/4 provas/limites sem enfraquecimento | Matrizes RF15/residual + presente registro. Nenhum expected financeiro removido; sincronização visual suplementar aguarda conteúdo, opacity e frames. | Atendido; **CF013 concluida** |
| CF015/1 nenhum P0/P1 sem correção ou decisão explícita | RF15-01–04 encerrados nas revisões próprias; CF011/012 preservadas, CF014 concluída em revisão independente31e6fe2 com complementos. RVA03 encerrada aqui. Zoom continua verificação faltante, não P0/P1 inventado. | Critério de decisão atendido; não aprova marco |
| CF015/2 testes sensíveis a defeitos temporais/estado | Mutações R03/RV01, RD58 e CF014 conservadas; contraprova desta revisão detecta saída retida apesar de200/SQL correto. Falha CSS da preparação não conta como detector RVA03. | Atendido no conjunto representativo |
| CF015/3 distinguir automação, funcional/visual e não executados | Chromium automatizado integrado; inspeção visual pelo revisor das imagens selecionadas; nenhum ensaio manual de zoom. Demais timeouts/imagens antigas não encerrados por associação. | Atendido como relatório |
| CF015/4 evidências/limites sem enfraquecimento | Logs de preparação inválida e rodada causal, diagnóstico de scanner, verificador e preservação. Nenhum retry automático/timeout maior/animação desligada para aceite causal. | Atendido documentalmente; **CF015 em_revisao** |

## Dependências e integração

- CF019: CF006 concluída em [RD58/0c068d9](../revalidacao-RD58/README.md);
  CF016/018 concluídas pela matriz9ff1aec. CF017 oferece fundação local V1–V14,
  upgrade/restore descartável aceitos em bcec50c e reconferidos em d806f82;
  [RV17-01/P2](../revalidacao-RV17-01-P2/README.md),6e64aad, encerra procedimento
  documental. CF017/P01/P02 continuam pendentes de adoção real.
- CF013: CF005 concluída em RD58, CF008 na revisão dirigida CF005–008;
  CF010 fornece componentes/foco/scroll já aceitos. Sua parcela zoom permanece
  no marco compartilhado; não reabre os critérios próprios aceitos de CF013.
- CF015: CF007/008, CF009/RV24, CF011/012 e CF014 têm aceites posteriores
  rastreados em tasks/README e nas matrizes RF15/CF014. Recebe CF013 concluída.
  A obrigação de zoom continua necessária para aprovação integral.
- Bases citadas são ancestrais de18c7150. Deltas relevantes de pagamento são
  reconferidos em MECANISMO.md/source-comparison.json; candidato muda só testes
  e documentos. Nenhuma nova aprovação de migração, produção ou banco existente.

## Única pendência deste marco e próximo trabalho

**CF010/CF015: zoom nativo200%**. Falta evidência de zoom real, reflow, sobreposição
e alcance das ações. Impacto: impede aceite integral/publicação do marco; não
impede genericamente desenvolvimento local independente. Próxima ação: ensaio
nativo200% com prova do zoom e inspeção das telas/ações exigidas. Viewport, DPR,
CSS scale e screenshots atuais não substituem. Não executado neste recorte.

CF029 conserva prontidão **exclusivamente local/descartável**, já concedida pelo
parecer CF017: depende de CF017/023/028, não de nova aprovação deste pagamento.
CF028 é especificação concluída; CF023 isolamento/sessão aceitos; fundação não
mudou no intervalo. Esta revisão não inicia onboarding nem libera finalização
CF030, sucessoras ou publicação. CF022/RJ-022-01/H24-01 continuam separados.
