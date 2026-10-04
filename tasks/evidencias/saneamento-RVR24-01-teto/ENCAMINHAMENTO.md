# Ao revisor independente — mesmo RVR24-01, teto FIN-06

Base: `1e9e932bafac8a5feac3e1ee81fcb1bb08a439fc`.
Funcional: `c702739070fcd544537aa9df509e0ba4e3b7c19b`.
Intervalo exato:
`1e9e932bafac8a5feac3e1ee81fcb1bb08a439fc..c702739070fcd544537aa9df509e0ba4e3b7c19b`.
Documentação/evidências: commit que adiciona este arquivo, filho do funcional;
hash final informado no chat e resolvível por `git log --diff-filter=A --format=%H -- tasks/evidencias/saneamento-RVR24-01-teto/ENCAMINHAMENTO.md`.

Arquivos funcionais: creationResult.ts, decimal-independent.test.tsx (cópia
intacta) e rv24-ceiling.test.tsx. Backend, hooks, modais, schema, fingerprints,
snapshots e protocolo permanecem inalterados. Duas tarefas recebem somente
nota de entrega, sem mudar estados, critérios, checkboxes ou dependências.

Revalidar somente o achado [RVR24-01](../revalidacao-RVR24-01-bruto/ACHADOS.md):

1. Conferir a [matriz normativa](CONTRATO.md): teto inclusivo monetário
   999999999999.99; escala2 e comparação exata em centavos após HALF_UP do
   produto. Quantity/price informado:12 inteiros/escala8. Taxas, aquisição e
   dinheiro conhecido do snapshot têm guardas locais explicitadas na matriz.
   NG-01 mantém amount autoritativo e preço derivado fora do teto de preço informado.
2. Rodar os quatro vermelhos originais, no arquivo decimal-independent.test.tsx:
   parser máximo/centavo acima e POST/retry/GET. Hash preservado
   `7b293c5a328231d950b456e95a847273e66439b22588f55026f8d1d5608bd255`.
   [Antes](before.log):4 falhas/21 controles verdes; [depois](after.log):25 verdes.
3. Complementos rv24-ceiling: abaixo/no/acima do teto, arredondamento atravessando
   o limite, escala e formato, amount exato, taxas, valores históricos, UUID/corpo
   preservados, start bloqueada e GET válido posterior. Regressão final151/151
   inclui os três200→999 e os casos já aceitos de ciclo/owner/callback/recuperação.
4. [Integração nova](integration/browser/sql-checkpoints.json): BUY200 real,
   POST/GET adulterados1000000000000 apenas no harness, intenção preservada;
   GET válido/reload encerram pendência. Um POST, operação200, recibo200,
   débito200 e saldo800; UUID comparado ao efetivamente enviado. Não houve
   operação proibida no banco. Probes isolam a falta de teto; integração
   comprova o fluxo de recuperação, também protegido pela coerência aritmética.

Critérios objetivos: resposta fora da faixa nunca confirma/remove intenção;
limite inclusivo e valores contratuais inferiores continuam aceitos; nenhum
arredondamento/truncamento de entrada para caber; NG-01 e payload original
preservados; recuperação legítima sem novo efeito e sem callback obsoleto.

**RV24-01/critério4 e CF-009/critério2 seguem aguardando seu julgamento**.
Os demais critérios e CF025/026/027, RVR24-02 e RV24-02 mantêm seus aceites.
Não solicitar auditoria geral nem concluir CF-009 por associação. CF-028 não
executada. Investigações históricas preservadas, sem novo bloqueio demonstrado.
Limites: Number legado não restitui dígitos perdidos; amount string é exato;
uma jornada Chromium, sem todos os browsers/modalidades ou banco real.
