# Saneamento residual RV24-01 e reconciliação documental

Execução iniciada em 02/10/2026, retomada em 03/10/2026 (America/Sao_Paulo),
base `a8c3724`, main. [Baseline](baseline.json) registra HEAD, status, commits,
hash do README alheio e prova independente. Nenhum subagente, nova auditoria
integral, CF-028+, push, deploy, banco real, clean ou reescrita de histórico.
Código novo é **entrega do executor**, não aprovação independente.

## Correções, contratos e custos

RVR24-01: o hook confirmava qualquer resolução de send e o GET validava apenas
o envelope/objeto. `creationResult.ts` valida o resultado financeiro necessário
antes de complete, tanto no POST/retry quanto no GET. UUID do fato, tipo, data,
campos numéricos finitos e correspondência com comando são conferidos. Transação
confere conta/categoria/descrição/valor/estado; transferência confere a perna e
destino. Seu operationId de ledger **não** é a chave da intenção de transporte.
Investimento confere quantidade/preço/taxas e metadados do resultado; resgate
monetário usa amount, pois quantidade/preço são derivados pelo servidor.
Custo/resultado histórico null permanece válido. Preço descritivo de resgate
pode arredondar a zero na escala8; teste dirigido conserva esse caso legítimo.

Fontes: TransactionResponseDTO/InvestTransactionResponseDTO e serviços Java,
DEC-10 em [CF-024/CONTRATO](../CF-024/CONTRATO.md), HTTP-CONTRACT e ACHADOS da
revalidação. O validador não recalcula saldo/custo nem tenta validar todo payload
de apresentação do projeto. A validação fica na fronteira comum do hook e da
recuperação; investmentService continua transporte, sem duplicar regras ou
introduzir dependência circular. Resultado inválido lança erro local, mantém
identidade/corpo e estado desconhecido; não vira rejeição financeira definitiva.
O cast anterior do envelope salvo não substitui a nova validação de resposta.

RVR24-02: false misturava pendência/falha com invalidação, e OperationModal
reconciliava qualquer false. Agora os resultados são confirmed, unknown,
rejected, obsolete e ignored. Somente confirmed autoriza sucesso/fechamento;
unknown/rejected ativos conservam a reconciliação necessária do consumidor.
Geração captura o ciclo; invalidação impede sucesso, erro, complete e liberação
de busy de execução antiga. Cleanup em layout effect acompanha o commit de
troca de owner; reativação/StrictMode não ressuscita a geração anterior.

Trade-off: cancelamento é lógico, não rollback nem abort do dinheiro no servidor.
Não se apaga a intenção de A na troca para B; voltar a A permite recuperar a
intenção, sem callbacks do store antigo. sessionStorage mantém limite por aba
e por owner/kind; perder também o ID exige conferir histórico. Não há garantia
inventada entre dispositivos. Geração/validação de número fixo de campos O(1)
(strings O(L)); serialização e armazenamento O(L) por comando, sem query nova,
N+1 ou mudança de locks/transações backend. Regras e retenção DEC-10 intactas.

## Evidências e execução

| Prova | Resultado / artefato |
|---|---|
| Reprodução anterior, seis casos independentes | Cinco falhas causais, um verde; [log](independent-before.log) |
| Primeira execução após correção | Seis independentes passam; duas fixtures antigas falham, documentadas antes da correção em [FIXTURES](FIXTURES.md); [log](first-after.log) |
| Regressão completa de componentes | 236/236, 42 arquivos, zero skips; [log](components-final.log) |
| Último ajuste de resgate monetário | 63/63, quatro arquivos, em [directed-final.log](directed-final.log); suíte completa anterior só difere pela aceitação de preço descritivo zero no resgate |
| Typecheck/lint | Typecheck final exit0; lint247 arquivos, zero erros/avisos. [Typecheck](typecheck-final.log), [lint](lint-final.json) |
| Build | Primeira tentativa falhou no download de fontes externas ([log](build.log)); build com rede autorizado passou ([log](build-network.log)). [Build final aprovado](build-final.log) após ajuste |
| Integração sem resposta inválida | 35 testes Java, zero falhas/skips, incluindo runner de seis jornadas browser; CF-02430 + intenção4. [Resultado](integration-valid/result.json), [SQL](integration-valid/browser/postgres-oracles.txt) |
| Integração com resposta inválida | Seis jornadas browser aprovadas no runner Java (1/1), zero skips. POST real com commit antes da corrupção null/array, GET real com result vazio, posterior recuperação/retry. [Resultado](integration-invalid/result.json), [SQL](integration-invalid/browser/postgres-oracles.txt) |

As contagens se sobrepõem: não somar 236 com os subconjuntos ou contar runner
Java como jornada extra. Prova do revisor original e cópia executada têm SHA-256
`b58841ad01232c87d6edaa022226f5daf71775b5c77430eb9a1b9f40739620ec`.
Nenhuma assertion original foi enfraquecida. A sexta prova antiga de storage
passava antes; após o parser, precisou complemento com DTO válido e assertion
de chamada a removeItem para continuar comprovando aquele ramo.

Runtime existente: Node24.18.0, Vitest4.1.11, Next16.1.6, JDK21 restaurado,
Maven wrapper e PostgreSQL16-alpine/Testcontainers. Fixtures sintéticas,
email/mercado externos em doubles. `run-integration.ps1 -RunName <novo>`
usa cópia backend temporária e spec independente publicado; `-InvalidResponses`
habilita a variante nova. Sem retry/sleep/aumento de timeout. O destino não pode
existir: cada run conserva sua proveniência. Artefatos duráveis ficam nesta pasta.

Comandos frontend (cwd controle-financeiro-frontend): `node node_modules/vitest/vitest.mjs run --config tests/component/vitest.config.mts`,
`node node_modules/typescript/bin/tsc --noEmit --incremental false`,
`node node_modules/eslint/bin/eslint.js --format json --output-file <arquivo>`,
`node node_modules/next/dist/bin/next build`. CLI local usada porque o atalho npm
do ambiente tem histórico de módulo ausente. Uma tentativa inicial de consultar
versão do Vitest na raiz não encontrou módulo; a reprodução executada no frontend
é a prova causal, não esse erro de caminho.

## Estados e revisão

[Matriz de reconciliação](../consolidacao-CF-001-CF-026/RECONCILIACAO-CF-001-CF-027.md):
nenhuma conclusão nova; dez concluídas preservadas, dezessete em revisão com
pendências específicas. CF-025/026/027 e este saneamento aguardam revisão
independente. RV24-02 permanece concluída por 40e07ef. Liberações locais
delimitadas CF-025/026/027 preservadas; não equivalem a publicação nem a CF-028.

[Encaminhamento](ENCAMINHAMENTO.md) separa cada frente, os intervalos/arquivos,
testes, lacunas e efeitos nas dependências. RVA-03, RJ-022-01/H24-01 e H-RV24-01
ECONNRESET continuam inconclusivos; RV17-01/02, adoção real, matriz visual e zoom
continuam com seus donos. Não se afirma ausência total de bugs.

O incidente target da CF-027 foi lido e preservado. Nenhum artefato histórico foi
reconstruído nesta execução. Novas provas substituem apenas as necessárias para
este candidato; elas não recuperam os outputs antigos. Orientação operacional
concreta no encaminhamento. README raiz conserva hash inicial e fica fora dos commits.
