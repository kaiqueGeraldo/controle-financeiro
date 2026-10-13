# Parecer de resíduos

## P2 confirmado — CF014, ciclo visual da operação (vínculo RVR24-02)

Fonte: `controle-financeiro-frontend/src/components/forms/operationModal.tsx:135–136`, após await chama onSuccess/onClose. `src/components/modals/managers/investmentModalManager.tsx:19` mantém OperationModal montado entre fechamento e troca de ativo; `src/hooks/useCreationIntent.ts:90–100` protege owner/unmount, sem representar esse novo ciclo visual. Esses arquivos não mudaram em cdf0060..a991114: ocorrência adicional comprovada na revisão, não regressão atribuída ao saneamento.

Reprodução real: enviar BUY de A, quantidade2/preço10, deixar backend confirmar e reter entrega HTTP com route.fetch; Escape fecha operação/detalhe; abrir detalhe e operação de B; liberar resposta válida de A. Esperado: atualização global e resolução da intenção confirmada de A permitidas, operação B permanece aberta. Observado: callback de A fecha operação B. Detalhe B permanece com identidade correta.

Contrato: SPEC-003 AC-UI-008, resposta de execução anterior não deve controlar seleção/interação atual; AC-UI-011 quanto à coerência de operação/detalhe/releitura. Impacto: interrupção do formulário atual e perda de continuidade, sem evidência de duplicação financeira ou falsa confirmação. `browser-extra/investment-late-selection.json` registra um único POST, recibo A válido, conta980, A com2/custo20, B com0 e um movimento. Log SQL do harness confirma persistência descartável. `lifecycle-final.log` reproduz onClose indevido isoladamente.

Encerramento: vincular efeito visual ao ciclo/ativo/isOpen vigente, preservando refresh global legítimo e protocolo durável do recibo. Testar A→fechar→B com sucesso e falha tardios, sem reenviar ou eliminar intenção desconhecida. Verificação local O(1) evita reformular o protocolo financeiro; risco é bloquear também a atualização legítima, por isso as assertions positivas de refresh e resolução do recibo devem permanecer. Não há query ou gargalo N+1 demonstrado neste recorte. A função confirmed da linha61 merece o mesmo exame, mas seu caminho tardio não foi reproduzido separadamente aqui.

Aceites anteriores de RVR24-02 para unmount/owner A→B/A→B→A/expiração não foram revogados. Fechar visualmente o modal com o manager montado é recorte adicional. Não abrir um segundo achado global duplicado nem afirmar que onSuccess/limpeza de envelope confirmado são defeitos; ver [correção do probe](PROBE-LIFECYCLE.md).

## Ocorrência visual inconclusiva

No primeiro lote, histórico de investimento permaneceu opacity0 por 15s e impediu alcançar a operação. Captura de falha mostra região vazia. Isolado, sem mudança de assertions/timeout/produto, o mesmo cenário passou com opacity1, oito registros e retorno de foco. Isso aceita o resíduo original de foco, mas não explica a ocorrência inicial. Não classificar como falha financeira, RVA-03, ou prova de causa ambiental. Próxima observação delimitada: estado de animação/Framer/rAF e montagem do histórico se reaparecer; sem novas mutações financeiras só para obter imagem verde.

## Verificação faltante e investigação preservadas

Zoom nativo200%: capacidade suportada nova não identificada; não executado. RVA-03: sem hipótese adicional, permanece inconclusivo. Nenhuma dessas limitações bloqueia por associação os critérios próprios já comprovados da CF012. Nenhuma melhoria não impeditiva foi convertida em bloqueio novo.
