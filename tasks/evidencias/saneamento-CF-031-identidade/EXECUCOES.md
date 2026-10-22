# Execuções do saneamento residual RC031-02

22/10/2026. Comandos abaixo executados a partir de
`controle-financeiro-frontend`, usando `C:/Program Files/nodejs/node.exe`.
Logs vazios de lint/typecheck significam ausência de diagnósticos; as saídas finais
desses processos foram 0. Nenhum teste original foi editado.

| Comando após `node` | Log | Saída e resultado |
|---|---|---|
| `node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revalidacao-CF-031-RC031/independent.config.mts` | [antes](independent-before.log), [depois](independent-after.log) | Base: 1, 7 passam/2 falham; candidato: 0, 9/9 |
| `node_modules/vitest/vitest.mjs run --config src/screens/private/onboarding/vitest.config.mts` | [entrega](directed-delivery.log) | 0, 160/160, incluindo os 22 novos controles |
| `node_modules/vitest/vitest.mjs run --config ../tasks/evidencias/revisao-CF-031/probes.config.mts` | [probes anteriores](original-probes.log) | 0, 7/7; mantém controles de RC031-01 |
| `node_modules/eslint/bin/eslint.js .` | [lint](lint.log) | 0 |
| `node_modules/eslint/bin/eslint.js src/services/onboarding/identity-remediation.test.tsx` | [lint final dos controles](lint-controls-final.log) | 0, após correção da chamada tipada de teste |
| `node_modules/typescript/bin/tsc --noEmit` | [tipos finais](typecheck-final.log) | 0 |
| `scripts/test.mjs` | [datas](unit.log) | 0, os mesmos 6 casos em São Paulo, UTC e Kiritimati |
| `node_modules/next/dist/bin/next build` | [build](build.log) | 0, rota /onboarding gerada |

160 = 138 testes preservados + 22 novos. Os 149 da cópia isolada são os testes de
serviços desse conjunto, excluindo 11 testes de tela; incluem os controles de
componentes novos hospedados no arquivo de serviço. Os 22 estão contidos nos 149
e nos 160. Não somar essas rodadas como casos distintos. Os 6 temporais são
reexecutados em três fusos, sem contabilizar 18 casos distintos.

## Falhas intermediárias preservadas

- [controls-before.log](controls-before.log): 14 passam/8 falham na primeira
  versão dos controles novos. Há uso indevido de matchers jest-dom indisponíveis;
  essa rodada sozinha não prova oito falhas causais. Texto inicial preservado em
  [identity-controls.initial.txt](identity-controls.initial.txt).
- [controls-after.log](controls-after.log): 20 passam/2 falham, ainda pelos matchers
  indisponíveis. Corrigido o harness para APIs existentes: valor nativo do select,
  busca acessível e visibilidade por CSS. As expectativas de identidade/rótulo
  foram mantidas, sem timeout maior ou teste ignorado.
- [directed-final.log](directed-final.log): 160/160 antes da correção de tipagem
  das opções de busca. [typecheck.log](typecheck.log) apontou duas ocorrências de
  `exact` em `getByRole`, opção de outra API; nomes passaram a regex ancorada.
  Tipos e suíte de entrega foram reexecutados após esse ajuste.
- [controls-baseline-corrected-harness.log](controls-baseline-corrected-harness.log):
  controles finais contra as cinco fontes de produto de `75ede48`, em cópia
  isolada: 14 passam/8 falham por comportamento de identidade. Fecha a lacuna da
  primeira rodada; não modifica o baseline nem os probes independentes.

Não houve mudança de assertions nos nove probes independentes. Os dois residuais
falham antes e passam depois; hashes em [initial.json](initial.json) e preservação
em [preservation.json](preservation.json).

## Contraprova isolada

[counterproofs.ps1](counterproofs.ps1) cria diretório temporário exclusivo e copia
210 fontes do frontend. Junctions dão acesso somente às dependências e fixtures;
as cinco sobreposições de baseline e a mutação atingem arquivos copiados. O
baseline vem de `git show 75ede48`, sem checkout ou alteração da branch.

Execução realizada a partir da raiz:

```powershell
& tasks/evidencias/saneamento-CF-031-identidade/counterproofs.ps1
```

Para reexecutar sem sobrescrever esta evidência, copie o script para uma nova pasta
em `tasks/evidencias/` (mesma profundidade) e execute essa cópia. Ele grava os logs
ao lado do script. Não limpe a pasta original nem remova a cópia temporária com
operações sobre junctions.

| Etapa | Resultado |
|---|---|
| Controle antes | [149/149](counterproof-control-before.log), saída 0 |
| Mutação: `refKey` volta a `r.id ?? r.tempId` | [6 falhas/16 passam](mutation-inherited-identity-precedence.log), saída 1 com AssertionError |
| Restauração em finally | [149/149](counterproof-control-restored.log), saída 0 |
| Integridade da cópia | 210 arquivos comparados por SHA-256, zero diferenças |

O filtro `-t 'reference identity uses the validated own member'` seleciona 22
controles; os 127 restantes aparecem como skipped somente por esse filtro, sem
alteração de `skip` no código. [Diff da mutação](mutation-inherited-identity-precedence.diff),
[resultado](counterproof-results.json), [manifesto da cópia](counterproof-source-sha256.json)
e [caminho da cópia](counterproof-path.txt) preservados.

## Proporcionalidade e limites

Sem alteração de flow, client, hook, transporte, protocolo ou aplicação financeira.
A rejeição na leitura e posterior recuperação do mesmo recibo é exercitada com
`parseSession` real e colaborador get em memória, sem prepare/complete. Não é uma
jornada HTTP/SQL. JSON bruto é testado separadamente com o leitor real vendorizado.
As 12 jornadas reais da revalidação anterior não foram repetidas nem somadas a
esta execução; não há nova conclusão sobre loading/sessão ou efeito no banco.

Não foi reexecutada a suíte ampla histórica de 441 casos. A seleção cobre o delta
e os controles essenciais já aceitos, incluindo RC031-01, precisão, estados,
snapshots, recuperação, identidade da operação e vetores de hash. Avisos do build
sobre a convenção middleware e dos testes Node sobre tipo de módulo foram mantidos
nos logs; não impediram conclusão dos processos. Nenhum deploy ou banco real.
