# Evidência CF-016 — especificação financeira

- Estado da execução: **concluída no escopo documental**, iniciada em 21/09 e finalizada em 22/09/2026.
- Base: `45e156c3189fd9893a88e6adcc0df3903983f4b9`; diff local documental, sem commit novo nesta execução.
- Commit da entrega: `447581f072f67a3a51afd8ffb77852299425f23d` —
  `docs(CF-016): especificar regras financeiras`. Esta evidência é versionada em
  um commit posterior para registrar esse hash sem criar autorreferência circular.
- Modelo: sessão GPT-6; variante/esforço efetivos não expostos pela ferramenta.
  Metadados solicitados pela tarefa: gpt-6-astra/xhigh; não presumir configuração
  apenas pela leitura do Markdown. Sem subagentes ou revisão independente nesta execução.
- Ambiente: Windows/PowerShell, Node v24.18.0, seed `cf016-v1`; relógio sintético
  descrito no guia. Sem navegador, viewport, conexão externa ou banco.
- Dependências integradas: CF-001 e CF-004 concluídas, artefatos presentes na base
  Git e parecer de revisão lido. [Revalidação 45e156c](../revalidacao-CF-015-RV01/README.md)
  autoriza início da especificação pelas dependências reais.
- CF-015 permanece **em_revisao exclusivamente por zoom nativo 200%**; R03/RV01
  encerrado. Seu arquivo e evidências anteriores são preservados por hash.

## Entregáveis e critérios

| Critério CF-016 | Entrega / resultado esperado independente | Validação |
|---|---|---|
| Tabela reconcilia cada evento | [49 estados/efeitos literais](eventos.csv), [reconciliação manual e 18 bordas](ORACLES.md), [precisão](precisao.json) | Verificador documental BigInt, sem função de produção; compatibilidade com 7 casos CF-001. |
| Abertura não é renda; pendente não é realizado; meta não cria ativo; pagamento não repete compra | [SPEC-004 FIN-01/02/03/05](../../../docs/sdd/specs/004-regras-financeiras.md); E01–E16, E31/E32/E39–E49 | Identidades de posição, caixa, resultado/avaliação e casos neutros; confronto estático atribuído às tarefas donas. |
| Negativo, taxa, arredondamento, estorno | FIN-01/04/06/07; E18–E38 e B01–B18 | Centavos exatos, custo proporcional, resto na última parcela, compensação vinculada; rejeições/concorrência documentadas para testes reais posteriores. |
| Evidências, limitações e testes não enfraquecidos | [15 divergências com donos](DIVERGENCIAS.md), [comandos](EXECUCOES.md), [snapshot inicial](base-inicial.json) | Mutações documentais em memória e hashes de preservação. Nenhum teste/assertion/snapshot anterior modificado. |

## Decisões, confronto e trade-offs

DEC-04 separa caixa, receita, consumo, resultado de investimento e compromisso;
escolhe fluxos anuais com seção atual datada e indisponibilidade histórica sem
cobertura. DEC-07 define precisão/limites, taxas, custo, alocação, limite gerencial
e estorno. A arquitetura permanece monólito modular; origens tipadas e operações
vinculadas evitam exigir ledger completo. Custo: evolução coordenada de dados,
projeções, contratos e controles concorrentes nas tarefas futuras.

Confronto feito **depois de fixar invariantes e sem usar o observado como expected**.
O código atual diverge em abertura/pendentes, transferências, natureza dos pagamentos,
centavos, destinação, custo/receita de investimento e reconstrução patrimonial.
O rótulo anual atual e o lock de fechamento de fatura foram reconhecidos como
avanços presentes; não reabrimos correções encerradas. Cada D16-* tem cenário,
fonte estática e dono CF-018/019/020/021/023, com suporte CF-017/024/025.

## Falha anterior, validação e limites

Não há correção de produto neste diff; por isso não há sequência vermelho→verde
de runtime declarada. Divergências foram confrontadas estaticamente, sem executar
serviços, HTTP ou SQL. O [verificador](verify.mjs) verifica consistência do material,
não regras da aplicação. Mutações documentais rejeitadas não certificam que testes
existentes detectam os defeitos de produto. Essa prova pertence às tarefas donas.

Resultado: **49/49 estados** reconciliados em três fusos, seis mutações documentais
rejeitadas, precisão/custo/parcelas aprovados e sete casos compatíveis com CF-001.
O verificador CF-001 passou com seus 39 critérios. O verificador antigo CF-004
**falhou** pelo campo `UpdatePlanItemDTO.dueDate` ausente do inventário; comparação
dos inputs com 45e156c demonstra lacuna preexistente D16-T01, atribuída à CF-008.
Nenhuma assertion foi retirada para tornar esse comando verde. O contrato temporal
necessário à especificação financeira está definido na SPEC-002 e permanece íntegro.

A primeira execução do verificador novo encontrou uma coluna vazia/zero adicional
em E19; o CSV foi corrigido sem mudar o expected financeiro nem relaxar a contagem
de colunas. [Falha inicial](validacao-inicial.log) preservada e [validação posterior](validacao.log)
aprovada. Trata-se de correção do artefato documental, não de bug de produto.

Não executados: Java/JUnit, build, lint global, PostgreSQL, API, integração, E2E,
visual ou CI remoto. Não são necessários para aprovar uma especificação sem
alterar produto; permanecem obrigatórios nas correções conforme política de testes.
Não houve push/deploy, alteração de banco real, instalação ou início de CF-017.

Revisão crítica própria cobre a distinção compra/pagamento, duplo patrimônio,
custos/taxas, histórico desconhecido e interações com concorrência/posse. Revisão
independente sugerida pela tarefa não foi executada nem é alegada. DEC-03 do ciclo
bancário continua CF-019; protocolo HTTP/recibo durável detalhado continua CF-024;
adoção temporal/proveniência/migração continua CF-017. Não impedem os efeitos
econômicos especificados, nem autorizam declarar tarefas dependentes prontas.

README raiz preexistente: SHA-256
`6235DA8E1D2247DAD2C585FE7B2E7B0D2FD41F47414A4A2701B20F7FBF7D12CA`.
Somente quatro arquivos preexistentes estão autorizados a mudar: CF-016, índice
SDD, ADR-002 e as duas linhas DEC-04/07 da SPEC-003. Nenhum arquivo de produto ou
teste anterior integra a lista. A especificação nova e evidências ficam nos
caminhos registrados no escopo da tarefa.

Preservação verificada: **1486 de 1490 arquivos preexistentes idênticos**; apenas
os quatro documentos autorizados mudaram. O README raiz conserva o hash acima.
O [manifesto final](manifesto-final.json) identifica por SHA-256 os arquivos novos
e modificados desta entrega; não inclui a si mesmo para evitar autorreferência.
