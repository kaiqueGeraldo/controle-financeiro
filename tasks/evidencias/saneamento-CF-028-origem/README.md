# R28-02 residual — atribuição incerta de fonte

Base `1c5453375d07ef824c9757f9fd6a761597bdc7ae`, branch
`codex/cf-028-contrato-onboarding`. Saneamento somente documental da
[revalidação independente](../revalidacao-CF-028-R28/README.md).
R28-01 permanece encerrado; CF-028 **em_revisao**, sem autoaprovação.

Correção residual sobre `bbbe8c3`: [totais E23/E28/E32/E34](../saneamento-CF-028-totais/README.md).
Gerador, cases.json e avaliador atuais corrigem apenas reservedAccounts:400/400/500/400
KNOWN. Origem individual e livres afetados continuam UNKNOWN; bloqueios inalterados.
verification.json foi atualizado; provas independentes e logs before-* são históricos.
snapshots.json foi regenerado e permaneceu idêntico (não contém os quatro casos).

## Decisão e causa

A política conservadora foi autorizada pelo usuário nesta conversa. DEC-ONB-02
registra a aplicação, sem atribuir ao usuário justificativa técnica ou prova
histórica: fonte certa restringe risco; candidatas comprováveis são todas afetadas;
sem delimitação, universo elegível do owner, salvo exclusões comprovadas. O bloqueio
é de novas alocações dependentes da disponibilidade incerta, não de toda aplicação.

Antes, “nessa fonte” não dizia o que fazer sem sourceId. Prova original intacta:
A1000/B500, reserva400 sem origem, novo500 em B. Dois mundos compatíveis resultam
500 ou900 reservados em B; não é possível certificar500 livres. Reproduzidos antes
de editar em [before-independent.json](before-independent.json) e
[before-verification.json](before-verification.json). Estes verdes documentais
confirmam a omissão textual, não execução de bug no produto.

## Evidência e preservação

[baseline.json](baseline.json): HEAD/base idênticos, ancestralidade confirmada,
sem commits posteriores, staging vazio. Único delta alheio README raiz, SHA256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Pareceres, scripts, resultados e fixtures de todas as entregas anteriores têm hashes
registrados e permanecem intactos. A pasta nova foi criada para guardar a baseline;
não era alteração preexistente. AGENTS da conversa aplicado, nenhum outro encontrado.
Lidos tasks/README, EXECUCAO, POLITICA-DE-TESTES, CF-028, SPEC-001, FIN-05/06,
ownership CF-023, concorrência §6 e parecer/provas da última revalidação completos.

## Regra corrigida e trade-offs

A definição canônica está em [SPEC-001 §5.1](../../../docs/sdd/specs/001-onboarding.md).
Attribution distingue CONFIRMED, CANDIDATES, UNBOUNDED e CLOSED. Não duplica os estados
de conhecimento monetário: origem e valor são dimensões independentes. Arrays vazios
não codificam origem desconhecida. Fonte nova/arquivada não apaga risco. Confirmações
atuais são auditáveis, verificadas por owner/revisão/consistência, sem história inventada.

Por fonte, bloqueios são união dos IDs pendentes. Uma prova exaustiva limita candidatas;
uma exclusão precisa valer para cada pendência. Ausência de vínculo ou ID novo não
prova independência. Saldo conhecido continua conhecido; reserva por fonte pode ser
UNKNOWN/PARTIAL e livre não certificável. Nominal400 sem origem aparece uma vez;
não se descontam400 de A e de B. Só partes atribuídas alimentam progresso monetário.

ASSIGN confirma todas as partes atuais; CLOSE declara inexistência atual da reserva.
São propostas no draft e efeitos de reconciliação somente no commit; não alteram
saldo nem criam receita/compra/transferência fictícia. Remover/corrigir proposta
recalcula o risco; PREPARED exige cancelamento. Resolver uma pendência não resolve outra.
Conclusão sem alocação proibida continua possível. Alocação independente válida é
aceita, proibida retorna400 atomicamente; mudança concorrente retorna409 e exige
nova revisão. Tokens já contratados passam a cobrir atribuição/evidência/inventário.

Alternativa de bloquear apenas sourceId conhecido é insegura; bloquear o usuário
inteiro prejudica consultas e fontes independentes. Conjuntos comprovados equilibram
esses riscos, ao custo de evidência versionada e UI mais explícita. Não aceitar
boolean de independência do browser evita confiança indevida. Declaração atual
resolve o presente, mas não verifica história externa: esse limite fica visível.
Não foram introduzidos locks/eventos/infraestrutura novos. Expansão de relações
fonte–pendência pode custar O(N×R); capacidade operacional continua requisito futuro.

## Casos, oráculos e contraprovas

[cases.json](cases.json): E21–E34 contêm entradas de fonte/reserva/evidência,
declarações, alocações, conjuntos esperados literais, saldo, totais, ação/status/motivo.
O gerador não importa o avaliador. O avaliador documental deriva das entradas,
sem usar componentes paralelos como autoridade. [snapshots.json](snapshots.json)
contém E16–E20 revalidados e E35 completo (origem ausente), com prepare, comando,
recibo e GET. E18/E19 agora têm origem comprovada explícita, mantendo todos os números.
E01 não muda; E16/E17 preservam agregados acima do teto. Originais são históricos.

| Casos | Resultado independente |
|---|---|
| E21/E26 | Origem A e valor desconhecido; A bloqueada, B500 disponível; reserva300 comprovada não certifica livre700 |
| E22 | Candidatas A/B; C800 independente pode destinar100, fica700 livre; nominal400 contado uma vez |
| E23/E28 | Indeterminada alcança A/B/C, inclusive C recém-criada; concluir sem alocar permitido; novo10 em C recusado |
| E24 | Encerrar reserva11 não libera B/C ainda afetadas pela12; A fica livre1000 |
| E25/E35 | Nominal400 sem origem, A1000/B500: novo500 em B recusado; sem esse comando conclusão permitida, saldos conhecidos e livre UNKNOWN |
| E27 | Encerrar reserva11 não cria movimento; B pode reservar500, saldo continua500 |
| E29/E33 | Mudança de inventário/independência ou revisão antes de confirmar→409; arquivar A não elimina legado |
| E30 | Confirmação atual250 em A/150 em B: livres750/350, saldo1000/500 e nominal400 preservados |
| E31 | Sem fontes atuais, UNBOUNDED persiste; não é CLOSED |
| E32 | Exclusão comprovada de C a mantém disponível apesar de origem indeterminada nas demais |
| E34 | Remover CLOSE do draft restaura pendência; nenhuma escrita financeira |

Nove contraprovas: ausência de origem como ausência de reserva, escolher A, liberar
candidata, bloquear independente, remover outra pendência ao encerrar uma, ignorar
versão, unknown→zero, permitir finalização proibida e fabricar histórico. Cópias/VM
em memória, falhas causais com controle positivo; hashes antes/depois comprovam
arquivos intactos. Prova adicional liga input E16 ao Summary e rejeita input1.00 com
resumo antigo, fechando a lacuna de verificador observada sem reabrir R28-01.

```powershell
node tasks/evidencias/saneamento-CF-028-origem/build-cases.mjs
node tasks/evidencias/saneamento-CF-028-origem/build-snapshots.mjs
node tasks/evidencias/saneamento-CF-028-origem/verify.mjs
git diff --check
```

Execução intermediária do verificador parou porque este README, já referenciado
pela SPEC, ainda não havia sido criado. Foi falha de completude do artefato, não
contraprova do defeito. Nenhuma assertion foi enfraquecida; resultado final fica
em [verification.json](verification.json). Verificações anteriores E01/R28 são
executadas intactas:9 grupos/5 corrupções e9 grupos/8 contraprovas.
Resultado do saneamento: sete grupos aprovados,14 casos dirigidos, seis snapshots
completos (E16–E20/E35) e nove contraprovas detectadas, com hashes antes/depois iguais.

Limites: simulador documental dirigido, não valida todo schema/combinação de produção,
autenticador, serialização HTTP, persistência, locks ou transação real. Oráculos são
literais, cálculos BigInt, IDs sintéticos; Number é usado somente para rótulos pequenos
dos IDs, nunca dinheiro. Sem builds, suites de produto ou repetição de TZ sem delta
temporal. Nenhuma declaração de comportamento runtime validado.

## Encaminhamento ao mesmo revisor

Revalidar **1c54533..HEAD desta entrega**, resíduo R28-02 apenas. SPEC §§2–5.1:
ausência de comandos versus ausência de reservas, extensão de draft/resumo,
atribuição/evidências/permissão, confirmações, totais, erros/hash. §6 custo/coordenação;
§7 E21–E35/fixtures atuais; §8 responsabilidades futuras. Tarefa registra continuação.
CF-029 terá persistência das declarações/evidências; CF-030 validação/revalidação;
CF-031 apresentação; CF-032 provas integradas. Nenhuma sucessora iniciada/liberada.

Critérios objetivos: casos sem sourceId determinam conjunto conservador; exclusão
comprovada preserva fonte independente; sobreposições não liberam prematuramente;
nominal não duplica; snapshots/recibos/GET mantêm estado e hashes; declaração atual
resolve sem transação fictícia; nova fonte/mudança de versão invalida revisão;
contraprovas causais detectadas; E01/E16–E20 e hashes históricos preservados.
R28-01 permanece encerrado, precisão/estados/protocolo/prazo vencido e ausência de
histórico fictício preservados. Somente revisor encerra R28-02. CF-028 em_revisao;
após aceite, sequência CF-010–015, sem implementação automática do onboarding.
