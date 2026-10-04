# Achados, hipóteses e condições de encerramento

Base `06c1a516aa847088fa7b273601d618f69b489a21`. Somente probes/documentação; nenhum reparo de produto.

## RVR24-01 — P2 — bruto incompatível ainda libera intenção

Continuação do achado existente, responsável **RV24-01**, com impacto no critério de falso sucesso de CF-009. Não criar outro ID para a mesma confirmação indevida.

Local: `controle-financeiro-frontend/src/services/creationResult.ts:28–34`, especialmente o ramo sem `command.amount` na linha 34. Consumidores: POST/retry em `useCreationIntent.ts` e GET em `creationIntent.ts`; complete remove storage e retorna confirmed, usado pelo modal para sucesso/fechamento.

Reprodução mínima: BUY, quantidade 2, preço 100, taxa 0, data 2027-01-15. Resposta contém UUID válido, mesmo tipo/data/quantidade/preço/taxa, dateOrigin USER_INPUT, costDelta 200 e realizedResult null, porém **totalValue 999**. O expected independente é bruto 200 por FIN-04/FIN-06, e uma resposta incompatível não pode confirmar a intenção conforme RVR24-01/AC-UI-005/009/011 e DEC-10.

| Caminho | Esperado | Observado no candidato |
|---|---|---|
| POST inicial | unknown; envelope/identidade preservados | confirmed; storage e pending null |
| Retry após 502 desconhecido | mesmo comando/UUID; unknown; manter envelope | comando/UUID corretos, mas confirmed e envelope removido |
| GET após 502 desconhecido | identidade/kind corretos não bastam; conservar intenção | confirmed e envelope removido com result incompatível |

[Probe versionado](financial-result-review.test.tsx), [log causal](financial-result-causal.log), [reexecução reproduzível](frontend-probes/financial-result.log): três testes falham, um controle positivo passa. Soft assertions registram simultaneamente outcome e remoção indevida; não enfraquecem o critério. O teste positivo admite HALF_UP 1 × 1.005 → 1.01 e SELL com custo/resultado históricos null.

Impacto: a UI pode perder a chave necessária à reconciliação segura e liberar intenção substituta sem confirmação coerente. **Não foi demonstrado backend emitindo esse corpo, nem dinheiro duplicado por esse caso.** É defeito confirmado de defesa do consumidor na fronteira HTTP induzida, como o achado original, portanto P2 preservado. Integração real com corpos válidos e null/array/vazio mantém dinheiro correto; isso não neutraliza o vermelho novo.

Os casos originais result={}, POST null/array estão corrigidos e foram reexecutados; rejeitar todos os objetos tampouco satisfaria o contrato. Condição de encerramento: validar a consistência do bruto exigida pelo resultado de cada modalidade (ou obter confirmação coerente antes de complete), com precisão decimal/HALF_UP e sem recalcular custo histórico desconhecido. Os três casos devem passar preservando identidade/conteúdo em POST/retry/GET; conservar controles positivos, resgate monetário/zero de preço descritivo, recuperação autenticada e duas intenções legítimas iguais. Revalidar os consumidores e SQL/reload pertinentes após saneamento. Não corrigido nesta revisão.

## RVR24-02 — P2 — encerrado no alcance comprovado

Os dois vermelhos originais de callback após unmount/troca de owner foram reproduzidos com o código antigo, sem mudar assertions, e passam com `06c1a51`. Matriz residual cobre oito combinações de sucesso/erro × unmount/A→B/A→B→A/expiração, recuperação/retry obsoletos, intenção A preservada e recuperação válida posterior. Unknown/rejected ativos continuam reconciliando. Não há achado remanescente nesse resíduo demonstrado pelas provas atuais. Mudança futura nesses caminhos exige regressão; o encerramento não conclui RV24-01.

## Investigações preservadas, sem novo ID ou fechamento

| Investigação / responsável | Evidência histórica e limite | Próximo experimento dirigido |
|---|---|---|
| H-RV24-01 / RV24-01 + infra CF-003 | ECONNRESET no replay explícito Playwright; SQL histórico 975/um lançamento. Não ocorreu nas 12 jornadas novas. Ausência nesta rodada não classifica a causa | Instrumentação passiva request→BFF→backend→recibo/SQL; registrar primeiro reset/fechamento e distinguir falta de envio, commit e leitura de resposta |
| RVA-03 / CF-019, coordenação CF-024 | POST200/débito120/pagável0, UI sem saída observável no prazo histórico; não exercitada especificamente nesta revisão | Correlacionar fase de reconciliação/geração/rede e demonstrar saída ou recuperação sem novo POST; preservar primeiro trace |
| RJ-022-01 / CF-022 | Clique semanal sem POST, causa não isolada; não houve nova jornada browser desse fluxo | DOM/calllog/rede no primeiro clique para distinguir ausência de envio de estado persistido |
| H24-01 / CF-022 | Timeout de scheduler em gate antigo; cenário dirigido agora verde, sem prova causal da falha antiga | Correlacionar contexto/pool/pg_locks/fixture e callback registrado na primeira ocorrência; não aumentar timeout |

Não comprometem as aprovações delimitadas CF-025/026/027 ou a redação CF-028 pelas evidências disponíveis. RVR24-01, ao contrário, viola diretamente o critério de RV24-01/CF-009 e impede seus encerramentos.

## Lacunas de validação, não defeitos confirmados novos

Sem nova adoção temporal/banco real, zoom nativo 200%, matriz visual integral, recuperação de email ponta a ponta, benchmark de produção, corte TCP físico ou todos os navegadores. O incidente target perdeu outputs históricos; não depende deles a aprovação atual das garantias transacionais, que recebeu novas provas. A separação arquitetural continua de pacotes e a API usa JsonNode transitivamente; esses limites não são reclassificados como defeitos fora do escopo aceito.
