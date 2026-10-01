# Achados da revalidação — 01/10/2026

Base `5d0649a`, produto `30211b8..805f588`. Caminhos relativos à raiz. Não houve correção de produto nesta revisão. Os dois defeitos abaixo são resíduos do saneamento RV24-01; sua tarefa continua responsável, sem transferência para CF-026/027.

## RVR24-01 — P2 — resposta incompleta libera intenção e sinaliza sucesso

**Confirmado por componente com fault double HTTP.** Locais:

- `controle-financeiro-frontend/src/services/creationIntent.ts:29`: GET aceita result={} porque só verifica se é objeto, kind e operationId.
- `controle-financeiro-frontend/src/hooks/useCreationIntent.ts:54–60` e `:65–66`: qualquer resolução de send é seguida por complete, que remove o envelope.
- `controle-financeiro-frontend/src/services/investmentService.ts:52–57`: POST retorna apiRequest sem validar o DTO de resultado; JSON null/array válido sintaticamente passa.

Reprodução em [rv24-independent-review.test.tsx](rv24-independent-review.test.tsx):

1. Transação recebe erro502/desconhecido; GET retorna operationId e kind corretos, mas result={}. O modal chama onSuccess uma vez.
2. Operação de investimento usa investmentService/apiRequest reais, com fetch resolvendo200/null ou200/[]; os dois cenários chamam onSuccess uma vez.

Esperado: DTO incompatível não confirma resultado financeiro; manter identidade/corpo e estado de reconciliação, sem liberar intenção substituta. Observado: confirmação indevida e caminho de complete. [Log final](components-independent-final.log) contém três falhas causais desses cenários. Não se afirmou que o backend atual devolveu esses corpos ou que houve duplicação no banco: a prova é da reação do cliente à fronteira HTTP inválida; jornadas reais com resposta válida passaram.

Critério violado: RV24-01 exige falha/resposta inválida de recuperação sem sucesso fictício; AC-UI-005/009 e segurança dos parsers/contratos que CF-026 deve preservar. A validação de array de GET acrescentada pelo executor cobre somente uma forma inválida, não o contrato completo. A constraint JSON-object de V13 não substitui validação do DTO no consumidor.

Impacto: UI pode descartar a identidade e liberar nova operação sem confirmação coerente; perde a reconciliação segura prometida. P2 porque foi demonstrado por resposta defeituosa induzida, sem repetição econômica real observada no candidato. RV24-01 mantém sua prioridade históricaP1 e estado em_revisao.

Encerramento objetivo: validadores pequenos e explícitos por tipo de resultado (sem cast cego) ou consulta de recibo válido antes de complete; null/array/objeto vazio/campos obrigatórios inválidos em POST/recovery mantêm a identidade; respostas válidas ainda permitem nova intenção legítima. Passar os três vermelhos originais desta revisão e seus consumidores, mais SQL/reload após descarte de resposta. Não basta validar apenas envelope ou presença de qualquer objeto.

## RVR24-02 — P2 — investimento reconcilia após invalidar o consumidor

**Confirmado por componente.** Local: `controle-financeiro-frontend/src/components/forms/operationModal.tsx:129`; mecanismo relacionado em `useCreationIntent.ts:25–26/60`. O hook retorna false se o store ficou inativo, mas o modal interpreta todo false como autorização para chamar onReconcile.

Reprodução: POST de investimento fica pendente; desmontar o componente ou trocar principal A→B e só depois resolver a resposta. Em ambos os casos a identidade de A é preservada e onSuccess não roda, porém onReconcile roda uma vez. [Probe](rv24-independent-review.test.tsx), dois casos late investment response; [log](components-independent-final.log).

Esperado: resposta de um ciclo/owner invalidado não deve chamar callbacks do consumidor anterior. Observado: callback tardio, mesmo com supressão correta de onSuccess. Impacto: refresh e coordenação de requests podem ser disparados pelo ciclo antigo, inclusive cancelando/competindo com leitura atual; quebra a garantia declarada de cleanup. Não foi demonstrada divulgação de dados de A para B nem repetição de dinheiro.

Critério: ciclo de vida RV24-01 (troca de usuário/expiração/unmount invalidam callbacks) e preservação do cleanup da CF-026. Responsável: RV24-01, consumidor OperationModal; CF-026 não é automaticamente concluída nem reaberta por associação.

Encerramento: distinguir resultado pendente/erro de resultado obsoleto (por retorno discriminado ou guarda de ciclo de vida no consumidor); callback de reconciliação somente para operação do ciclo ativo. Os dois vermelhos devem passar mantendo envelope A, sem onSuccess/onReconcile/onClose tardios; cobrir também resposta tardia de erro e sessão expirada. Evitar desabilitar reconciliação válida só para passar o teste.

## H-RV24-01 — P2 de investigação — ECONNRESET no replay explícito do teste

**Falha de transporte observada, causa não isolada; não classificada como defeito financeiro.** Local de observação: `browser-review.spec.ts:70`, chamada page.request.post do replay após o retry de transação/pré-commit. A implementação financeira não lançou uma assertion de integridade: o cliente Playwright recebeu read ECONNRESET.

Execução `browser-dom`: cinco jornadas verdes e uma falha; SQL coletado mesmo depois da falha mostra conta975 para transaction-before e um lançamento25, em vez de uma segunda operação. A segunda intenção legítima ainda não tinha sido enviada. O cenário exato em `browser-before-isolated` passou depois, sem mudança no timeout/assertions financeiras. A primeira execução original também havia passado6/6.

Esperado: o harness observa uma resposta de replay e consegue terminar as verificações. Observado: reset de conexão sem resposta consumível. Log/SQL e trace sanitizado estão em `browser-dom/` e `browser-dom-failure/`. A captura final do cenário isolado mostra a tela carregada. Esses dados não estabelecem se a origem está em Next dev, cliente, processo ou produto; o verde posterior não fecha a causa.

Responsável: evidência integrada de RV24-01/infra de testes CF-003, sem transferir para RVA-03 ou H24-01. Encerramento: instrumentar passivamente a fronteira Playwright→BFF→backend, correlacionar request/commit/fechamento e reproduzir/classificar a interrupção; se houver defeito de harness/produto, provar correção causal. Não aumentar timeout, habilitar retry cego ou ocultar a execução original. Não bloqueia a fronteira backend CF-027 delimitada no parecer, mas impede anunciar confiabilidade irrestrita da execução integrada.

## Contraprovas, limitações e estado dos achados anteriores

- RV24-02: FK original reproduzida na cópia histórica; seis contratos atuais e três probes independentes aprovados. Encerrado no contrato de exclusão integral autorizado, com email sem entrega durável e alcance global de cache explicitamente preservados.
- Reenvio original RV24-01: reproduzido expected1/observed2 em ambos os modais históricos; candidato conserva UUID/corpo e provas reais mostram um efeito por intenção. O saneamento completo permanece pendente pelos resíduos acima.
- Capturas de loading do runner original eram insuficientes para aceite visual. O harness independente acrescentou espera por conteúdo; isso é correção da prova, não do produto. Não há certificação visual global/mobile/zoom.
- Um caso inicial de test.each interpretou [] como lista de argumentos e exercitou undefined. Parametrização foi corrigida para objeto de caso; array real também falha. Ambos os logs são preservados, sem trocar expected pelo observado.
- R03/RV01 permanecem preservados; RVA-03, RJ-022-01/H24-01, RV17-01/02, adoção real, zoom200% e revisão CF-026 não foram encerrados.
