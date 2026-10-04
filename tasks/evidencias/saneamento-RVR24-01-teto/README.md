# RVR24-01 — saneamento do teto monetário de FIN-06

04/10/2026, main, base `1e9e932bafac8a5feac3e1ee81fcb1bb08a439fc`.
[Baseline](baseline.json): staging vazio, nenhum commit posterior à revisão,
único delta README raiz. Hash preservado:
`6235da8e1d2247dad2c585fe7b2e7b0d2fd41f47414a4a2701b20f7fbf7d12ca`.
Parecer/probe localizados pelo diff1e9e932. AGENTS fornecidas pelo usuário
aplicadas; nenhum arquivo adicional encontrado na árvore/ancestrais.

## Causa, regra e escopo

decimalUnits comprovava representabilidade e matchesExecutionGross conferia
aritmética, mas nenhum impunha o teto de FIN-06. Operandos de 1 milhão cabem
individualmente; bruto1 trilhão não. O resultado passava por complete e apagava
a intenção nos três caminhos. Mesmo achado **RVR24-01**, sem novo identificador.

[Matriz contratual anterior à correção](CONTRATO.md): FIN-06 limita dinheiro
a12 inteiros e2 decimais, máximo **999999999999.99 inclusive**. Resultado do
produto é arredondado HALF_UP uma vez, depois comparado em centavos BigInt.
maxMoneyCents é99999999999999, nunca uma aproximação Number. Não há clamp,
epsilon, correção da resposta nem criação de outra identidade.

Somente creationResult.ts muda no produto. boundedUnits centraliza faixa e
escala no mesmo validador de investimento consumido por POST/retry/GET.
Complementa limites pertinentes de quantity/price informado, fees, dinheiro
conhecido do snapshot, soma bruto+taxa de BUY e taxa≤bruto nas demais modalidades.
Não reconstitui custo histórico, lucro, saldo, avaliação ou patrimônio agregado.
Null histórico e resultado negativo válido são preservados. O validador de
transação, hooks, modais, serviços backend e protocolo não foram alterados.

NG-01: SELL com amount mantém total autoritativo e preço descritivo grande ou
zero. Não aplicar teto de preço informado ao derivado. amount é lido diretamente
da string decimal canônica em centavos (inteiro ou até2 decimais), sem Number
prematuro. Formato canônico já adotado por DecimalStringDeserializer; não há
mudança do HTTP. O snapshot do recibo continua imutável, independente da posição atual.

Erro local conserva unknown/envelope/UUID/payload; não demonstra ausência de
commit. Outra start é ignorada enquanto houver intenção; GET válido posterior
encerra a pendência. Callback obsoleto continua suprimido pelo código já aceito.

Trade-off: constantes pequenas ficam privadas à fronteira financeira, evitando
três implementações divergentes e uma nova biblioteca de domínio. BigInt opera
em coeficientes limitados: execução válida até20 dígitos por operando; produto
até40. Não afirmar multiplicação universalmente O(n): tamanho é limitado pelo
contrato e pelo Number legado. amount é reconhecido por regex de comprimento
decimal limitado antes do BigInt. Sem queries, N+1, locks ou I/O adicionais.

## Quatro provas originais, antes/depois

Arquivo do revisor e cópia executada: decimal-independent.test.tsx,
SHA-256 `7b293c5a328231d950b456e95a847273e66439b22588f55026f8d1d5608bd255`.
Quatro provas estão no mesmo arquivo; o hash cobre todas as entradas/assertions,
mais21 controles. Nenhum byte do original ou da cópia foi alterado.

| Prova | Expected | Antes da correção | Depois |
|---|---|---|---|
| Parser: máximo e um centavo acima | Aceitar999999999999.99; rejeitar1000000000000.00 | Não lança no excesso | Passa |
| POST | unknown, intenção/UUID/corpo preservados | confirmed, pending/storage null | Passa |
| Retry | Mesmo comando, unknown, manter envelope | Mesmo envio, mas confirmed/remove envelope | Passa |
| GET | Identidade/kind não substituem faixa; manter envelope | confirmed/remove envelope | Passa |

[Antes](before.log):4 falhas causais/21 aprovados. [Depois](after.log):25/25.
Não houve diferença de base ou falha de ambiente mascarada como reprodução.

[Gate final](components-canonical.log): **151/151 em9 arquivos**, sem skips.
Inclui25 independentes,26 novos casos de teto e100 regressões anteriores
(89 da entrega de bruto mais11 async-state). Contagens se sobrepõem aos runs
dirigidos, não somar. Mantidas as três provas200→999, null/array/incompleto,
identidade, storage, novas intenções iguais, unmount/A→B/A→B→A/expiração,
sucesso/erro obsoletos e reconciliação ativa.

Casos novos: um centavo abaixo/no/acima do teto; produto bruto antes do
arredondamento acima do máximo mas que arredonda para ele; cruzamento do teto
por HALF_UP; teto de taxa e soma de aquisição; escala2/8; amount canônico sem
perda de dígitos; preço derivado NG-01; recuperação válida sem novo envio.
Uma fixture nova perdeu precisão como Number; falha original em [components.log](components.log)
e demonstração anterior à correção em [FIXTURE](FIXTURE.md). Segundo gate149/149
em [components-final.log](components-final.log), depois ampliado com formato
canônico:151/151. Nenhuma assertion independente foi enfraquecida.

## Integração dirigida realizada agora

Reutiliza harness da entrega e069e33 em pasta nova. [Script](run-integration.ps1),
[spec efetivo de origem](gross.integrated.spec.ts), [runner isolado](Rv24CreationBrowserIntegrationTest.java).
PostgreSQL16 descartável/Flyway reais; e-mail/mercado doubles. JDK21 externo a
target; backend copiado para TEMP sem mutar a árvore principal. Endpoint SQL
de leitura só no teste, filtrado pelo owner autenticado.

BUY2×100 válido e commit real200; route.fetch confirma a resposta legítima e
somente route.fulfill entrega total1000000000000 ao browser. GET autenticado
também é adulterado no harness. Ambas respostas mantêm modal/pending e submit
bloqueado. GET válido posterior, reload e nova leitura conservam quantidade12.
[Resultado](integration/result.json):1 runner Java/1 jornada Chromium passam.
[Três checkpoints SQL](integration/browser/sql-checkpoints.json) e [oráculo final](integration/browser/postgres-oracles.txt):
**um POST**, UUID `9b6c577b-bed3-4bb2-830f-3a1db8b44959`, uma operação200, um
recibo200, um lançamento200 e saldo800 em todas as fases. GET não é mutação.
Não se enviou operação proibida ao banco; não se demonstra emissão desse DTO
pelo servidor. O excesso no cenário integrado também viola coerência com o
comando200; os quatro probes independentes isolam causalmente a guarda do teto.

A integração precede somente o refinamento do formato canônico de amount;
usa BUY sem amount, ramo preservado byte a byte nesse refinamento. Gate final
de componentes/typecheck/lint/build inclui o parser canônico. Não houve motivo
para repetir toda a auditoria backend. Nenhum ECONNRESET reapareceu; isso não
encerra a hipótese histórica. Sem retries/sleeps/timeout aumentado ou mutações.

## Gates, reprodução e limites

Frontend: `node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts`
com decimal-independent, rv24-ceiling, financial-result-review, rv24-gross,
rv24-residual, rv24-independent-review, rv24-creation-intent, temporal-forms,
async-state (todos em tests/component/*.test.tsx).
`node node_modules/typescript/bin/tsc --noEmit --incremental false`;
`node node_modules/eslint/bin/eslint.js --format json --output-file <log>`;
`node node_modules/next/dist/bin/next build`.
Resultados finais em [static-final](static-final.json), [lint](lint-final.json),
[typecheck](typecheck-final.log), [build](build-final-result.json)/[log](build-final.log).
Build com rede autorizada para fontes Google; sem edição de configuração.
Integração: `run-integration.ps1 -RunName <nome-novo>`; não sobrescrever runs.

Number legado não representa o último1e-8 junto a12 inteiros; não fingir precisão
recuperada. Teto e centavos monetários são comparados exatamente após ler sua
representação decimal; amount string nunca é convertido primeiro a Number.
Não há certificação de todos os navegadores/modalidades, corte TCP físico,
zoom, matriz visual, agregados, produção ou banco real. Captura é auxiliar.
Logs anteriores são históricos; estes runs são novos, não recuperação do incidente
target. Nenhum clean/reset/remoção ampla, push, deploy ou CF-028 executado.

RV24-01 permanece em_revisao pelo critério4; CF-009 pelo critério2.
Não há autoaprovação. CF025/026/027, RVR24-02, RV24-02 e correção aritmética
anterior preservadas. RVA-03, RJ-022-01/H24-01 e ECONNRESET permanecem separados.

[Encaminhamento ao mesmo revisor](ENCAMINHAMENTO.md), com intervalo funcional
e critérios objetivos. [Verificador](verify-delivery.cjs)/[resultado](verification.json)
conferem hashes, estados/dependências/checklists, fontes backend da cópia e gates.
Sanitização registra hashes original/publicado; não altera valores financeiros.
Logs brutos preservam espaços finais emitidos pelas ferramentas; diff-check de
código/documentação aprovado, sem editar logs para estética. Atributos Git desta
pasta preservam os bytes das evidências em novos checkouts.
