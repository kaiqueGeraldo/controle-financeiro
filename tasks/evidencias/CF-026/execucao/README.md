# CF-026 — entrega local de lint e tipagem

- Data de referência: 01/10/2026, America/Sao_Paulo.
- Estado: `em_revisao`; implementação/validação do executor entregues, sem revisão independente nesta execução.
- Base: `5f26a1d56f94a21d75e67c375ea9095aaec3a79f`, branch `main`.
- Executor: Codex da sessão atual, sem subagentes ou troca de modelo.
- Runtime: Windows, Node v24.18.0, ESLint 9.39.2, Next 16.1.6, Vitest 4.1.11; dependências já instaladas, sem instalação/upgrade.
- Prontidão: liberação independente residual em `0099185`, reconferida em `5f26a1d`; CF-009/015 permanecem em revisão nos seus escopos.
- Alteração alheia: somente README raiz, SHA-256 `6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`, preservado e fora do staging.

## Critérios, oráculos e decisões de fronteira

CF-026 exige contratos explícitos/narrowing, zero violações injustificadas, preservação
de efeitos e provas de atualização/cleanup. HTTP-CONTRACT/CF-008 define mensagem
textual de erro; SPEC-004 preserva destinação/progresso e não autoriza alterar regras
financeiras nesta manutenção. `GoalDepositDTO.java` admite `EvolutionProtocol`:
o tipo frontend agora declara o campo que o formulário já enviava.

Para JSON de preferências, o contrato de apresentação exige IDs reconhecidos,
booleanos e larguras permitidas por cartão. Resultado válido mantém ordem,
visibilidade e largura. JSON inválido/não-array e membros não-objeto não são
configurações: usar os defaults de apresentação. Campos inválidos de um ID conhecido
usam o default daquele campo, extras não são reenviados, IDs desconhecidos são
descartados e ausentes são completados. Duplicados mantêm a primeira entrada,
evitando identidades React repetidas. São decisões de recuperação de dados
malformados, sem novo comportamento financeiro. Testes usam arrays/payloads
literais, sem importar o parser/DEFAULT_CONFIG para construir expected.

| Critério | Cenário e oracle independente | Prova |
|---|---|---|
| Zero lint sem esconder arquivos | Mesmos 234 alvos anteriores + helper/teste novos, regras/exclusões inalteradas | [Comparação](lint-comparacao.json): 23/21 → 0/0, nenhum arquivo removido |
| Narrowing de preferências | null/objeto/número/array malformado, booleano falso, span permitido, double encoding, update e duplicados | Base original isolada: seis falhas de parser/payload; candidato aprovado |
| Narrowing de erro | null/número em message não pode lançar ou renderizar conteúdo inválido; fallback textual; Error legítimo preservado | Base original: três falhas; candidato aprovado |
| DTO/efeitos preservados | Progresso numérico envia protocolo integral e mantém texto JSX/callbacks; reorder envia IDs e permite retry depois da rejeição | Testes reais dos componentes, mocks só nas fronteiras dos serviços |
| Hooks/sessão/cleanup | A→B→A, mesma chave atual permanece bloqueada, resultado antigo não dispara callback/toast; unmount descarta sucesso/erro tardios | Quatro mutações detectadas, restauração aprovada; consumidores assíncronos reais também testados |
| Compilação e consumidores | Tipos estritos, produção compilada, formulários/hábitos/sessão/planejamento/configurações | Typecheck, build, 180 componentes e 18 execuções unitárias aprovados |

A chamada de releitura via `onSuccess` no conflito 409 do aporte é caracterização
de preservação de efeito exigida por CF-026: o manager usa esse callback para
refresh. Não foi promovida a prova de sucesso financeiro ou aprovação de todos
os contratos de erro de CF-009. Modal não fecha e não há toast de sucesso nesse caso.

## Correções e validação por lote

1. Bindings ociosos: remover somente parâmetro de catch/import de função não usada,
   mantendo await, refreshFinance, callbacks, toast, logs utilizados e finally.
   `NewHabitModalProps` passa a tipar o componente; textos JSX mantêm aspas visíveis.
   [41 testes selecionados](lote1-componentes.log) aprovados.
2. Contratos: erros como unknown + narrowing compartilhado; aporte/protocolo tipado;
   ReorderModal genérico com identidade string; callback de hábito limitado a
   name/description, datas string/tupla civil e ícones com LucideProps; evento React
   tipado. Parser de configuração fora do componente, sem casts. [49 testes](lote2-componentes-corrigido.log)
   aprovados antes da ampliação final das bordas.
3. Cleanup: efeito captura a instância do Map, sem alterar geração, scope, token,
   Promise compartilhada, lock imediato, rollback ou callback. [42 testes dirigidos](lote3-componentes.log)
   aprovados. Nenhuma arquitetura de estado compartilhado foi substituída.

No teste existente async-state, somente parâmetros não usados foram removidos e
os três genéricos da mutação tornaram-se explícitos. Assertions/oráculos estão
intactos. A exceção de caminho de testes foi registrada na tarefa antes da edição.

## Comandos finais e resultados

Executados do frontend; CLIs locais equivalentes aos scripts package.json
porque o atalho npm do ambiente aponta para módulo ausente (preparação histórica).

```powershell
node node_modules/eslint/bin/eslint.js --format json --output-file ../tasks/evidencias/CF-026/execucao/lint-final-ampliado.json
node node_modules/typescript/bin/tsc --noEmit --incremental false
node scripts/test.mjs
node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts
node node_modules/next/dist/bin/next build
```

| Execução | Saída | Resultado/artefato |
|---|---:|---|
| Lint anterior | 1 | [23 erros/21 avisos, 234 arquivos](lint-antes.json) |
| Componentes anteriores | 0 | [157 testes/36 arquivos](componentes-antes.log) |
| Lint final | 0 | [0 erros/0 avisos, 236 arquivos](lint-final-ampliado.json) |
| Typecheck final | 0 | [Log](typecheck-final-ampliado.log) |
| Unitários | 0 | [6 casos em São Paulo, UTC e Pacific/Kiritimati](unitarios-final.log), 18 execuções |
| Componentes finais | 0 | [180 testes/37 arquivos](componentes-final-ampliado.log), incluindo 23 novos |
| Build primeira tentativa | 1 | [Falha de rede ao buscar Geist/Geist Mono](build-final.log) |
| Mesmo build com rede autorizada | 0 | [Compilação, TypeScript e 14 páginas](build-rede-autorizada.log) |

Build usou fontes/configuração existentes; nenhum workaround/mock de fonte.
Os quatro últimos testes adicionados não alteraram produto/dependências após
o build: source hashes idênticos, com novo typecheck/lint/suíte final.
Aviso de depreciação middleware→proxy preexistente mantido, fora deste lote.
Layer de componente: jsdom, fixtures sintéticas com IDs cf026, sem API real.
Os testes novos não dependem de data atual; suíte existente conserva seus relógios
controlados. Metadados do harness: seed cf001-v1, fuso America/Sao_Paulo.

## Contraprovas isoladas e primeiras tentativas

Da raiz: `node tasks/evidencias/CF-026/execucao/verify-regressions.mjs`.
O [script](verify-regressions.mjs) copia três fontes da base original para TEMP,
usa alias restrito a essas fontes e junction para as dependências instaladas.
Não substitui regras/mocks centrais nem modifica o checkout.

- [Original isolado](original-isolado-red.log): **9 falhas/14 aprovações**. Causas:
  filter em null/não-array, id em membro null, payload malformado/duplicado,
  message não textual e leitura de propriedades em rejeição null. Não são erros de import.
- [Candidato na mesma cópia](original-isolado-restaurado.log): **23 aprovações**.
- [Mutação](mutacao-geracao.patch): retira incrementos de geração, preservando demais
  colaboradores. [Quatro falhas por callbacks antigos](mutacao-geracao-red.log).
- [Restauração](mutacao-geracao-restaurada.log): quatro aprovações. Os 19 casos
  não selecionados pelo filtro CLI `-t cleanup` não estão skipped no código nem
  no gate completo. [Hashes](regressoes.json) provam checkout preservado e cópia restaurada.

Primeiras tentativas preservadas, sem alegar vermelho causal de produto:

- [Harness inicial interrompido](contratos-red.log): mock de useUser criava
  identidade nova por render e disparava reset contínuo. Mock passou a usar fixture estável.
- [Red misto inicial](contratos-red-corrigido.log) e [lote 2](lote2-componentes.log):
  formulários em portal foram procurados no container. Correção usa o form do
  botão efetivamente apresentado; expected e assertions de negócio preservados.
- [Typecheck intermediário](typecheck-lote2.log): import Sunrise removido indevidamente
  e fixture de resposta incompleta. Import restaurado, interface realmente ociosa
  usada, fixture tipada com Usuario completo; nenhum cast para contornar.
- [Isolamento inicial](regressoes-ambiente.json): import não resolvido em TEMP.
  [Logs](original-isolado-red-ambiente.log), [restaurado](original-isolado-restaurado-ambiente.log).
  Junction resolve os mesmos pacotes; o script agora recusa execução sem testes.
  Rodadas válidas posteriores de 19 casos também permanecem nos artefatos com sufixo -19/-2.

## Revisão do diff, custo e limites

Checklist da skill vercel:react-best-practices aplicado: funções puras fora do
componente, tipos sem casts cegos, dependências/cleanup preservados, nenhum novo
fetch/listener, nenhuma alteração de labels/geometry nos dados válidos. Config
tem sete cartões fixos; parsing/validação O(N) no número de entradas, busca
limitada a sete, saída O(1). Reorder continua O(N) em IDs/memória. Operações e
locks do hook continuam O(1) médio por chave, memória O(K) pendentes; não substituem
idempotência de backend. Tuplas/datas preservam apresentação civil de hábitos.

Trade-off: validar dados na fronteira evita renderização inválida, mas recupera
configurações malformadas com defaults; dados válidos não perdem ordem/visibilidade.
Helper pequeno de erros centraliza apenas narrowing textual; não conhece negócio,
transporte/retries nem muda ownership. Nenhuma query/backend alterado; N+1 e
concorrência de banco continuam nos seus donos.

Não houve E2E integrado, banco, manual/visual, zoom nativo, migração, push ou deploy.
Não se encerram RV24-01/02, RVA-03, RJ-022-01/H24-01, adoção CF-017 ou os aceites
CF-005–015. A revisão aqui é do executor; falta revisão independente do candidato.
**Nenhuma tarefa seguinte integralmente liberada**: CF-032/034 mantêm suas
dependências e exigência de aceite aplicável. Próximo trabalho liberado é a
revisão do candidato CF-026. [Manifesto](manifesto-validado.json) identifica os
236 arquivos medidos por SHA-256; [verificador](verify-delivery.mjs) confirma
48 links locais, 96 chamadas de assertion históricas intactas, ausência de
skip/only nos testes novos, configuração/dependências e README raiz preservados.
O diff real do commit contém as fontes/testes correspondentes. `git diff --check`
aprovado antes do staging; staging explícito limitado à CF-026.
Whitespace final de dois logs de terminal foi normalizado após a primeira inspeção
do staging; conteúdo diagnóstico, resultados e códigos de saída preservados.
