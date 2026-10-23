# Saneamento dirigido CF-032 — plano anterior às correções

Base informada e conferida: `f52152324716fb241134370ee14e6adfec2fefa5`, branch
`codex/cf032-e2e-financeiro`. Produto ainda sem edição. Staging vazio; somente
README raiz preexistente modificado, SHA-256 inicial igual ao histórico
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.

## Critérios e provas preservadas

| Achado | Antes, sem alterar a prova | Correção e controles exigidos |
|---|---|---|
| CF032-01 | E2: PUT 0.01 deve retornar 400 e não persistir reserva; R1 positivo e despesa real permitida | Capacidade por fonte e união de pendências/evidências, aumento versus redução; conta/investimento, exclusão válida/inválida, limite exato, resolução parcial, move/deposit e concorrência contra confirmação |
| CF032-02 | K e R2: disponível 656, não 950, após reload/nova sessão | Usar métricas autoritativas, null/loading/erro/zero, encargos/futuras/pagamentos/créditos e atualização de consumidores, privacidade |
| CF032-03 | L: nomes visíveis/acessíveis de duas posições sem ticker; R2 prova seleção por UUID | Rótulo consistente lista/detalhe/modal/descrições, dois do mesmo tipo sem ticker e controle com ticker; texto longo, ausente, privacidade, operação e reload |
| CF032-04 | C/R3: 12:34:56 em entrada/API/SQL/XLSX | Texto HH:mm:ss no mesmo tipo de célula; segundos 00 e ausência neutra, datas civis, POI/OOXML, valores/totais/UNKNOWN preservados |

Hashes dos arquivos originais são registrados antes das execuções e conferidos ao
final. Não editar journeys.spec.ts, support.ts, oracle.json nem provas do revisor
para aceitar o produto. R2 inclui seletores de nomes defeituosos com `null`;
depois da correção de identidade esse observador precisará de adaptação numa
cópia separada: selecionar pelos nomes legítimos/UUIDs e exigir os mesmos dois
detalhes e disponível 656. Preservar original, diff e motivo; não trocar expected.

## Seleção integrada e contraprovas

Antes: C/E2/K/L e R1/R2/R3 em runtime novo com PostgreSQL descartável, preservando
falhas e estado SQL. Após: B/C/E/E2/G/H/K/L e probes independentes compatíveis;
B/C preservam contas 1286.90, investimentos 501.67, dívida 270, patrimônio 1518.57,
livre 836.90 e exportação 250.10/162.20/87.90. G e H conferem replay/isolamento nos
serviços afetados. A/F/T não serão repetidos por rotina sem risco novo concreto.

Quatro mutações numa cópia exclusiva: retirar proteção de capacidade, restaurar
apresentação antiga do limite, retirar fallback de nome, restaurar HH:mm no XLSX.
Cada uma deve falhar pelo invariante correspondente, e a fonte ser restaurada por
hash. Executar controles backend de reservas/atomicidade/concorrência, componentes
afetados, lint, typecheck e build. Não somar reruns como casos distintos.

## Limites

Somente usuários sintéticos, email/cotação externos como doubles controlados,
Next/BFF/Spring/PostgreSQL reais. Runtimes novos próprios sob
`../controle-financeiro-runtimes/CF-032/`; nenhuma alteração/limpeza de históricos,
migração antiga ou dado real. Sem push/merge/deploy, sucessoras ou autoaceite.
CF-032 permanece em_revisao; achados saneados localmente somente quando houver
prova, sempre aguardando revalidação independente. Gates anteriores preservados.
